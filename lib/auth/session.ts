import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { AdminRole, AdminUser } from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/auth/session-constants";

export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export type AuthenticatedAdmin = Pick<
  AdminUser,
  "id" | "name" | "email" | "role" | "active"
> & {
  role: AdminRole;
};

export type RequestMetadata = {
  ipAddress?: string;
  userAgent?: string;
};

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}

export async function createAdminSession(
  adminId: string,
  metadata: RequestMetadata = {},
): Promise<void> {
  const prisma = getPrismaClient();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(
    Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
  );

  // Purge opportuniste a la connexion : les sessions expirees n'etaient
  // supprimees qu'a la presentation de leur propre cookie, donc la table
  // grossissait indefiniment pour les sessions jamais reutilisees.
  await prisma.adminSession
    .deleteMany({ where: { expiresAt: { lte: new Date() } } })
    .catch(() => undefined);

  await prisma.adminSession.create({
    data: {
      adminId,
      tokenHash,
      expiresAt,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, token, getCookieOptions());
}

export async function getCurrentAdminFromSession(): Promise<AuthenticatedAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const prisma = getPrismaClient();
  const tokenHash = hashSessionToken(token);
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { admin: true },
  });

  if (!session || !session.admin.active) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.adminSession.delete({ where: { id: session.id } });
    return null;
  }

  await prisma.adminSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return {
    id: session.admin.id,
    name: session.admin.name,
    email: session.admin.email,
    role: session.admin.role,
    active: session.admin.active,
  };
}

export async function destroyCurrentAdminSession(): Promise<AuthenticatedAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!token) {
    cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
    return null;
  }

  const prisma = getPrismaClient();
  const tokenHash = hashSessionToken(token);
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { admin: true },
  });

  if (session) {
    await prisma.adminSession.delete({ where: { id: session.id } });
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);

  if (!session?.admin) return null;

  return {
    id: session.admin.id,
    name: session.admin.name,
    email: session.admin.email,
    role: session.admin.role,
    active: session.admin.active,
  };
}
