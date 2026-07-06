import { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { logAdminEvent } from "@/lib/auth/admin-auth";
import { depotTypeLabels, formatDateTime } from "@/lib/admin/labels";
import {
  toAdminPaginatedResult,
  type AdminPagination,
} from "@/lib/admin/pagination";
import type { adminDepotSchema } from "@/lib/validations/admin-catalogue";
import type { z } from "zod";

export type AdminDepotInput = z.infer<typeof adminDepotSchema>;
export type AdminDepotFilters = {
  q?: string;
  status?: "active" | "inactive";
};

export async function getAdminDepots() {
  const db = getPrismaClient();
  const depots = await db.depot.findMany({
    include: {
      stocks: {
        select: { productId: true, quantity: true },
      },
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return depots.map((depot) => ({
    id: depot.id,
    name: depot.name,
    type: depot.type,
    typeLabel: depotTypeLabels[depot.type],
    address: depot.address ?? "",
    managerName: depot.managerName ?? "",
    isActive: depot.isActive,
    productCount: new Set(depot.stocks.map((stock) => stock.productId)).size,
    stockTotal: depot.stocks.reduce((sum, stock) => sum + stock.quantity, 0),
    createdAt: formatDateTime(depot.createdAt),
    updatedAt: formatDateTime(depot.updatedAt),
  }));
}

export async function getAdminDepotsPage(
  filters: AdminDepotFilters,
  pagination: AdminPagination,
) {
  const db = getPrismaClient();
  const where = buildDepotWhere(filters);
  const [total, depots] = await Promise.all([
    db.depot.count({ where }),
    db.depot.findMany({
      where,
      include: {
        stocks: {
          select: { productId: true, quantity: true },
        },
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  return toAdminPaginatedResult({
    items: depots.map((depot) => ({
      id: depot.id,
      name: depot.name,
      type: depot.type,
      typeLabel: depotTypeLabels[depot.type],
      address: depot.address ?? "",
      managerName: depot.managerName ?? "",
      isActive: depot.isActive,
      productCount: new Set(depot.stocks.map((stock) => stock.productId)).size,
      stockTotal: depot.stocks.reduce((sum, stock) => sum + stock.quantity, 0),
      createdAt: formatDateTime(depot.createdAt),
      updatedAt: formatDateTime(depot.updatedAt),
    })),
    total,
    page: pagination.page,
    perPage: pagination.perPage,
  });
}

export async function getAdminDepotById(id: string) {
  const db = getPrismaClient();
  return db.depot.findUnique({
    where: { id },
    include: {
      stocks: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { product: { name: "asc" } },
      },
    },
  });
}

export async function createAdminDepot(adminId: string, input: AdminDepotInput) {
  const db = getPrismaClient();
  const depot = await db.depot.create({
    data: depotData(input),
    select: { id: true, name: true, type: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_DEPOT_CREATED",
    entity: "Depot",
    entityId: depot.id,
    metadata: { name: depot.name, type: depot.type },
  });

  return depot;
}

export async function updateAdminDepot(adminId: string, input: AdminDepotInput & { id: string }) {
  const db = getPrismaClient();
  const depot = await db.depot.update({
    where: { id: input.id },
    data: depotData(input),
    select: { id: true, name: true, type: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_DEPOT_UPDATED",
    entity: "Depot",
    entityId: depot.id,
    metadata: { name: depot.name, type: depot.type },
  });

  return depot;
}

function depotData(input: AdminDepotInput): Prisma.DepotUncheckedCreateInput {
  return {
    name: input.name,
    type: input.type,
    address: input.address,
    managerName: input.managerName,
    isActive: input.isActive,
  };
}

function buildDepotWhere(filters: AdminDepotFilters): Prisma.DepotWhereInput {
  const where: Prisma.DepotWhereInput = {};
  const q = filters.q?.trim();

  if (filters.status === "active") where.isActive = true;
  if (filters.status === "inactive") where.isActive = false;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
      { managerName: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}
