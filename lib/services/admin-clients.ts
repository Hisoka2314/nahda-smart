import {
  type AdminRole,
  CustomerLevel,
  CustomerNoteType,
  CustomerRelationshipStatus,
  CustomerSource,
  CustomerType,
  OrderStatus,
  Prisma,
  ProductStatus,
  type DeliveryMethod,
  type PaymentMethod,
} from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { logAdminEvent } from "@/lib/auth/admin-auth";
import {
  customerLevelLabels,
  customerNoteTypeLabels,
  customerRelationshipStatusLabels,
  customerSourceLabels,
  customerTypeLabels,
  deliveryMethodLabels,
  formatDateTime,
  formatMoney,
  formatShortDate,
  getCustomerRelationshipTone,
  orderStatusLabels,
  paymentMethodLabels,
} from "@/lib/admin/labels";
import {
  toAdminPaginatedResult,
  type AdminPagination,
} from "@/lib/admin/pagination";
import {
  adminCustomerFiltersSchema,
  adminCustomerSchema,
  adminManualOrderSchema,
  type AdminCustomerFiltersInput,
  type AdminCustomerInput,
  type AdminManualOrderInput,
} from "@/lib/validations/admin-crm";
import { createBusinessNumber } from "@/lib/services/orders";
import { roundMoney } from "@/lib/utils";

export const customerTagLabels: Record<string, string> = {
  fidele: "Fidele",
  "gros-client": "Gros client",
  b2b: "B2B",
  "sensible-prix": "Sensible prix",
  "livraison-rapide": "Livraison rapide",
  "paiement-retarde": "Paiement retarde",
  "besoin-support": "Besoin support",
  installation: "Installation",
};

export type AdminClientListItem = {
  id: string;
  reference: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  type: CustomerType;
  typeLabel: string;
  level: CustomerLevel;
  levelLabel: string;
  relationshipStatus: CustomerRelationshipStatus;
  relationshipStatusLabel: string;
  relationshipTone: "success" | "warning" | "danger" | "info" | "muted";
  source: CustomerSource;
  sourceLabel: string;
  organizationName?: string;
  tags: string[];
  tagLabels: string[];
  createdAt: string;
  orderCount: number;
  cancelledOrderCount: number;
  totalSpent: number;
  totalSpentLabel: string;
  lastOrderAt?: string;
};

export type AdminClientDetail = AdminClientListItem & {
  address?: string;
  internalNotes?: string;
  quotes: Array<{
    id: string;
    quoteNumber: string;
    status: string;
    needType?: string;
    urgency?: string;
    createdAt: string;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: OrderStatus;
    statusLabel: string;
    totalLabel: string;
    createdAt: string;
  }>;
  productsBought: Array<{
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    totalLabel: string;
  }>;
  contactMessages: Array<{
    id: string;
    subject: string;
    status: string;
    createdAt: string;
  }>;
  notes: Array<{
    id: string;
    type: CustomerNoteType;
    typeLabel: string;
    content: string;
    author?: string;
    createdAt: string;
  }>;
};

export type AdminClientFormData = {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  type?: CustomerType;
  source?: CustomerSource;
  level?: CustomerLevel;
  relationshipStatus?: CustomerRelationshipStatus;
  organizationName?: string;
  internalNotes?: string;
  tags: string[];
};

export type ManualOrderProductOption = {
  id: string;
  name: string;
  sku: string;
  brandName: string;
  price: number;
  priceLabel: string;
  status: ProductStatus;
  stockTotal: number;
};

export type ManualOrderDepotOption = {
  id: string;
  name: string;
};

type CustomerWithOrders = Prisma.CustomerGetPayload<{
  include: {
    orders: {
      select: {
        id: true;
        total: true;
        createdAt: true;
        status: true;
      };
      orderBy: { createdAt: "desc" };
    };
  };
}>;

