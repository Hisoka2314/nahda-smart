import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import {
  timingEqualizerHash,
  verifyAdminPassword,
} from "@/lib/auth/password";
import { type AdminRole, Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { canAccessAdminSection, type AdminSection } from "@/lib/auth/permissions";
import {
  createAdminSession,
  destroyCurrentAdminSession,
  getCurrentAdminFromSession,
  type AuthenticatedAdmin,
  type RequestMetadata,
} from "@/lib/auth/session";

function hashEmailForLog(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export { hasUsableAdminPasswordHash } from "@/lib/auth/password";
export { verifyAdminPassword };

export async function logAdminEvent({
  adminId,
  action,
  entity,
  entityId,
  metadata,
}: {
  adminId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    const prisma = getPrismaClient();
    await prisma.adminLog.create({
      data: {
        adminId,
        action,
        entity,
        entityId,
        metadata,
      },
    });
  } catch (error) {
    console.error("AdminLog non enregistre.", error);
  }
}

const LOGIN_HISTORY_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_HISTORY_MAX_FAILURES = 5;

// Verrou complementaire au limiteur en memoire : les echecs de connexion
// sont deja journalises dans AdminLog, ce compteur resiste donc aux
// redemarrages du serveur et aux deploiements multi-instances.
export async function isLoginBlockedByHistory(email: string): Promise<boolean> {
  try {
    const prisma = getPrismaClient();
    const failures = await prisma.adminLog.count({
      where: {
        action: "ADMIN_LOGIN_FAILED",
        createdAt: { gte: new Date(Date.now() - LOGIN_HISTORY_WINDOW_MS) },
        metadata: {
          path: ["emailHash"],
          equals: hashEmailForLog(email),
        },
      },
    });

    return failures >= LOGIN_HISTORY_MAX_FAILURES;
  } catch {
    // En cas d'indisponibilite du journal, on retombe sur le limiteur memoire.
    return false;
  }
}

export async function hasConfiguredAdmin(): Promise<boolean> {
  const prisma = getPrismaClient();
  const count = await prisma.adminUser.count({
    where: { active: true },
  });

  return count > 0;
}

export async function authenticateAdmin({
  email,
  password,
  metadata,
}: {
  email: string;
  password: string;
  metadata?: RequestMetadata;
}): Promise<{ ok: true } | { ok: false }> {
  const prisma = getPrismaClient();
  const normalizedEmail = email.trim().toLowerCase();
  const admin = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  });

  let passwordOk = false;

  if (admin?.active === true) {
    passwordOk = verifyAdminPassword(password, admin.passwordHash);
  } else {
    verifyAdminPassword(password, timingEqualizerHash);
  }

  if (!admin || !passwordOk) {
    await logAdminEvent({
      action: "ADMIN_LOGIN_FAILED",
      entity: "AdminUser",
      entityId: admin?.id,
      metadata: {
        emailHash: hashEmailForLog(normalizedEmail),
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });
    return { ok: false };
  }

  await createAdminSession(admin.id, metadata);
  await logAdminEvent({
    adminId: admin.id,
    action: "ADMIN_LOGIN_SUCCESS",
    entity: "AdminUser",
    entityId: admin.id,
    metadata: {
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    },
  });

  return { ok: true };
}

export async function getCurrentAdmin(): Promise<AuthenticatedAdmin | null> {
  return getCurrentAdminFromSession();
}

export async function requireAdmin(): Promise<AuthenticatedAdmin> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}

export async function requireRole(
  allowedRoles: AdminRole[],
): Promise<AuthenticatedAdmin> {
  const admin = await requireAdmin();

  if (admin.role !== "SUPER_ADMIN" && !allowedRoles.includes(admin.role)) {
    await logAdminEvent({
      adminId: admin.id,
      action: "ADMIN_UNAUTHORIZED_ACCESS",
      entity: "AdminRole",
      metadata: {
        role: admin.role,
        allowedRoles,
      },
    });
    redirect("/admin/unauthorized");
  }

  return admin;
}

export async function requireAdminSection(
  section: AdminSection,
): Promise<AuthenticatedAdmin> {
  const admin = await requireAdmin();

  if (!canAccessAdminSection(admin.role, section)) {
    await logAdminEvent({
      adminId: admin.id,
      action: "ADMIN_UNAUTHORIZED_ACCESS",
      entity: "AdminSection",
      entityId: section,
      metadata: {
        role: admin.role,
      },
    });
    redirect("/admin/unauthorized");
  }

  return admin;
}

export async function logoutAdmin(): Promise<void> {
  const admin = await destroyCurrentAdminSession();

  if (admin) {
    await logAdminEvent({
      adminId: admin.id,
      action: "ADMIN_LOGOUT",
      entity: "AdminUser",
      entityId: admin.id,
    });
  }
}
