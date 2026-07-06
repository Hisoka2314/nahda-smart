import {
  CustomerLevel,
  CustomerSource,
  CustomerType as PrismaCustomerType,
  Prisma,
  QuoteStatus,
} from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { createBusinessNumber } from "@/lib/services/orders";
import {
  createQuoteSchema,
  type CreateQuoteInput,
  websiteQuoteSchema,
  type WebsiteQuoteInput,
} from "@/lib/validations/quote";
import type { PublicQuoteDTO } from "@/types/public-dtos";

const customerTypeMap: Record<WebsiteQuoteInput["customerType"], PrismaCustomerType> = {
  individual: PrismaCustomerType.INDIVIDUAL,
  company: PrismaCustomerType.COMPANY,
  school: PrismaCustomerType.SCHOOL,
  administration: PrismaCustomerType.ADMINISTRATION,
  reseller: PrismaCustomerType.RESELLER,
  association: PrismaCustomerType.ASSOCIATION,
};

const urgencyLabels: Record<WebsiteQuoteInput["urgency"], string> = {
  normal: "Normal",
  urgent: "Urgent",
  planned: "Projet planifié",
};

const needLabels: Record<WebsiteQuoteInput["needs"][number], string> = {
  simple_purchase: "Achat simple",
  installation: "Installation",
  maintenance: "Maintenance",
  technical_advice: "Conseil technique",
  complete_solution: "Solution complète",
};

const quoteStatusLabels: Record<QuoteStatus, string> = {
  NEW: "Nouveau",
  STUDYING: "En étude",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  EXPIRED: "Expiré",
};

export async function createQuote(input: CreateQuoteInput) {
  const db = getPrismaClient();
  const data = createQuoteSchema.parse(input);
  const total = data.items.reduce(
    (sum, item) => sum + item.quantity * (item.unitPrice ?? 0),
    0,
  );

  return db.$transaction(async (tx) => {
    const customer = data.customer
      ? await tx.customer.create({
          data: {
            ...data.customer,
            email: emptyToUndefined(data.customer.email),
            organizationName: emptyToUndefined(data.customer.organizationName),
            internalNotes: emptyToUndefined(data.customer.internalNotes),
          },
        })
      : null;

    return tx.quote.create({
      data: {
        quoteNumber: createBusinessNumber("DEV"),
        customerId: customer?.id,
        status: QuoteStatus.NEW,
        message: emptyToUndefined(data.message),
        organizationName: emptyToUndefined(data.organizationName),
        urgency: data.urgency,
        needType: data.needType,
        budget: data.budget,
        total: total > 0 ? total : undefined,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            productName: emptyToUndefined(item.productName),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice ? item.quantity * item.unitPrice : undefined,
          })),
        },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });
  });
}

export async function createWebsiteQuote(input: WebsiteQuoteInput) {
  const db = getPrismaClient();
  const data = websiteQuoteSchema.parse(input);

  return db.$transaction(async (tx) => {
    const product = data.productSlug
      ? await tx.product.findUnique({
          where: { slug: data.productSlug },
        })
      : null;

    if (data.productSlug && !product) {
      throw new Error("Produit concerné introuvable.");
    }

    const customer = await findOrCreateQuoteCustomer(tx, data);
    const quoteItems = buildQuoteItems(data, product);
    const total = quoteItems.reduce(
      (sum, item) => sum + item.quantity * (item.unitPrice ?? 0),
      0,
    );
    const quote = await tx.quote.create({
      data: {
        quoteNumber: createBusinessNumber("DEV"),
        customerId: customer.id,
        status: QuoteStatus.NEW,
        message: emptyToUndefined(data.message),
        organizationName: emptyToUndefined(data.organizationName),
        urgency: urgencyLabels[data.urgency],
        needType: data.needs.map((need) => needLabels[need]).join(", "),
        budget: data.estimatedBudget,
        total: total > 0 ? total : undefined,
        items: {
          create: quoteItems.map((item) => ({
            productId: item.productId,
            productName: emptyToUndefined(item.productName),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice ? item.quantity * item.unitPrice : undefined,
          })),
        },
      },
    });

    return toPublicQuoteDTO(quote);
  });
}

async function findOrCreateQuoteCustomer(
  tx: Prisma.TransactionClient,
  data: WebsiteQuoteInput,
) {
  const customerData = {
    name: data.fullName.trim(),
    phone: data.phone.trim(),
    email: emptyToUndefined(data.email),
    city: data.city.trim(),
    type: customerTypeMap[data.customerType],
    source: CustomerSource.WEBSITE,
    level: data.customerType === "individual" ? CustomerLevel.NEW : CustomerLevel.B2B,
    organizationName: emptyToUndefined(data.organizationName),
  };
  const existingCustomer = await tx.customer.findFirst({
    where: { phone: customerData.phone },
    orderBy: { createdAt: "desc" },
  });

  if (existingCustomer) {
    // Formulaire public non authentifié : ne jamais écraser la fiche CRM
    // (nom, type, niveau, source). Compléter uniquement les champs manquants.
    return tx.customer.update({
      where: { id: existingCustomer.id },
      data: {
        city: existingCustomer.city ? undefined : customerData.city,
        email: existingCustomer.email ? undefined : customerData.email,
        organizationName: existingCustomer.organizationName
          ? undefined
          : customerData.organizationName,
      },
    });
  }

  return tx.customer.create({ data: customerData });
}

function buildQuoteItems(
  data: WebsiteQuoteInput,
  product: { id: string; name: string; priceSell: Prisma.Decimal; promoPrice: Prisma.Decimal | null } | null,
): Array<{
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
}> {
  if (product) {
    return [
      {
        productId: product.id,
        productName: product.name,
        quantity: data.desiredQuantity,
        unitPrice: Number(product.promoPrice ?? product.priceSell),
      },
    ];
  }

  return [
    {
      productName: data.desiredProducts?.trim() || data.productName || "Besoin à qualifier",
      quantity: data.desiredQuantity,
      unitPrice: undefined,
    },
  ];
}

function toPublicQuoteDTO(quote: { quoteNumber: string; status: QuoteStatus; createdAt: Date }): PublicQuoteDTO {
  return {
    quoteNumber: quote.quoteNumber,
    status: quote.status,
    statusLabel: quoteStatusLabels[quote.status],
    createdAt: quote.createdAt.toISOString(),
  };
}

function emptyToUndefined(value?: string) {
  return value?.trim() ? value.trim() : undefined;
}
