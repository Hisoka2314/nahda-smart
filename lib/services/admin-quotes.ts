import { CustomerType, Prisma, QuoteStatus } from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { logAdminEvent } from "@/lib/auth/admin-auth";
import {
  customerTypeLabels,
  formatDateTime,
  formatMoney,
  quoteStatusLabels,
} from "@/lib/admin/labels";
import {
  toAdminPaginatedResult,
  type AdminPagination,
} from "@/lib/admin/pagination";
import { adminQuoteFiltersSchema } from "@/lib/validations/admin";

export type AdminQuoteListItem = {
  id: string;
  quoteNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerType?: CustomerType;
  customerTypeLabel?: string;
  organizationName?: string;
  needType?: string;
  urgency?: string;
  budgetLabel?: string;
  status: QuoteStatus;
  statusLabel: string;
};

export type AdminQuoteDetail = AdminQuoteListItem & {
  message?: string;
  totalLabel?: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPriceLabel?: string;
    totalPriceLabel?: string;
  }>;
};

type AdminQuoteFilters = {
  q?: string;
  status?: QuoteStatus;
};

const quoteListInclude = {
  customer: true,
} satisfies Prisma.QuoteInclude;

const quoteDetailInclude = {
  customer: true,
  items: {
    include: {
      product: true,
    },
    orderBy: { id: "asc" },
  },
} satisfies Prisma.QuoteInclude;

type QuoteListPayload = Prisma.QuoteGetPayload<{ include: typeof quoteListInclude }>;
type QuoteDetailPayload = Prisma.QuoteGetPayload<{ include: typeof quoteDetailInclude }>;

export async function getAdminQuotes(rawFilters: AdminQuoteFilters = {}) {
  const filters = adminQuoteFiltersSchema.parse(rawFilters);
  const db = getPrismaClient();

  const quotes = await db.quote.findMany({
    where: buildQuoteWhere(filters),
    include: quoteListInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return quotes.map(toAdminQuoteListItem);
}

// Idem commandes : la liste plafonnait aux 50 devis les plus recents.
export async function getAdminQuotesPage(
  rawFilters: AdminQuoteFilters = {},
  pagination: AdminPagination,
) {
  const filters = adminQuoteFiltersSchema.parse(rawFilters);
  const db = getPrismaClient();
  const where = buildQuoteWhere(filters);
  const [total, quotes] = await Promise.all([
    db.quote.count({ where }),
    db.quote.findMany({
      where,
      include: quoteListInclude,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  return toAdminPaginatedResult({
    items: quotes.map(toAdminQuoteListItem),
    total,
    page: pagination.page,
    perPage: pagination.perPage,
  });
}

export async function getAdminQuoteById(id: string) {
  const db = getPrismaClient();
  const quote = await db.quote.findUnique({
    where: { id },
    include: quoteDetailInclude,
  });

  return quote ? toAdminQuoteDetail(quote) : null;
}

export async function updateAdminQuoteStatus({
  adminId,
  quoteId,
  status,
}: {
  adminId: string;
  quoteId: string;
  status: QuoteStatus;
}) {
  const db = getPrismaClient();
  const quote = await db.quote.update({
    where: { id: quoteId },
    data: { status },
    select: { id: true, quoteNumber: true, status: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_QUOTE_STATUS_UPDATED",
    entity: "Quote",
    entityId: quote.id,
    metadata: {
      quoteNumber: quote.quoteNumber,
      nextStatus: quote.status,
    },
  });

  return quote;
}

function buildQuoteWhere(filters: AdminQuoteFilters): Prisma.QuoteWhereInput {
  const where: Prisma.QuoteWhereInput = {};

  if (filters.status) where.status = filters.status;

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { quoteNumber: { contains: q, mode: "insensitive" } },
      { organizationName: { contains: q, mode: "insensitive" } },
      { needType: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { phone: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}

function toAdminQuoteListItem(quote: QuoteListPayload): AdminQuoteListItem {
  const organizationName = quote.organizationName ?? quote.customer?.organizationName ?? undefined;

  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    createdAt: formatDateTime(quote.createdAt),
    customerName: quote.customer?.name ?? "Client a qualifier",
    customerPhone: quote.customer?.phone ?? "-",
    customerType: quote.customer?.type,
    customerTypeLabel: quote.customer?.type ? customerTypeLabels[quote.customer.type] : undefined,
    organizationName,
    needType: quote.needType ?? undefined,
    urgency: quote.urgency ?? undefined,
    budgetLabel: quote.budget ? formatMoney(Number(quote.budget)) : undefined,
    status: quote.status,
    statusLabel: quoteStatusLabels[quote.status],
  };
}

function toAdminQuoteDetail(quote: QuoteDetailPayload): AdminQuoteDetail {
  return {
    ...toAdminQuoteListItem(quote),
    message: quote.message ?? undefined,
    totalLabel: quote.total ? formatMoney(Number(quote.total)) : undefined,
    items: quote.items.map((item) => ({
      id: item.id,
      productName: item.product?.name ?? item.productName ?? "Produit a qualifier",
      quantity: item.quantity,
      unitPriceLabel: item.unitPrice ? formatMoney(Number(item.unitPrice)) : undefined,
      totalPriceLabel: item.totalPrice ? formatMoney(Number(item.totalPrice)) : undefined,
    })),
  };
}
