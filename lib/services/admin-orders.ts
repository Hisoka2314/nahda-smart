import {
  CustomerType,
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  Prisma,
  StockMovementType,
} from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { logAdminEvent } from "@/lib/auth/admin-auth";
import {
  customerTypeLabels,
  deliveryMethodLabels,
  formatDateTime,
  formatMoney,
  orderStatusLabels,
  paymentMethodLabels,
} from "@/lib/admin/labels";
import { adminOrderFiltersSchema } from "@/lib/validations/admin";
import {
  reserveStockForOrderItems,
  type StockReservationItem,
} from "@/lib/services/stock";
import {
  isOrderTransitionAllowed,
  shouldReleaseReservedStock,
  shouldReserveOnConfirmation,
} from "@/lib/services/order-transitions";

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerType: CustomerType;
  customerTypeLabel: string;
  total: number;
  totalLabel: string;
  deliveryMethod: DeliveryMethod;
  deliveryMethodLabel: string;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string;
  status: OrderStatus;
  statusLabel: string;
};

export type AdminOrderFilters = {
  q?: string;
  status?: OrderStatus;
  customerType?: CustomerType;
  payment?: PaymentMethod;
  delivery?: DeliveryMethod;
  date?: "today" | "7d" | "30d";
};

export type AdminOrderDetail = AdminOrderListItem & {
  subtotal: number;
  subtotalLabel: string;
  deliveryFee: number;
  deliveryFeeLabel: string;
  customerEmail?: string;
  customerCity?: string;
  customerAddress?: string;
  organizationName?: string;
  customerNote?: string;
  internalNote?: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    brandName: string;
    quantity: number;
    unitPrice: number;
    unitPriceLabel: string;
    totalPrice: number;
    totalPriceLabel: string;
  }>;
  statusHistory: Array<{
    id: string;
    status: OrderStatus;
    statusLabel: string;
    note?: string;
    changedBy?: string;
    createdAt: string;
  }>;
};

const orderListInclude = {
  customer: true,
} satisfies Prisma.OrderInclude;

const orderDetailInclude = {
  customer: true,
  items: {
    include: {
      product: {
        include: {
          brand: true,
        },
      },
    },
    orderBy: { id: "asc" },
  },
  statusHistory: {
    include: {
      changedBy: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.OrderInclude;

type OrderListPayload = Prisma.OrderGetPayload<{ include: typeof orderListInclude }>;
type OrderDetailPayload = Prisma.OrderGetPayload<{ include: typeof orderDetailInclude }>;

export async function getAdminOrders(rawFilters: AdminOrderFilters = {}) {
  const filters = adminOrderFiltersSchema.parse(rawFilters);
  const db = getPrismaClient();

  const orders = await db.order.findMany({
    where: buildOrderWhere(filters),
    include: orderListInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return orders.map(toAdminOrderListItem);
}

export async function getAdminOrderById(id: string) {
  const db = getPrismaClient();
  const order = await db.order.findUnique({
    where: { id },
    include: orderDetailInclude,
  });

  return order ? toAdminOrderDetail(order) : null;
}

export async function updateAdminOrderStatus({
  adminId,
  orderId,
  status,
  note,
}: {
  // Absent pour les actions systeme (purge planifiee) : l'historique et les
  // logs enregistrent alors un auteur nul.
  adminId?: string;
  orderId: string;
  status: OrderStatus;
  note?: string;
}) {
  const db = getPrismaClient();

  return db.$transaction(async (tx) => {
    const current = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    if (!current) {
      throw new Error("Commande introuvable.");
    }

    if (!isOrderTransitionAllowed(current.status, status)) {
      throw new Error("Transition de statut non autorisee.");
    }

    if (shouldReserveOnConfirmation(current.status, status)) {
      await reserveOrderStockIfNeeded(tx, current.orderNumber, current.items);
    }

    if (shouldReleaseReservedStock(current.status, status)) {
      await releaseReservedOrderStock(
        tx,
        current.orderNumber,
        adminId,
        status === "RETURNED"
          ? "Retour commande : reintegration au stock"
          : "Liberation reservation commande annulee avant expedition",
      );
    }

    // Mise a jour conditionnee sur le statut lu : si un autre admin a change
    // le statut entre-temps, la transaction echoue et la reservation ou la
    // liberation de stock ci-dessus est annulee (pas de double liberation).
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: current.status },
      data: { status },
    });

    if (updated.count !== 1) {
      throw new Error(
        "La commande a deja ete modifiee par un autre utilisateur. Rechargez la page.",
      );
    }

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status,
        note: cleanText(note) ?? `Statut mis a jour : ${orderStatusLabels[status]}`,
        changedById: adminId,
      },
    });

    await tx.adminLog.create({
      data: {
        adminId,
        action: "ADMIN_ORDER_STATUS_UPDATED",
        entity: "Order",
        entityId: orderId,
        metadata: {
          orderNumber: current.orderNumber,
          previousStatus: current.status,
          nextStatus: status,
        },
      },
    });

    return { id: orderId, status };
  });
}

const STALE_PENDING_ORDER_HOURS = 48;
const STALE_PENDING_ORDER_BATCH = 200;

