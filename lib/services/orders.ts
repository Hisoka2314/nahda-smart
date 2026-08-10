import {
  CustomerLevel,
  CustomerSource,
  CustomerType as PrismaCustomerType,
  DeliveryMethod as PrismaDeliveryMethod,
  OrderStatus,
  PaymentMethod as PrismaPaymentMethod,
  Prisma,
  ProductStatus,
} from "@prisma/client";
import { randomUUID } from "node:crypto";
import { getPrismaClient } from "@/lib/db";
import { notifyInBackground } from "@/lib/notifications";
import { checkLowStockAndNotify } from "@/lib/services/stock-alerts";
import {
  reserveStockForOrderItems,
  type StockReservationItem,
} from "@/lib/services/stock";
import { roundMoney } from "@/lib/utils";
import { getSiteSettings, resolveDeliveryFee } from "@/lib/settings";
import { normalizeMoroccanPhone } from "@/lib/validations/common";
import {
  orderTrackingSchema,
  websiteOrderSchema,
  type OrderTrackingInput,
  type WebsiteOrderInput,
} from "@/lib/validations/order";
import type { PublicOrderDTO } from "@/types/public-dtos";

const orderPublicInclude = {
  customer: true,
  items: {
    include: {
      product: {
        include: {
          brand: true,
          images: { orderBy: { order: "asc" } },
        },
      },
    },
  },
} satisfies Prisma.OrderInclude;

type OrderWithPublicIncludes = Prisma.OrderGetPayload<{
  include: typeof orderPublicInclude;
}>;

const customerTypeMap: Record<
  WebsiteOrderInput["customer"]["customerType"],
  PrismaCustomerType
> = {
  individual: PrismaCustomerType.INDIVIDUAL,
  company: PrismaCustomerType.COMPANY,
  school: PrismaCustomerType.SCHOOL,
  administration: PrismaCustomerType.ADMINISTRATION,
  reseller: PrismaCustomerType.RESELLER,
  association: PrismaCustomerType.ASSOCIATION,
};

const customerTypeLabels: Record<PrismaCustomerType, string> = {
  INDIVIDUAL: "Particulier",
  COMPANY: "Société",
  SCHOOL: "École",
  ADMINISTRATION: "Administration",
  RESELLER: "Revendeur",
  ASSOCIATION: "Association",
};

const deliveryMethodMap: Record<
  WebsiteOrderInput["deliveryMethod"],
  PrismaDeliveryMethod
> = {
  home_delivery: PrismaDeliveryMethod.HOME_DELIVERY,
  store_pickup: PrismaDeliveryMethod.PICKUP_IN_STORE,
};

const paymentMethodMap: Record<
  WebsiteOrderInput["paymentMethod"],
  PrismaPaymentMethod
> = {
  cash_on_delivery: PrismaPaymentMethod.CASH_ON_DELIVERY,
  pay_in_store: PrismaPaymentMethod.PAY_ON_SITE,
};

const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: "En attente de confirmation",
  CONFIRMED: "Confirmée",
  PREPARING: "En préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  RETURNED: "Retournée",
};

const deliveryMethodLabels: Record<PrismaDeliveryMethod, string> = {
  HOME_DELIVERY: "Livraison à domicile",
  PICKUP_IN_STORE: "Retrait sur place",
};

const paymentMethodLabels: Record<PrismaPaymentMethod, string> = {
  CASH_ON_DELIVERY: "Paiement à la livraison",
  PAY_ON_SITE: "Paiement sur place / retrait magasin",
};

export async function createWebsiteOrder(input: WebsiteOrderInput) {
  const db = getPrismaClient();
  const data = websiteOrderSchema.parse(input);
  const settings = await getSiteSettings();
  const deliveryFee = resolveDeliveryFee(settings, data.deliveryMethod);
  const aggregatedItems = aggregateWebsiteOrderItems(data.items);
  let orderedProductIds: string[] = [];

  return db.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: {
        slug: { in: aggregatedItems.map((item) => item.productSlug) },
      },
      include: {
        brand: true,
        images: { orderBy: { order: "asc" } },
      },
    });
    const productBySlug = new Map(products.map((product) => [product.slug, product]));

    const orderItems = aggregatedItems.map((item) => {
      const product = productBySlug.get(item.productSlug);

      if (!product) {
        throw new Error("Produit introuvable dans le panier.");
      }

      if (
        product.status === ProductStatus.OUT_OF_STOCK ||
        product.status === ProductStatus.ARCHIVED ||
        product.status === ProductStatus.DRAFT
      ) {
        throw new Error(`Le produit ${product.name} n'est pas disponible.`);
      }

      const unitPrice = roundMoney(Number(product.promoPrice ?? product.priceSell));

      return {
        product,
        quantity: item.quantity,
        unitPrice,
        totalPrice: roundMoney(unitPrice * item.quantity),
      };
    });

    const subtotal = roundMoney(
      orderItems.reduce((sum, item) => sum + item.totalPrice, 0),
    );
    const total = roundMoney(subtotal + deliveryFee);
    const customer = await findOrCreateWebsiteCustomer(tx, data.customer);
    const orderNumber = createBusinessNumber("CMD");
    const stockItems: StockReservationItem[] = orderItems.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));
    orderedProductIds = stockItems.map((item) => item.productId);

    await reserveStockForOrderItems(tx, orderNumber, stockItems);

    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        status: OrderStatus.PENDING_CONFIRMATION,
        deliveryMethod: deliveryMethodMap[data.deliveryMethod],
        paymentMethod: paymentMethodMap[data.paymentMethod],
        subtotal,
        deliveryFee,
        total,
        customerNote: emptyToUndefined(data.customer.note),
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
            status: OrderStatus.PENDING_CONFIRMATION,
            note: "Commande créée depuis le site. En attente de confirmation.",
          },
        },
      },
      include: orderPublicInclude,
    });

    return toPublicOrderDTO(order);
  }).then((order) => {
    // Hors transaction : la notification ne doit jamais bloquer ni annuler la commande.
    checkLowStockAndNotify(orderedProductIds);

    notifyInBackground({
      kind: "order",
      subject: `Nouvelle commande ${order.orderNumber} — ${order.total} DH`,
      text: [
        `Commande : ${order.orderNumber}`,
        `Client : ${data.customer.fullName} (${data.customer.phone})`,
        `Total : ${order.total} DH (${aggregatedItems.length} article(s))`,
        `Livraison : ${data.deliveryMethod} · Paiement : ${data.paymentMethod}`,
        ``,
        `Voir : /admin/commandes`,
      ].join("\n"),
    });

    return order;
  });
}

