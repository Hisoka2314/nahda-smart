import { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { formatDateTime } from "@/lib/admin/labels";
import {
  toAdminPaginatedResult,
  type AdminPagination,
} from "@/lib/admin/pagination";

export type AdminLogListItem = {
  id: string;
  createdAt: string;
  adminName?: string;
  adminEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadataSummary?: string;
};

// Journal d'audit : plafonne aux 100 dernieres lignes sans pagination, il
// devenait inexploitable pour retrouver une action ancienne.
export async function getAdminLogsPage(pagination: AdminPagination) {
  const db = getPrismaClient();
  const [total, logs] = await Promise.all([
    db.adminLog.count(),
    db.adminLog.findMany({
      include: { admin: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  return toAdminPaginatedResult({
    items: logs.map(toAdminLogListItem),
    total,
    page: pagination.page,
    perPage: pagination.perPage,
  });
}

export async function getAdminLogs() {
  const db = getPrismaClient();
  const logs = await db.adminLog.findMany({
    include: {
      admin: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return logs.map(toAdminLogListItem);
}

function toAdminLogListItem(
  log: Prisma.AdminLogGetPayload<{
    include: { admin: { select: { name: true; email: true } } };
  }>,
): AdminLogListItem {
  return {
    id: log.id,
    createdAt: formatDateTime(log.createdAt),
    adminName: log.admin?.name,
    adminEmail: log.admin?.email,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId ?? undefined,
    metadataSummary: summarizeMetadata(log.metadata),
  };
}

function summarizeMetadata(metadata: Prisma.JsonValue | null) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return undefined;
  }

  const safeMetadata = { ...metadata } as Record<string, unknown>;
  delete safeMetadata.password;
  delete safeMetadata.passwordHash;
  delete safeMetadata.token;
  delete safeMetadata.tokenHash;
  delete safeMetadata.secret;

  const entries = Object.entries(safeMetadata)
    .filter(([, value]) => value !== undefined && value !== null)
    .slice(0, 5);

  if (entries.length === 0) return undefined;

  return entries
    .map(([key, value]) => `${key}: ${String(value).slice(0, 60)}`)
    .join(" | ");
}
