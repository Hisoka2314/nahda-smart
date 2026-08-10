import {
  Prisma,
  ServiceTicketNoteType,
  ServiceTicketStatus,
  ServiceTicketUrgency,
} from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { logAdminEvent } from "@/lib/auth/admin-auth";
import {
  formatDateTime,
  getServiceTicketStatusTone,
  getServiceTicketUrgencyTone,
  serviceTicketNoteTypeLabels,
  serviceTicketStatusLabels,
  serviceTicketTypeLabels,
  serviceTicketUrgencyLabels,
} from "@/lib/admin/labels";
import {
  toAdminPaginatedResult,
  type AdminPagination,
} from "@/lib/admin/pagination";
import { createBusinessNumber } from "@/lib/services/orders";
import type {
  AdminServiceTicketCreateInput,
  AdminServiceTicketResolutionInput,
} from "@/lib/validations/admin-sav";

export type AdminServiceTicketFilters = {
  q?: string;
  status?: ServiceTicketStatus;
  urgency?: ServiceTicketUrgency;
  customerId?: string;
  productId?: string;
  date?: "today" | "7d" | "30d";
};

const ticketListInclude = {
  customer: { select: { id: true, name: true, phone: true } },
  product: { select: { id: true, name: true, sku: true } },
  order: { select: { id: true, orderNumber: true } },
  supplier: { select: { id: true, name: true } },
} satisfies Prisma.ServiceTicketInclude;