export async function getPublicOrderByNumber(orderNumber: string) {
  const db = getPrismaClient();

  if (!orderNumber.trim()) return null;

  const order = await db.order.findUnique({
    where: { orderNumber: orderNumber.trim().toUpperCase() },
    include: orderPublicInclude,
  });

  return order ? toPublicOrderDTO(order) : null;
}

export async function trackPublicOrder(input: OrderTrackingInput) {
  const data = orderTrackingSchema.parse(input);
  const db = getPrismaClient();

  const order = await db.order.findUnique({
    where: { orderNumber: data.orderNumber.trim().toUpperCase() },
    include: orderPublicInclude,
  });

  if (!order) return null;

  // Fiche client sans telephone (import Sage) : aucun suivi possible, et
  // surtout aucune comparaison ne doit reussir par defaut.
  if (!order.customer.phone) return null;

  if (normalizePhone(order.customer.phone) !== normalizePhone(data.phone)) {
    return null;
  }

  return toPublicOrderDTO(order);
}

export function createBusinessNumber(prefix: "CMD" | "DEV" | "SAV") {
  const year = new Date().getFullYear();
  const token = randomUUID().slice(0, 6).toUpperCase();
  return `${prefix}-${year}-${token}`;
}

function aggregateWebsiteOrderItems(items: WebsiteOrderInput["items"]) {
  const bySlug = new Map<string, number>();

  for (const item of items) {
    bySlug.set(item.productSlug, (bySlug.get(item.productSlug) ?? 0) + item.quantity);
  }

  return Array.from(bySlug.entries()).map(([productSlug, quantity]) => ({
    productSlug,
    quantity,
  }));
}

async function findOrCreateWebsiteCustomer(
  tx: Prisma.TransactionClient,
  customer: WebsiteOrderInput["customer"],
) {
  // Stockage sous forme canonique 212XXXXXXXXX : la recherche ci-dessous et le
  // suivi de commande comparent sur la meme base, quel que soit le format
  // saisi par le client.
  const normalizedPhone = normalizeMoroccanPhone(customer.phone);
  const data = {
    name: customer.fullName.trim(),
    phone: normalizedPhone,
    email: emptyToUndefined(customer.email),
    city: customer.city.trim(),
    address: emptyToUndefined(customer.address),
    type: customerTypeMap[customer.customerType],
    source: CustomerSource.WEBSITE,
    level:
      customer.customerType === "individual"
        ? CustomerLevel.NEW
        : CustomerLevel.B2B,
    organizationName: emptyToUndefined(customer.organizationName),
  };
  const existingCustomer = await tx.customer.findFirst({
    where: { phone: normalizedPhone },
    orderBy: { createdAt: "desc" },
  });

  if (existingCustomer) {
    // Le checkout public n'est pas authentifié : il ne doit jamais écraser
    // la fiche CRM (nom, type, niveau, source). Seules les coordonnées de
    // livraison de cette commande sont mises à jour, et les champs de
    // contact uniquement s'ils sont manquants.
    return tx.customer.update({
      where: { id: existingCustomer.id },
      data: {
        city: data.city,
        address: data.address,
        email: existingCustomer.email ? undefined : data.email,
        organizationName: existingCustomer.organizationName
          ? undefined
          : data.organizationName,
      },
    });
  }

  return tx.customer.create({ data });
}

function toPublicOrderDTO(order: OrderWithPublicIncludes): PublicOrderDTO {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: orderStatusLabels[order.status],
    deliveryMethod: order.deliveryMethod,
    deliveryMethodLabel: deliveryMethodLabels[order.deliveryMethod],
    paymentMethod: order.paymentMethod,
    paymentMethodLabel: paymentMethodLabels[order.paymentMethod],
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    customer: {
      name: order.customer.name,
      city: order.customer.city ?? undefined,
      type: order.customer.type,
      typeLabel: customerTypeLabels[order.customer.type],
      organizationName: order.customer.organizationName ?? undefined,
    },
    items: order.items.map((item) => ({
      productSlug: item.product.slug,
      productName: item.product.name,
      productImage: item.product.images[0]?.url ?? "/generated/product-laptop-probook.png",
      brandName: item.product.brand.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
  };
}

function emptyToUndefined(value?: string) {
  return value?.trim() ? value.trim() : undefined;
}

const normalizePhone = normalizeMoroccanPhone;
