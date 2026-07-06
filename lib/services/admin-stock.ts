import { Prisma, StockMovementType } from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { logAdminEvent } from "@/lib/auth/admin-auth";
import { checkLowStockAndNotify } from "@/lib/services/stock-alerts";
import {
  formatDateTime,
  getStockTone,
  stockMovementTypeLabels,
} from "@/lib/admin/labels";
import {
  toAdminPaginatedResult,
  type AdminPagination,
} from "@/lib/admin/pagination";

export type AdminStockFilters = {
  q?: string;
  depotId?: string;
  stock?: "low" | "out";
};

export async function getAdminStockRows(filters: AdminStockFilters = {}) {
  const db = getPrismaClient();
  const stocks = await db.stock.findMany({
    where: buildStockWhere(filters),
    include: {
      depot: true,
      product: {
        include: {
          brand: true,
          category: true,
        },
      },
    },
    orderBy: [{ depot: { name: "asc" } }, { product: { name: "asc" } }],
    take: 120,
  });

  return stocks.map((stock) => ({
    id: stock.id,
    productId: stock.productId,
    productName: stock.product.name,
    productSku: stock.product.sku,
    productSlug: stock.product.slug,
    brandName: stock.product.brand.name,
    categoryName: stock.product.category.name,
    depotId: stock.depotId,
    depotName: stock.depot.name,
    quantity: stock.quantity,
    lowStockThreshold: stock.lowStockThreshold,
    tone: getStockTone(stock.quantity, stock.lowStockThreshold),
  }));
}

export async function getAdminStockRowsPage(
  filters: AdminStockFilters = {},
  pagination: AdminPagination,
) {
  const db = getPrismaClient();
  const where = buildStockWhere(filters);
  const [total, stocks] = await Promise.all([
    db.stock.count({ where }),
    db.stock.findMany({
      where,
      include: {
        depot: true,
        product: {
          include: {
            brand: true,
            category: true,
          },
        },
      },
      orderBy: [{ depot: { name: "asc" } }, { product: { name: "asc" } }],
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  return toAdminPaginatedResult({
    items: stocks.map((stock) => ({
      id: stock.id,
      productId: stock.productId,
      productName: stock.product.name,
      productSku: stock.product.sku,
      productSlug: stock.product.slug,
      brandName: stock.product.brand.name,
      categoryName: stock.product.category.name,
      depotId: stock.depotId,
      depotName: stock.depot.name,
      quantity: stock.quantity,
      lowStockThreshold: stock.lowStockThreshold,
      tone: getStockTone(stock.quantity, stock.lowStockThreshold),
    })),
    total,
    page: pagination.page,
    perPage: pagination.perPage,
  });
}

export async function getAdminStockMovements(productId?: string) {
  const db = getPrismaClient();
  const movements = await db.stockMovement.findMany({
    where: productId ? { productId } : undefined,
    include: {
      product: { select: { name: true, sku: true } },
      depot: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return movements.map((movement) => ({
    id: movement.id,
    productName: movement.product.name,
    productSku: movement.product.sku,
    depotName: movement.depot.name,
    type: movement.type,
    typeLabel: stockMovementTypeLabels[movement.type],
    quantity: movement.quantity,
    reason: movement.reason ?? "",
    reference: movement.reference ?? "",
    createdBy: movement.createdBy?.name,
    createdAt: formatDateTime(movement.createdAt),
  }));
}

export async function createAdminStockMovement({
  adminId,
  productId,
  depotId,
  targetDepotId,
  type,
  quantity,
  reason,
  reference,
  lowStockThreshold,
}: {
  adminId: string;
  productId: string;
  depotId: string;
  targetDepotId?: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  reference?: string;
  lowStockThreshold: number;
}) {
  const db = getPrismaClient();

  return db.$transaction(async (tx) => {
    if (type === "TRANSFER") {
      if (!targetDepotId) throw new Error("Depot destination obligatoire.");
      await applyStockDelta(tx, productId, depotId, -quantity, lowStockThreshold);
      await applyStockDelta(tx, productId, targetDepotId, quantity, lowStockThreshold);
      await tx.stockMovement.create({
        data: {
          productId,
          depotId,
          type,
          quantity,
          reason,
          reference: reference ?? `Transfert vers ${targetDepotId}`,
          createdById: adminId,
        },
      });
      await tx.stockMovement.create({
        data: {
          productId,
          depotId: targetDepotId,
          type: "IN",
          quantity,
          reason: reason ?? "Transfert entrant",
          reference,
          createdById: adminId,
        },
      });
    } else {
      const delta =
        type === "IN" || type === "RELEASED"
          ? quantity
          : type === "ADJUSTMENT"
            ? quantity
            : -quantity;
      await applyStockDelta(tx, productId, depotId, delta, lowStockThreshold);
      await tx.stockMovement.create({
        data: {
          productId,
          depotId,
          type,
          quantity,
          reason,
          reference,
          createdById: adminId,
        },
      });
    }

    await tx.adminLog.create({
      data: {
        adminId,
        action: "ADMIN_STOCK_MOVEMENT_CREATED",
        entity: "Stock",
        entityId: productId,
        metadata: { productId, depotId, targetDepotId, type, quantity },
      },
    });
  }).then((result) => {
    // Hors transaction : alerte si le mouvement fait passer sous le seuil.
    checkLowStockAndNotify([productId]);
    return result;
  });
}

export async function updateAdminStockThreshold({
  adminId,
  productId,
  depotId,
  lowStockThreshold,
}: {
  adminId: string;
  productId: string;
  depotId: string;
  lowStockThreshold: number;
}) {
  const db = getPrismaClient();
  const stock = await db.stock.upsert({
    where: { productId_depotId: { productId, depotId } },
    create: { productId, depotId, quantity: 0, lowStockThreshold },
    update: { lowStockThreshold },
    select: { id: true, productId: true, depotId: true, lowStockThreshold: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_STOCK_THRESHOLD_UPDATED",
    entity: "Stock",
    entityId: stock.id,
    metadata: { productId, depotId, lowStockThreshold },
  });

  return stock;
}

async function applyStockDelta(
  tx: Prisma.TransactionClient,
  productId: string,
  depotId: string,
  delta: number,
  lowStockThreshold: number,
) {
  // Increment/decrement atomique : un read-modify-write perdrait des mises a
  // jour sous concurrence. Le decrement est conditionne pour ne jamais passer
  // sous zero.
  if (delta < 0) {
    const updated = await tx.stock.updateMany({
      where: { productId, depotId, quantity: { gte: -delta } },
      data: { quantity: { increment: delta } },
    });

    if (updated.count !== 1) {
      throw new Error("Stock insuffisant. Operation refusee.");
    }

    return;
  }

  const updated = await tx.stock.updateMany({
    where: { productId, depotId },
    data: { quantity: { increment: delta } },
  });

  if (updated.count === 0) {
    await tx.stock.create({
      data: { productId, depotId, quantity: delta, lowStockThreshold },
    });
  }
}

function buildStockWhere(filters: AdminStockFilters): Prisma.StockWhereInput {
  const where: Prisma.StockWhereInput = {};

  if (filters.depotId) where.depotId = filters.depotId;
  if (filters.stock === "low") {
    // Compare au seuil configure par ligne de stock, pas a une valeur fixe.
    where.quantity = { lte: getPrismaClient().stock.fields.lowStockThreshold };
  }
  if (filters.stock === "out") where.quantity = { lte: 0 };

  const q = filters.q?.trim();
  if (q) {
    where.product = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { brand: { name: { contains: q, mode: "insensitive" } } },
      ],
    };
  }

  return where;
}