const clientDetailInclude = {
  orders: {
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  },
  quotes: {
    orderBy: { createdAt: "desc" },
    take: 20,
  },
  notes: {
    include: {
      author: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  },
} satisfies Prisma.CustomerInclude;

type CustomerDetailPayload = Prisma.CustomerGetPayload<{
  include: typeof clientDetailInclude;
}>;

export async function getAdminClientsPage(
  rawFilters: Partial<AdminCustomerFiltersInput> = {},
  pagination?: AdminPagination,
) {
  const filters = adminCustomerFiltersSchema.parse(rawFilters);
  const db = getPrismaClient();
  const page = pagination?.page ?? filters.page;
  const perPage = pagination?.perPage ?? (filters.perPage === 50 ? 50 : 20);
  const skip = pagination?.skip ?? (page - 1) * perPage;
  const take = pagination?.take ?? perPage;
  const where = buildCustomerWhere(filters);
  const [total, customers] = await Promise.all([
    db.customer.count({ where }),
    db.customer.findMany({
      where,
      include: {
        orders: {
          select: {
            id: true,
            total: true,
            createdAt: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
  ]);

  return toAdminPaginatedResult({
    items: customers.map(toAdminClientListItem),
    total,
    page,
    perPage: perPage === 50 ? 50 : 20,
  });
}

export async function getAdminClients(
  rawFilters: Partial<AdminCustomerFiltersInput> = {},
) {
  const result = await getAdminClientsPage(rawFilters, {
    page: 1,
    perPage: 50,
    skip: 0,
    take: 50,
  });
  return result.items;
}

export async function getAdminClientById(id: string) {
  const db = getPrismaClient();
  const customer = await db.customer.findUnique({
    where: { id },
    include: clientDetailInclude,
  });

  if (!customer) return null;

  const contactMessages = await db.contactMessage.findMany({
    where: {
      OR: [
        { phone: customer.phone },
        ...(customer.email ? [{ email: customer.email }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return toAdminClientDetail(customer, contactMessages);
}

export async function getAdminClientFormData(id: string) {
  const db = getPrismaClient();
  const customer = await db.customer.findUnique({ where: { id } });
  return customer ? toAdminClientFormData(customer) : null;
}

export async function createAdminCustomer({
  adminId,
  adminRole,
  input,
}: {
  adminId: string;
  adminRole: AdminRole;
  input: AdminCustomerInput;
}) {
  const data = adminCustomerSchema.parse(input);
  assertCanSetRelationship(adminRole, data.relationshipStatus);
  const db = getPrismaClient();
  const existing = await db.customer.findFirst({
    where: { phone: data.phone },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Un client avec ce telephone existe deja.");
  }

  const customer = await db.customer.create({
    data: normalizeCustomerData(data),
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_CUSTOMER_CREATED",
    entity: "Customer",
    entityId: customer.id,
    metadata: {
      phone: customer.phone,
      type: customer.type,
      relationshipStatus: customer.relationshipStatus,
    },
  });

  return customer;
}

export async function updateAdminCustomer({
  adminId,
  adminRole,
  input,
}: {
  adminId: string;
  adminRole: AdminRole;
  input: AdminCustomerInput;
}) {
  const data = adminCustomerSchema.parse(input);
  if (!data.id) throw new Error("Client obligatoire.");
  assertCanSetRelationship(adminRole, data.relationshipStatus);
  const db = getPrismaClient();
  const existingPhone = await db.customer.findFirst({
    where: {
      phone: data.phone,
      NOT: { id: data.id },
    },
    select: { id: true },
  });

  if (existingPhone) {
    throw new Error("Ce telephone est deja utilise par un autre client.");
  }

  const previous = await db.customer.findUnique({
    where: { id: data.id },
    select: { relationshipStatus: true, level: true },
  });
  const customer = await db.customer.update({
    where: { id: data.id },
    data: normalizeCustomerData(data),
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_CUSTOMER_UPDATED",
    entity: "Customer",
    entityId: customer.id,
    metadata: {
      previousRelationshipStatus: previous?.relationshipStatus,
      nextRelationshipStatus: customer.relationshipStatus,
      previousLevel: previous?.level,
      nextLevel: customer.level,
    },
  });

  return customer;
}

export async function addAdminCustomerNote({
  adminId,
  customerId,
  type,
  content,
}: {
  adminId: string;
  customerId: string;
  type: CustomerNoteType;
  content: string;
}) {
  const db = getPrismaClient();
  const note = await db.customerNote.create({
    data: {
      customerId,
      authorId: adminId,
      type,
      content: content.trim(),
      private: true,
    },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_CUSTOMER_NOTE_CREATED",
    entity: "CustomerNote",
    entityId: note.id,
    metadata: { customerId, type },
  });

  return note;
}

export async function getManualOrderOptions() {
  const db = getPrismaClient();
  const [products, depots] = await Promise.all([
    db.product.findMany({
      where: {
        status: {
          in: ["PUBLISHED", "ON_ORDER", "OUT_OF_STOCK"],
        },
      },
      include: {
        brand: true,
        stocks: { select: { quantity: true } },
      },
      orderBy: { name: "asc" },
      take: 200,
    }),
    db.depot.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    products: products.map((product): ManualOrderProductOption => {
      const price = Number(product.promoPrice ?? product.priceSell);
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        brandName: product.brand.name,
        price,
        priceLabel: formatMoney(price),
        status: product.status,
        stockTotal: product.stocks.reduce(
          (sum, stock) => sum + stock.quantity,
          0,
        ),
      };
    }),
    depots: depots.map((depot): ManualOrderDepotOption => ({
      id: depot.id,
      name: depot.name,
    })),
  };
}

export async function createAdminManualOrder({
  adminId,
  adminRole,
  input,
}: {
  adminId: string;
  adminRole: AdminRole;
  input: AdminManualOrderInput;
}) {
  const data = adminManualOrderSchema.parse(input);
  const db = getPrismaClient();
  const canEditPrice = canEditManualOrderPrice(adminRole);

  return db.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { id: data.customerId },
      select: { id: true, name: true, phone: true },
    });

    if (!customer) throw new Error("Client introuvable.");

    const products = await tx.product.findMany({
      where: { id: { in: data.items.map((item) => item.productId) } },
      include: {
        stocks: {
          where: { depotId: data.depotId },
        },
      },
    });
    const productById = new Map(products.map((product) => [product.id, product]));

    const orderItems = data.items.map((item) => {
      const product = productById.get(item.productId);
      if (!product) throw new Error("Produit introuvable.");
      if (product.status === ProductStatus.ARCHIVED || product.status === ProductStatus.DRAFT) {
        throw new Error(`Produit non publiable: ${product.name}`);
      }

      const basePrice = Number(product.promoPrice ?? product.priceSell);
      const unitPrice = canEditPrice && item.unitPrice > 0 ? item.unitPrice : basePrice;
      const discount = canEditPrice ? item.discount : 0;
      const totalPrice = roundMoney(unitPrice * item.quantity - discount);

      if (totalPrice < 0) {
        throw new Error("Total ligne invalide.");
      }

      const depotStock = product.stocks[0]?.quantity ?? 0;
      if (data.status === OrderStatus.CONFIRMED && depotStock < item.quantity) {
        throw new Error(`Stock insuffisant pour ${product.name}.`);
      }

      return {
        product,
        quantity: item.quantity,
        unitPrice,
        discount,
        totalPrice,
      };
    });

    const subtotal = roundMoney(
      orderItems.reduce((sum, item) => sum + item.totalPrice, 0),
    );
    const orderNumber = createBusinessNumber("CMD");
    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        status: data.status,
        deliveryMethod: data.deliveryMethod,
        paymentMethod: data.paymentMethod,
        subtotal,
        deliveryFee: 0,
        total: subtotal,
        customerNote: emptyToUndefined(data.customerNote),
        internalNote: emptyToUndefined(data.internalNote),
        items: {
          create: orderItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
        statusHistory: {
          create: {
            status: data.status,
            note:
              data.status === OrderStatus.CONFIRMED
                ? "Commande manuelle creee et confirmee depuis le dashboard."
                : "Commande manuelle creee depuis le dashboard.",
            changedById: adminId,
          },
        },
      },
      select: { id: true, orderNumber: true },
    });

    if (data.status === OrderStatus.CONFIRMED) {
      for (const item of orderItems) {
        // Decrement conditionnel atomique : refuse la commande si le stock
        // du depot est insuffisant, sans fenetre de course entre lecture et
        // ecriture.
        const updated = await tx.stock.updateMany({
          where: {
            productId: item.product.id,
            depotId: data.depotId,
            quantity: { gte: item.quantity },
          },
          data: { quantity: { decrement: item.quantity } },
        });

        if (updated.count !== 1) {
          throw new Error(`Stock insuffisant pour ${item.product.name}.`);
        }
        await tx.stockMovement.create({
          data: {
            productId: item.product.id,
            depotId: data.depotId,
            type: "RESERVED",
            quantity: item.quantity,
            reason: "Reservation commande manuelle",
            reference: orderNumber,
            createdById: adminId,
          },
        });
      }
    }

    await tx.adminLog.create({
      data: {
        adminId,
        action: "ADMIN_MANUAL_ORDER_CREATED",
        entity: "Order",
        entityId: order.id,
        metadata: {
          orderNumber,
          customerId: customer.id,
          customerPhone: customer.phone,
          status: data.status,
          itemCount: orderItems.length,
          stockReserved: data.status === OrderStatus.CONFIRMED,
          discounts: orderItems
            .filter((item) => item.discount > 0)
            .map((item) => ({
              productId: item.product.id,
              discount: item.discount,
            })),
        },
      },
    });

    return order;
  });
}

function buildCustomerWhere(
  filters: Partial<AdminCustomerFiltersInput>,
): Prisma.CustomerWhereInput {
  const where: Prisma.CustomerWhereInput = {};

  if (filters.type) where.type = filters.type;
  if (filters.level) where.level = filters.level;
  if (filters.relationshipStatus) {
    where.relationshipStatus = filters.relationshipStatus;
  }
  if (filters.source) where.source = filters.source;
  if (filters.city) {
    where.city = { contains: filters.city, mode: "insensitive" };
  }

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { organizationName: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

function toAdminClientListItem(customer: CustomerWithOrders): AdminClientListItem {
  const activeOrders = customer.orders.filter(
    (order) => order.status !== "CANCELLED" && order.status !== "RETURNED",
  );
  const totalSpent = activeOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );

  return {
    id: customer.id,
    reference: customer.reference,
    name: customer.name,
    phone: customer.phone,
    email: customer.email ?? undefined,
    city: customer.city ?? undefined,
    type: customer.type,
    typeLabel: customerTypeLabels[customer.type],
    level: customer.level,
    levelLabel: customerLevelLabels[customer.level],
    relationshipStatus: customer.relationshipStatus,
    relationshipStatusLabel:
      customerRelationshipStatusLabels[customer.relationshipStatus],
    relationshipTone: getCustomerRelationshipTone(customer.relationshipStatus),
    source: customer.source,
    sourceLabel: customerSourceLabels[customer.source],
    organizationName: customer.organizationName ?? undefined,
    tags: customer.tags,
    tagLabels: customer.tags.map((tag) => customerTagLabels[tag] ?? tag),
    createdAt: formatDateTime(customer.createdAt),
    orderCount: customer.orders.length,
    cancelledOrderCount: customer.orders.filter(
      (order) => order.status === "CANCELLED" || order.status === "RETURNED",
    ).length,
    totalSpent,
    totalSpentLabel: formatMoney(totalSpent),
    lastOrderAt: customer.orders[0]?.createdAt
      ? formatDateTime(customer.orders[0].createdAt)
      : undefined,
  };
}

function toAdminClientDetail(
  customer: CustomerDetailPayload,
  contactMessages: Array<{
    id: string;
    subject: string;
    status: string;
    createdAt: Date;
  }>,
): AdminClientDetail {
  const listItem = toAdminClientListItem({
    ...customer,
    orders: customer.orders.map((order) => ({
      id: order.id,
      total: order.total,
      createdAt: order.createdAt,
      status: order.status,
    })),
  });
  const productMap = new Map<
    string,
    { productId: string; name: string; sku: string; quantity: number; total: number }
  >();

  customer.orders.forEach((order) => {
    order.items.forEach((item) => {
      const current = productMap.get(item.productId) ?? {
        productId: item.productId,
        name: item.product.name,
        sku: item.product.sku,
        quantity: 0,
        total: 0,
      };
      current.quantity += item.quantity;
      current.total += Number(item.totalPrice);
      productMap.set(item.productId, current);
    });
  });

  return {
    ...listItem,
    address: customer.address ?? undefined,
    internalNotes: customer.internalNotes ?? undefined,
    orders: customer.orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: orderStatusLabels[order.status],
      totalLabel: formatMoney(Number(order.total)),
      createdAt: formatDateTime(order.createdAt),
    })),
    quotes: customer.quotes.map((quote) => ({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      needType: quote.needType ?? undefined,
      urgency: quote.urgency ?? undefined,
      createdAt: formatDateTime(quote.createdAt),
    })),
    contactMessages: contactMessages.map((message) => ({
      id: message.id,
      subject: message.subject,
      status: message.status,
      createdAt: formatDateTime(message.createdAt),
    })),
    notes: customer.notes.map((note) => ({
      id: note.id,
      type: note.type,
      typeLabel: customerNoteTypeLabels[note.type],
      content: note.content,
      author: note.author
        ? `${note.author.name} (${note.author.email})`
        : undefined,
      createdAt: formatDateTime(note.createdAt),
    })),
    productsBought: Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 12)
      .map((product) => ({
        productId: product.productId,
        name: product.name,
        sku: product.sku,
        quantity: product.quantity,
        totalLabel: formatMoney(product.total),
      })),
  };
}

function toAdminClientFormData(customer: {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  address: string | null;
  type: CustomerType;
  source: CustomerSource;
  level: CustomerLevel;
  relationshipStatus: CustomerRelationshipStatus;
  organizationName: string | null;
  internalNotes: string | null;
  tags: string[];
}): AdminClientFormData {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email ?? undefined,
    city: customer.city ?? undefined,
    address: customer.address ?? undefined,
    type: customer.type,
    source: customer.source,
    level: customer.level,
    relationshipStatus: customer.relationshipStatus,
    organizationName: customer.organizationName ?? undefined,
    internalNotes: customer.internalNotes ?? undefined,
    tags: customer.tags,
  };
}

function normalizeCustomerData(data: AdminCustomerInput) {
  return {
    name: data.name.trim(),
    phone: data.phone.trim(),
    email: emptyToUndefined(data.email),
    city: emptyToUndefined(data.city),
    address: emptyToUndefined(data.address),
    type: data.type,
    source: data.source,
    level: data.level,
    relationshipStatus: data.relationshipStatus,
    organizationName: emptyToUndefined(data.organizationName),
    internalNotes: emptyToUndefined(data.internalNotes),
    tags: data.tags,
  };
}

function assertCanSetRelationship(
  role: AdminRole,
  status: CustomerRelationshipStatus,
) {
  if (role === "SUPER_ADMIN" || role === "MANAGER") return;
  if (status === "BLOCKED" || status === "DISPUTE") {
    throw new Error("Permission insuffisante pour ce statut client.");
  }
  if (status === "LATE_PAYER" && role !== "ACCOUNTANT") {
    throw new Error("Permission insuffisante pour ce statut paiement.");
  }
}

function canEditManualOrderPrice(role: AdminRole) {
  return role === "SUPER_ADMIN" || role === "MANAGER" || role === "ACCOUNTANT";
}

function emptyToUndefined(value?: string) {
  const text = value?.trim();
  return text ? text : undefined;
}

export function formatClientCreatedAt(value?: string) {
  return value ? formatShortDate(value) : "-";
}

export function getDeliveryMethodLabel(method: DeliveryMethod) {
  return deliveryMethodLabels[method];
}

export function getPaymentMethodLabel(method: PaymentMethod) {
  return paymentMethodLabels[method];
}