const ticketDetailInclude = {
  customer: true,
  product: { select: { id: true, name: true, sku: true, slug: true } },
  order: { select: { id: true, orderNumber: true, status: true, total: true } },
  supplier: { select: { id: true, name: true, type: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  notes: {
    include: { author: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  },
  statusHistory: {
    include: { changedBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.ServiceTicketInclude;

export async function getAdminServiceTicketsPage(
  filters: AdminServiceTicketFilters,
  pagination: AdminPagination,
) {
  const db = getPrismaClient();
  const where = buildTicketWhere(filters);
  const [total, tickets] = await Promise.all([
    db.serviceTicket.count({ where }),
    db.serviceTicket.findMany({
      where,
      include: ticketListInclude,
      orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  return toAdminPaginatedResult({
    items: tickets.map(toTicketListItem),
    total,
    page: pagination.page,
    perPage: pagination.perPage,
  });
}

export async function getAdminServiceTicketById(id: string) {
  const db = getPrismaClient();
  const ticket = await db.serviceTicket.findUnique({
    where: { id },
    include: ticketDetailInclude,
  });

  return ticket ? toTicketDetail(ticket) : null;
}

export async function getAdminServiceTicketFormData() {
  const db = getPrismaClient();
  const [customers, products, orders, suppliers, depots] = await Promise.all([
    db.customer.findMany({
      select: { id: true, name: true, phone: true, organizationName: true },
      orderBy: { updatedAt: "desc" },
      take: 250,
    }),
    db.product.findMany({
      select: { id: true, name: true, sku: true },
      orderBy: { name: "asc" },
      take: 250,
    }),
    db.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        customerId: true,
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
    db.supplier.findMany({
      where: { isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
      take: 120,
    }),
    db.depot.findMany({
      where: { isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    customers,
    products,
    orders: orders.map((order) => ({
      id: order.id,
      customerId: order.customerId,
      label: `${order.orderNumber} - ${formatDateTime(order.createdAt)}`,
    })),
    suppliers,
    depots,
  };
}

export async function createAdminServiceTicket({
  adminId,
  input,
}: {
  adminId: string;
  input: AdminServiceTicketCreateInput;
}) {
  const db = getPrismaClient();

  return db.$transaction(async (tx) => {
    await validateTicketRelations(tx, input);
    const ticketNumber = await createBusinessNumber("SAV");
    const ticket = await tx.serviceTicket.create({
      data: {
        ticketNumber,
        customerId: input.customerId,
        orderId: input.orderId,
        productId: input.productId,
        supplierId: input.supplierId,
        type: input.type,
        urgency: input.urgency,
        status: "NEW",
        problem: input.problem,
        internalNotes: input.internalNotes,
        createdById: adminId,
        statusHistory: {
          create: {
            status: "NEW",
            note: "Creation ticket SAV",
            changedById: adminId,
          },
        },
      },
      select: { id: true, ticketNumber: true },
    });

    await tx.adminLog.create({
      data: {
        adminId,
        action: "ADMIN_SERVICE_TICKET_CREATED",
        entity: "ServiceTicket",
        entityId: ticket.id,
        metadata: {
          ticketNumber,
          customerId: input.customerId,
          productId: input.productId,
          orderId: input.orderId,
          type: input.type,
          urgency: input.urgency,
        },
      },
    });

    return ticket;
  });
}

export async function updateAdminServiceTicketStatus({
  adminId,
  ticketId,
  status,
  note,
}: {
  adminId: string;
  ticketId: string;
  status: ServiceTicketStatus;
  note?: string;
}) {
  const db = getPrismaClient();

  return db.$transaction(async (tx) => {
    const ticket = await tx.serviceTicket.update({
      where: { id: ticketId },
      data: {
        status,
        // null et non undefined : undefined laissait la date de cloture en
        // place quand un ticket cloture etait rouvert, et il restait compte
        // comme clos dans les statistiques SAV.
        closedAt: status === "CLOSED" ? new Date() : null,
      },
      select: { id: true, ticketNumber: true, customerId: true, status: true },
    });

    await tx.serviceTicketStatusHistory.create({
      data: {
        ticketId,
        status,
        note,
        changedById: adminId,
      },
    });

    await tx.adminLog.create({
      data: {
        adminId,
        action: status === "CLOSED"
          ? "ADMIN_SERVICE_TICKET_CLOSED"
          : "ADMIN_SERVICE_TICKET_STATUS_UPDATED",
        entity: "ServiceTicket",
        entityId: ticketId,
        metadata: { ticketNumber: ticket.ticketNumber, status },
      },
    });

    return ticket;
  });
}

export async function addAdminServiceTicketNote({
  adminId,
  ticketId,
  type,
  content,
}: {
  adminId: string;
  ticketId: string;
  type: ServiceTicketNoteType;
  content: string;
}) {
  const db = getPrismaClient();
  const note = await db.serviceTicketNote.create({
    data: {
      ticketId,
      authorId: adminId,
      type,
      content,
      private: true,
    },
    select: { id: true, ticketId: true, type: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_SERVICE_TICKET_NOTE_CREATED",
    entity: "ServiceTicket",
    entityId: ticketId,
    metadata: { noteId: note.id, type: note.type },
  });

  return note;
}

export async function resolveAdminServiceTicket({
  adminId,
  input,
}: {
  adminId: string;
  input: AdminServiceTicketResolutionInput;
}) {
  const db = getPrismaClient();

  return db.$transaction(async (tx) => {
    const ticket = await tx.serviceTicket.findUnique({
      where: { id: input.ticketId },
      select: {
        id: true,
        ticketNumber: true,
        productId: true,
        status: true,
      },
    });

    if (!ticket) throw new Error("Ticket SAV introuvable.");

    const nextStatus = resolutionStatus(input.action);
    if (input.action !== "CLOSE" && !ticket.productId) {
      throw new Error("Produit requis pour cette action SAV.");
    }

    if (input.action === "REPAIR" && input.returnToStock) {
      await applySavStockDelta({
        tx,
        productId: ticket.productId!,
        depotId: input.depotId!,
        delta: input.quantity,
        type: "IN",
        reference: ticket.ticketNumber,
        reason: "SAV repare - retour stock",
        adminId,
      });
    }

    if (input.action === "REPLACE") {
      await applySavStockDelta({
        tx,
        productId: ticket.productId!,
        depotId: input.depotId!,
        delta: -input.quantity,
        type: "OUT",
        reference: ticket.ticketNumber,
        reason: "SAV remplacement client",
        adminId,
      });
    }

    const updated = await tx.serviceTicket.update({
      where: { id: input.ticketId },
      data: {
        status: nextStatus,
        closedAt: nextStatus === "CLOSED" ? new Date() : undefined,
      },
      select: { id: true, ticketNumber: true, status: true },
    });

    await tx.serviceTicketStatusHistory.create({
      data: {
        ticketId: input.ticketId,
        status: nextStatus,
        note: input.note,
        changedById: adminId,
      },
    });

    if (input.note) {
      await tx.serviceTicketNote.create({
        data: {
          ticketId: input.ticketId,
          authorId: adminId,
          type: "RESOLUTION",
          content: input.note,
          private: true,
        },
      });
    }

    await tx.adminLog.create({
      data: {
        adminId,
        action: serviceActionLog(input.action),
        entity: "ServiceTicket",
        entityId: input.ticketId,
        metadata: {
          ticketNumber: ticket.ticketNumber,
          action: input.action,
          status: nextStatus,
          depotId: input.depotId,
          quantity: input.quantity,
          returnToStock: input.returnToStock,
        },
      },
    });

    return updated;
  });
}

function toTicketListItem(
  ticket: Prisma.ServiceTicketGetPayload<{ include: typeof ticketListInclude }>,
) {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    customerName: ticket.customer.name,
    customerPhone: ticket.customer.phone,
    productName: ticket.product?.name ?? "-",
    productSku: ticket.product?.sku ?? "",
    orderNumber: ticket.order?.orderNumber ?? "-",
    supplierName: ticket.supplier?.name ?? "-",
    typeLabel: serviceTicketTypeLabels[ticket.type],
    urgency: ticket.urgency,
    urgencyLabel: serviceTicketUrgencyLabels[ticket.urgency],
    urgencyTone: getServiceTicketUrgencyTone(ticket.urgency),
    status: ticket.status,
    statusLabel: serviceTicketStatusLabels[ticket.status],
    statusTone: getServiceTicketStatusTone(ticket.status),
    createdAt: formatDateTime(ticket.createdAt),
    updatedAt: formatDateTime(ticket.updatedAt),
  };
}

function toTicketDetail(
  ticket: Prisma.ServiceTicketGetPayload<{ include: typeof ticketDetailInclude }>,
) {
  return {
    ...toTicketListItem(ticket),
    customerId: ticket.customerId,
    customer: {
      id: ticket.customer.id,
      name: ticket.customer.name,
      phone: ticket.customer.phone,
      email: ticket.customer.email ?? "",
      city: ticket.customer.city ?? "",
      organizationName: ticket.customer.organizationName ?? "",
    },
    productId: ticket.productId ?? "",
    product: ticket.product,
    orderId: ticket.orderId ?? "",
    order: ticket.order
      ? {
          id: ticket.order.id,
          orderNumber: ticket.order.orderNumber,
          status: ticket.order.status,
          total: Number(ticket.order.total),
        }
      : null,
    supplierId: ticket.supplierId ?? "",
    supplier: ticket.supplier,
    type: ticket.type,
    typeLabel: serviceTicketTypeLabels[ticket.type],
    urgency: ticket.urgency,
    problem: ticket.problem,
    internalNotes: ticket.internalNotes ?? "",
    closedAt: ticket.closedAt ? formatDateTime(ticket.closedAt) : "",
    createdBy: ticket.createdBy?.name ?? "-",
    notes: ticket.notes.map((note) => ({
      id: note.id,
      type: note.type,
      typeLabel: serviceTicketNoteTypeLabels[note.type],
      content: note.content,
      author: note.author?.name ?? "Admin",
      createdAt: formatDateTime(note.createdAt),
    })),
    statusHistory: ticket.statusHistory.map((history) => ({
      id: history.id,
      status: history.status,
      statusLabel: serviceTicketStatusLabels[history.status],
      tone: getServiceTicketStatusTone(history.status),
      note: history.note ?? "",
      changedBy: history.changedBy?.name ?? "Admin",
      createdAt: formatDateTime(history.createdAt),
    })),
  };
}

function buildTicketWhere(
  filters: AdminServiceTicketFilters,
): Prisma.ServiceTicketWhereInput {
  const where: Prisma.ServiceTicketWhereInput = {};
  const q = filters.q?.trim();

  if (filters.status) where.status = filters.status;
  if (filters.urgency) where.urgency = filters.urgency;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.productId) where.productId = filters.productId;

  if (filters.date) {
    const now = new Date();
    const start = new Date(now);
    if (filters.date === "today") start.setHours(0, 0, 0, 0);
    if (filters.date === "7d") start.setDate(now.getDate() - 7);
    if (filters.date === "30d") start.setDate(now.getDate() - 30);
    where.createdAt = { gte: start };
  }

  if (q) {
    where.OR = [
      { ticketNumber: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { phone: { contains: q, mode: "insensitive" } } },
      { product: { name: { contains: q, mode: "insensitive" } } },
      { product: { sku: { contains: q, mode: "insensitive" } } },
      { order: { orderNumber: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}

async function validateTicketRelations(
  tx: Prisma.TransactionClient,
  input: AdminServiceTicketCreateInput,
) {
  const customer = await tx.customer.findUnique({
    where: { id: input.customerId },
    select: { id: true },
  });
  if (!customer) throw new Error("Client introuvable.");

  if (input.orderId) {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      select: { customerId: true },
    });
    if (!order || order.customerId !== input.customerId) {
      throw new Error("Commande incompatible avec le client.");
    }
  }

  if (input.productId) {
    const product = await tx.product.findUnique({
      where: { id: input.productId },
      select: { id: true },
    });
    if (!product) throw new Error("Produit introuvable.");
  }

  if (input.supplierId) {
    const supplier = await tx.supplier.findUnique({
      where: { id: input.supplierId },
      select: { id: true },
    });
    if (!supplier) throw new Error("Fournisseur introuvable.");
  }
}

async function applySavStockDelta({
  tx,
  productId,
  depotId,
  delta,
  type,
  reference,
  reason,
  adminId,
}: {
  tx: Prisma.TransactionClient;
  productId: string;
  depotId: string;
  delta: number;
  type: "IN" | "OUT";
  reference: string;
  reason: string;
  adminId: string;
}) {
  const existing = await tx.stock.findUnique({
    where: { productId_depotId: { productId, depotId } },
  });
  const nextQuantity = (existing?.quantity ?? 0) + delta;

  if (nextQuantity < 0) {
    throw new Error("Stock insuffisant pour action SAV.");
  }

  await tx.stock.upsert({
    where: { productId_depotId: { productId, depotId } },
    create: {
      productId,
      depotId,
      quantity: nextQuantity,
      lowStockThreshold: existing?.lowStockThreshold ?? 3,
    },
    update: { quantity: nextQuantity },
  });

  await tx.stockMovement.create({
    data: {
      productId,
      depotId,
      type,
      quantity: Math.abs(delta),
      reason,
      reference,
      createdById: adminId,
    },
  });
}

function resolutionStatus(
  action: AdminServiceTicketResolutionInput["action"],
): ServiceTicketStatus {
  if (action === "REPAIR") return "REPAIRED";
  if (action === "REPLACE") return "REPLACED";
  return "CLOSED";
}

function serviceActionLog(action: AdminServiceTicketResolutionInput["action"]) {
  if (action === "REPAIR") return "ADMIN_SERVICE_TICKET_REPAIRED";
  if (action === "REPLACE") return "ADMIN_SERVICE_TICKET_REPLACED";
  return "ADMIN_SERVICE_TICKET_CLOSED";
}