// Annule en lot les commandes site restees en attente de confirmation :
// leur reservation bloque du stock vendable. Chaque annulation passe par
// updateAdminOrderStatus pour beneficier des gardes de transition, de la
// liberation de stock et de l'historique.
export async function cancelStalePendingOrders({
  adminId,
  olderThanHours = STALE_PENDING_ORDER_HOURS,
}: {
  adminId?: string;
  olderThanHours?: number;
}) {
  const db = getPrismaClient();
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  const staleOrders = await db.order.findMany({
    where: {
      status: OrderStatus.PENDING_CONFIRMATION,
      createdAt: { lt: cutoff },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: STALE_PENDING_ORDER_BATCH,
  });

  let cancelled = 0;

  for (const order of staleOrders) {
    try {
      await updateAdminOrderStatus({
        adminId,
        orderId: order.id,
        status: OrderStatus.CANCELLED,
        note: `Annulation automatique : commande non confirmee depuis plus de ${olderThanHours}h.`,
      });
      cancelled += 1;
    } catch {
      // Commande deja traitee entre-temps : on continue le lot.
    }
  }

  return { scanned: staleOrders.length, cancelled };
}

export async function updateAdminOrderInternalNote({
  adminId,
  orderId,
  internalNote,
}: {
  adminId: string;
  orderId: string;
  internalNote?: string;
}) {
  const db = getPrismaClient();
  const order = await db.order.update({
    where: { id: orderId },
    data: { internalNote: cleanText(internalNote) },
    select: { id: true, orderNumber: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_ORDER_INTERNAL_NOTE_UPDATED",
    entity: "Order",
    entityId: order.id,
    metadata: { orderNumber: order.orderNumber },
  });

  return order;
}

function buildOrderWhere(filters: AdminOrderFilters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.payment) where.paymentMethod = filters.payment;
  if (filters.delivery) where.deliveryMethod = filters.delivery;
  if (filters.customerType) where.customer = { type: filters.customerType };

  if (filters.date) {
    const now = new Date();
    const start = new Date(now);

    if (filters.date === "today") {
      start.setHours(0, 0, 0, 0);
    } else if (filters.date === "7d") {
      start.setDate(now.getDate() - 7);
    } else {
      start.setDate(now.getDate() - 30);
    }

    where.createdAt = { gte: start };
  }

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { phone: { contains: q, mode: "insensitive" } } },
      { customer: { organizationName: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}

function toAdminOrderListItem(order: OrderListPayload): AdminOrderListItem {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: formatDateTime(order.createdAt),
    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    customerType: order.customer.type,
    customerTypeLabel: customerTypeLabels[order.customer.type],
    total: Number(order.total),
    totalLabel: formatMoney(Number(order.total)),
    deliveryMethod: order.deliveryMethod,
    deliveryMethodLabel: deliveryMethodLabels[order.deliveryMethod],
    paymentMethod: order.paymentMethod,
    paymentMethodLabel: paymentMethodLabels[order.paymentMethod],
    status: order.status,
    statusLabel: orderStatusLabels[order.status],
  };
}

function toAdminOrderDetail(order: OrderDetailPayload): AdminOrderDetail {
  return {
    ...toAdminOrderListItem(order),
    subtotal: Number(order.subtotal),
    subtotalLabel: formatMoney(Number(order.subtotal)),
    deliveryFee: Number(order.deliveryFee),
    deliveryFeeLabel: formatMoney(Number(order.deliveryFee)),
    customerEmail: order.customer.email ?? undefined,
    customerCity: order.customer.city ?? undefined,
    customerAddress: order.customer.address ?? undefined,
    organizationName: order.customer.organizationName ?? undefined,
    customerNote: order.customerNote ?? undefined,
    internalNote: order.internalNote ?? undefined,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productSlug: item.product.slug,
      brandName: item.product.brand.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      unitPriceLabel: formatMoney(Number(item.unitPrice)),
      totalPrice: Number(item.totalPrice),
      totalPriceLabel: formatMoney(Number(item.totalPrice)),
    })),
    statusHistory: order.statusHistory.map((entry) => ({
      id: entry.id,
      status: entry.status,
      statusLabel: orderStatusLabels[entry.status],
      note: entry.note ?? undefined,
      changedBy: entry.changedBy
        ? `${entry.changedBy.name} (${entry.changedBy.email})`
        : undefined,
      createdAt: formatDateTime(entry.createdAt),
    })),
  };
}

async function reserveOrderStockIfNeeded(
  tx: Prisma.TransactionClient,
  orderNumber: string,
  items: StockReservationItem[],
) {
  const existingReservation = await tx.stockMovement.count({
    where: {
      reference: orderNumber,
      type: StockMovementType.RESERVED,
    },
  });

  if (existingReservation > 0) return;

  await reserveStockForOrderItems(tx, orderNumber, items);
}

async function releaseReservedOrderStock(
  tx: Prisma.TransactionClient,
  orderNumber: string,
  adminId: string | undefined,
  reason: string,
) {
  const reservations = await tx.stockMovement.findMany({
    where: {
      reference: orderNumber,
      type: StockMovementType.RESERVED,
    },
    select: {
      productId: true,
      depotId: true,
      quantity: true,
    },
  });

  for (const reservation of reservations) {
    await tx.stock.upsert({
      where: {
        productId_depotId: {
          productId: reservation.productId,
          depotId: reservation.depotId,
        },
      },
      create: {
        productId: reservation.productId,
        depotId: reservation.depotId,
        quantity: reservation.quantity,
        lowStockThreshold: 3,
      },
      update: {
        quantity: { increment: reservation.quantity },
      },
    });
    await tx.stockMovement.create({
      data: {
        productId: reservation.productId,
        depotId: reservation.depotId,
        type: StockMovementType.RELEASED,
        quantity: reservation.quantity,
        reference: orderNumber,
        reason,
        createdById: adminId,
      },
    });
  }
}

function cleanText(value?: string) {
  const text = value?.trim();
  return text ? text : undefined;
}
