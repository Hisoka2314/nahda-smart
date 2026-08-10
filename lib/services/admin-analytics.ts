import type { AdminRole, Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { logAdminEvent } from "@/lib/auth/admin-auth";
import {
  formatDateTime,
  formatMoney,
  orderStatusLabels,
  serviceTicketStatusLabels,
} from "@/lib/admin/labels";
import {
  toAdminPaginatedResult,
  type AdminPagination,
} from "@/lib/admin/pagination";
import { roundMoney } from "@/lib/utils";

export type AnalyticsRange = "today" | "7d" | "30d" | "month" | "all";

export function canViewFinancialAnalytics(role: AdminRole): boolean {
  return role === "SUPER_ADMIN" || role === "MANAGER" || role === "ACCOUNTANT";
}

export async function logFinanceAccess({
  adminId,
  page,
  range,
}: {
  adminId: string;
  page: string;
  range?: AnalyticsRange;
}) {
  await logAdminEvent({
    adminId,
    action: "ADMIN_FINANCE_ANALYTICS_ACCESS",
    entity: "Analytics",
    entityId: page,
    metadata: { page, range },
  });
}

export async function getAdminKpiDashboard({
  range,
  includeFinancials,
}: {
  range: AnalyticsRange;
  includeFinancials: boolean;
}) {
  const db = getPrismaClient();
  const period = getPeriod(range);
  const todayStart = startOfToday();
  const activeOrderWhere = activeOrdersWhere(period.start);

  const [
    totalRevenue,
    todayRevenue,
    ordersToday,
    pendingOrders,
    newQuotes,
    newContacts,
    openServiceTickets,
    activeSuppliers,
    purchasesToReceive,
    lowStocks,
    topProducts,
    topSavProducts,
    margin,
  ] = await Promise.all([
    db.order.aggregate({ where: activeOrderWhere, _sum: { total: true } }),
    db.order.aggregate({
      where: activeOrdersWhere(todayStart),
      _sum: { total: true },
    }),
    db.order.count({ where: { createdAt: { gte: todayStart } } }),
    db.order.count({ where: { status: "PENDING_CONFIRMATION" } }),
    db.quote.count({ where: { status: "NEW" } }),
    db.contactMessage.count({ where: { status: "NEW" } }),
    db.serviceTicket.count({
      where: { status: { notIn: ["CLOSED", "REFUSED"] } },
    }),
    db.supplier.count({ where: { isActive: true } }),
    db.supplierPurchase.count({ where: { status: "DRAFT" } }),
    getLowStockRows(6),
    getTopProductsByRevenue({ range, pagination: { page: 1, perPage: 20, skip: 0, take: 20 } }),
    getTopSavProducts(6),
    includeFinancials ? estimateMargin(activeOrderWhere) : Promise.resolve(null),
  ]);

  const revenue = Number(totalRevenue._sum.total ?? 0);
  const revenueToday = Number(todayRevenue._sum.total ?? 0);

  return {
    range,
    rangeLabel: period.label,
    stats: {
      totalRevenue: revenue,
      totalRevenueLabel: formatMoney(revenue),
      todayRevenue: revenueToday,
      todayRevenueLabel: formatMoney(revenueToday),
      ordersToday,
      pendingOrders,
      newQuotes,
      newContacts,
      openServiceTickets,
      activeSuppliers,
      purchasesToReceive,
      estimatedMargin: margin?.margin ?? null,
      estimatedMarginLabel: margin ? formatMoney(margin.margin) : "Masquee",
    },
    topProducts: topProducts.items.slice(0, 5),
    topSavProducts,
    lowStockAlerts: lowStocks,
  };
}

export async function getFinanceOverview({
  range,
  includeFinancials,
}: {
  range: AnalyticsRange;
  includeFinancials: boolean;
}) {
  const db = getPrismaClient();
  const period = getPeriod(range);
  const activeWhere = activeOrdersWhere(period.start);
  const [
    revenue,
    revenueToday,
    cancelledOrders,
    statusGroups,
    supplierTotals,
    openTickets,
    closedTickets,
    savImpact,
    topProducts,
    topClients,
    margin,
  ] = await Promise.all([
    db.order.aggregate({ where: activeWhere, _sum: { total: true }, _count: true }),
    db.order.aggregate({
      where: activeOrdersWhere(startOfToday()),
      _sum: { total: true },
    }),
    db.order.count({ where: { status: { in: ["CANCELLED", "RETURNED"] }, ...(period.start ? { createdAt: { gte: period.start } } : {}) } }),
    db.order.groupBy({
      by: ["status"],
      where: period.start ? { createdAt: { gte: period.start } } : {},
      _count: { _all: true },
    }),
    db.supplierPurchase.aggregate({
      where: period.start ? { date: { gte: period.start } } : {},
      _sum: { total: true, paid: true, remaining: true },
    }),
    db.serviceTicket.count({ where: { status: { notIn: ["CLOSED", "REFUSED"] } } }),
    db.serviceTicket.count({ where: { status: "CLOSED" } }),
    getSavRevenueImpact(period.start),
    getTopProductsByRevenue({ range, pagination: { page: 1, perPage: 20, skip: 0, take: 20 } }),
    getTopClientsByRevenue({ range, pagination: { page: 1, perPage: 20, skip: 0, take: 20 } }),
    includeFinancials ? estimateMargin(activeWhere) : Promise.resolve(null),
  ]);

  const revenueNumber = Number(revenue._sum.total ?? 0);
  const supplierTotal = Number(supplierTotals._sum.total ?? 0);
  const supplierPaid = Number(supplierTotals._sum.paid ?? 0);
  const supplierRemaining = Number(supplierTotals._sum.remaining ?? 0);
  const averageOrder = revenue._count ? revenueNumber / revenue._count : 0;

  return {
    range,
    rangeLabel: period.label,
    cards: {
      revenue: formatMoney(revenueNumber),
      revenueToday: formatMoney(Number(revenueToday._sum.total ?? 0)),
      estimatedMargin: margin ? formatMoney(margin.margin) : "Masquee",
      estimatedMarginRate:
        margin && revenueNumber > 0
          ? `${Math.round((margin.margin / revenueNumber) * 100)}%`
          : "N/A",
      averageOrder: formatMoney(averageOrder),
      cancelledOrders,
      supplierTotal: includeFinancials ? formatMoney(supplierTotal) : "Masque",
      supplierPaid: includeFinancials ? formatMoney(supplierPaid) : "Masque",
      supplierRemaining: includeFinancials ? formatMoney(supplierRemaining) : "Masque",
      openTickets,
      closedTickets,
      savImpact: formatMoney(savImpact),
    },
    statusBreakdown: statusGroups.map((group) => ({
      status: group.status,
      label: orderStatusLabels[group.status],
      count: group._count._all,
    })),
    topProducts: topProducts.items.slice(0, 8),
    topClients: topClients.items.slice(0, 8),
  };
}

export async function getTopProductsByRevenue({
  range,
  pagination,
}: {
  range: AnalyticsRange;
  pagination: AdminPagination;
}) {
  const db = getPrismaClient();
  const period = getPeriod(range);
  // Agregation SQL (bornee par le nombre de produits distincts) au lieu de
  // charger chaque ligne de commande en memoire. Les details produit ne sont
  // recuperes que pour la page demandee.
  const grouped = await db.orderItem.groupBy({
    by: ["productId"],
    where: { order: activeOrdersWhere(period.start) },
    _sum: { quantity: true, totalPrice: true },
  });

  const sorted = grouped
    .map((row) => ({
      productId: row.productId,
      quantity: row._sum.quantity ?? 0,
      revenue: roundMoney(Number(row._sum.totalPrice ?? 0)),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const pageRows = sorted.slice(
    pagination.skip,
    pagination.skip + pagination.take,
  );
  const products = await db.product.findMany({
    where: { id: { in: pageRows.map((row) => row.productId) } },
    select: {
      id: true,
      name: true,
      sku: true,
      priceBuy: true,
      averageCost: true,
      category: { select: { name: true } },
      stocks: { select: { quantity: true } },
      _count: { select: { serviceTickets: true } },
    },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  const items = pageRows.map((row) => {
    const product = productById.get(row.productId);
    const stockTotal =
      product?.stocks.reduce((sum, stock) => sum + stock.quantity, 0) ?? 0;
    const estimatedCost = roundMoney(
      row.quantity * Number(product?.averageCost ?? product?.priceBuy ?? 0),
    );
    const estimatedMargin = roundMoney(row.revenue - estimatedCost);

    return {
      productId: row.productId,
      name: product?.name ?? "Produit supprime",
      sku: product?.sku ?? "-",
      category: product?.category.name ?? "-",
      quantity: row.quantity,
      revenue: row.revenue,
      estimatedCost,
      stockTotal,
      savCount: product?._count.serviceTickets ?? 0,
      revenueLabel: formatMoney(row.revenue),
      estimatedMargin,
      estimatedMarginLabel: formatMoney(estimatedMargin),
      rotationScore: stockTotal > 0 ? row.quantity / stockTotal : row.quantity,
      rotationLabel:
        stockTotal > 0 ? `${row.quantity}/${stockTotal}` : `${row.quantity}/0`,
    };
  });

  return toAdminPaginatedResult({
    items,
    total: sorted.length,
    page: pagination.page,
    perPage: pagination.perPage,
  });
}

export async function getTopClientsByRevenue({
  range,
  pagination,
}: {
  range: AnalyticsRange;
  pagination: AdminPagination;
}) {
  const db = getPrismaClient();
  const period = getPeriod(range);
  const activeWhere = activeOrdersWhere(period.start);
  // Agregation SQL par client (seuls les clients ayant commande remontent),
  // details et nombre d'articles calcules uniquement pour la page demandee.
  const grouped = await db.order.groupBy({
    by: ["customerId"],
    where: activeWhere,
    _sum: { total: true },
    _count: { _all: true },
    _max: { createdAt: true },
  });

  const sorted = grouped
    .map((row) => ({
      customerId: row.customerId,
      revenue: roundMoney(Number(row._sum.total ?? 0)),
      orderCount: row._count._all,
      lastOrderAt: row._max.createdAt ?? undefined,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const pageRows = sorted.slice(
    pagination.skip,
    pagination.skip + pagination.take,
  );
  const [customers, itemSums] = await Promise.all([
    db.customer.findMany({
      where: { id: { in: pageRows.map((row) => row.customerId) } },
    }),
    Promise.all(
      pageRows.map((row) =>
        db.orderItem.aggregate({
          where: { order: { ...activeWhere, customerId: row.customerId } },
          _sum: { quantity: true },
        }),
      ),
    ),
  ]);
  const customerById = new Map(customers.map((customer) => [customer.id, customer]));

  const items = pageRows.map((row, index) => {
    const customer = customerById.get(row.customerId);

    return {
      id: row.customerId,
      name: customer?.name ?? "Client supprime",
      phone: customer?.phone ?? "-",
      city: customer?.city ?? "-",
      type: customer?.type ?? "INDIVIDUAL",
      level: customer?.level ?? "NEW",
      relationshipStatus: customer?.relationshipStatus ?? "NORMAL",
      orderCount: row.orderCount,
      itemCount: itemSums[index]?._sum.quantity ?? 0,
      revenue: row.revenue,
      revenueLabel: formatMoney(row.revenue),
      averageOrderLabel: formatMoney(
        row.orderCount ? roundMoney(row.revenue / row.orderCount) : 0,
      ),
      lastOrderAt: row.lastOrderAt,
      lastOrderLabel: row.lastOrderAt ? formatDateTime(row.lastOrderAt) : "-",
    };
  });

  return toAdminPaginatedResult({
    items,
    total: sorted.length,
    page: pagination.page,
    perPage: pagination.perPage,
  });
}

export async function getStockIntelligence({
  pagination,
}: {
  pagination: AdminPagination;
}) {
  const db = getPrismaClient();
  const [stocks, movements, orderGroups] = await Promise.all([
    db.stock.findMany({
      include: {
        depot: { select: { name: true, type: true } },
        product: {
          include: {
            brand: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
      },
    }),
    db.stockMovement.groupBy({
      by: ["productId"],
      _count: { _all: true },
      _sum: { quantity: true },
    }),
    db.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
    }),
  ]);
  const movementByProduct = new Map(movements.map((row) => [row.productId, row]));
  const demandByProduct = new Map(orderGroups.map((row) => [row.productId, row._sum.quantity ?? 0]));
  const rows = stocks
    .map((stock) => {
      const movement = movementByProduct.get(stock.productId);
      const demand = demandByProduct.get(stock.productId) ?? 0;
      const stockValue = stock.quantity * Number(stock.product.averageCost ?? stock.product.priceBuy);

      return {
        id: stock.id,
        productId: stock.productId,
        productName: stock.product.name,
        sku: stock.product.sku,
        brand: stock.product.brand.name,
        category: stock.product.category.name,
        depotName: stock.depot.name,
        quantity: stock.quantity,
        threshold: stock.lowStockThreshold,
        isLow: stock.quantity <= stock.lowStockThreshold,
        isDead: !movement || movement._count._all === 0,
        demand,
        movementCount: movement?._count._all ?? 0,
        movementQuantity: movement?._sum.quantity ?? 0,
        rotation: stock.quantity > 0 ? demand / stock.quantity : demand,
        stockValue,
        stockValueLabel: formatMoney(stockValue),
      };
    })
    .sort((a, b) => Number(b.isLow) - Number(a.isLow) || b.rotation - a.rotation);

  const stockByDepot = Array.from(
    rows.reduce((map, row) => {
      const existing = map.get(row.depotName) ?? { depotName: row.depotName, quantity: 0, value: 0, low: 0 };
      existing.quantity += row.quantity;
      existing.value += row.stockValue;
      if (row.isLow) existing.low += 1;
      map.set(row.depotName, existing);
      return map;
    }, new Map<string, { depotName: string; quantity: number; value: number; low: number }>())
      .values(),
  ).map((row) => ({ ...row, valueLabel: formatMoney(row.value) }));

  return {
    rows: paginate(rows, pagination),
    stockByDepot,
    lowCount: rows.filter((row) => row.isLow).length,
    deadCount: rows.filter((row) => row.isDead).length,
    fastRotation: rows.filter((row) => row.rotation >= 1).length,
    slowRotation: rows.filter((row) => row.rotation > 0 && row.rotation < 0.25).length,
  };
}

export async function getSavAnalytics({
  range,
}: {
  range: AnalyticsRange;
}) {
  const db = getPrismaClient();
  const period = getPeriod(range);
  const where = period.start ? { createdAt: { gte: period.start } } : {};
  const tickets = await db.serviceTicket.findMany({
    where,
    include: {
      product: {
        select: {
          name: true,
          sku: true,
          category: { select: { name: true } },
          _count: { select: { orderItems: true } },
        },
      },
    },
  });
  const open = tickets.filter((ticket) => !["CLOSED", "REFUSED"].includes(ticket.status)).length;
  const closed = tickets.filter((ticket) => ticket.status === "CLOSED").length;
  const averageResolutionHours = average(
    tickets
      .filter((ticket) => ticket.closedAt)
      .map((ticket) => (ticket.closedAt!.getTime() - ticket.createdAt.getTime()) / 36e5),
  );
  const productRows = Array.from(
    tickets.reduce((map, ticket) => {
      if (!ticket.product) return map;
      const existing = map.get(ticket.productId!) ?? {
        productId: ticket.productId!,
        name: ticket.product.name,
        sku: ticket.product.sku,
        category: ticket.product.category.name,
        tickets: 0,
        closed: 0,
        refused: 0,
        soldLines: ticket.product._count.orderItems,
      };
      existing.tickets += 1;
      if (ticket.status === "CLOSED") existing.closed += 1;
      if (ticket.status === "REFUSED") existing.refused += 1;
      map.set(ticket.productId!, existing);
      return map;
    }, new Map<string, SavProductAccumulator>())
      .values(),
  )
    .map((row) => ({
      ...row,
      rate: row.soldLines ? row.tickets / row.soldLines : row.tickets,
      // Un produit peut cumuler plusieurs tickets pour une meme vente (ou des
      // tickets rattaches a des ventes hors periode) : le ratio depasse alors
      // 1 et l'afficher en pourcentage donnait des "200%" incomprehensibles.
      rateLabel: row.soldLines
        ? `${(row.tickets / row.soldLines).toLocaleString("fr-FR", {
            maximumFractionDigits: 1,
          })} par vente`
        : "N/A",
    }))
    .sort((a, b) => b.tickets - a.tickets);
  const byCategory = Array.from(
    productRows.reduce((map, row) => {
      const existing = map.get(row.category) ?? { category: row.category, tickets: 0 };
      existing.tickets += row.tickets;
      map.set(row.category, existing);
      return map;
    }, new Map<string, { category: string; tickets: number }>())
      .values(),
  ).sort((a, b) => b.tickets - a.tickets);
  const byStatus = Array.from(
    tickets.reduce((map, ticket) => {
      map.set(ticket.status, (map.get(ticket.status) ?? 0) + 1);
      return map;
    }, new Map<string, number>())
      .entries(),
  ).map(([status, count]) => ({
    status,
    label: serviceTicketStatusLabels[status as keyof typeof serviceTicketStatusLabels],
    count,
  }));

  return {
    range,
    rangeLabel: period.label,
    total: tickets.length,
    open,
    closed,
    averageResolutionLabel: averageResolutionHours
      ? `${Math.round(averageResolutionHours)} h`
      : "N/A",
    productRows,
    byCategory,
    byStatus,
  };
}

export async function getAnalyticsOverview({ range }: { range: AnalyticsRange }) {
  const [finance, products, clients, stock, sav] = await Promise.all([
    getFinanceOverview({ range, includeFinancials: false }),
    getTopProductsByRevenue({ range, pagination: { page: 1, perPage: 20, skip: 0, take: 20 } }),
    getTopClientsByRevenue({ range, pagination: { page: 1, perPage: 20, skip: 0, take: 20 } }),
    getStockIntelligence({ pagination: { page: 1, perPage: 20, skip: 0, take: 20 } }),
    getSavAnalytics({ range }),
  ]);

  return {
    range,
    finance,
    topProducts: products.items.slice(0, 6),
    topClients: clients.items.slice(0, 6),
    stock,
    sav,
  };
}

async function estimateMargin(where: Prisma.OrderWhereInput) {
  const db = getPrismaClient();
  // Agregation par produit (bornee par la taille du catalogue) au lieu de
  // charger chaque ligne de commande.
  const grouped = await db.orderItem.groupBy({
    by: ["productId"],
    where: { order: where },
    _sum: { quantity: true, totalPrice: true },
  });
  const products = await db.product.findMany({
    where: { id: { in: grouped.map((row) => row.productId) } },
    select: { id: true, priceBuy: true, averageCost: true },
  });
  const priceBuyById = new Map(
    products.map((product) => [product.id, Number(product.averageCost ?? product.priceBuy)]),
  );
  const revenue = roundMoney(
    grouped.reduce((sum, row) => sum + Number(row._sum.totalPrice ?? 0), 0),
  );
  const cost = roundMoney(
    grouped.reduce(
      (sum, row) =>
        sum + (row._sum.quantity ?? 0) * (priceBuyById.get(row.productId) ?? 0),
      0,
    ),
  );

  return { revenue, cost, margin: roundMoney(revenue - cost) };
}

async function getSavRevenueImpact(start?: Date) {
  const db = getPrismaClient();
  const tickets = await db.serviceTicket.findMany({
    where: {
      ...(start ? { createdAt: { gte: start } } : {}),
      order: { isNot: null },
    },
    include: { order: { select: { total: true } } },
  });

  return tickets.reduce((sum, ticket) => sum + Number(ticket.order?.total ?? 0), 0);
}

async function getTopSavProducts(take: number) {
  const sav = await getSavAnalytics({ range: "all" });
  return sav.productRows.slice(0, take);
}

async function getLowStockRows(take: number) {
  const db = getPrismaClient();
  // Filtre en SQL (seuil par ligne via reference de champ) : l'ancien code
  // ne balayait que les 120 premieres lignes et pouvait rater des alertes.
  const stocks = await db.stock.findMany({
    where: {
      quantity: { lte: db.stock.fields.lowStockThreshold },
      product: { status: { not: "ARCHIVED" } },
    },
    include: {
      product: { select: { name: true, sku: true, status: true } },
      depot: { select: { name: true } },
    },
    orderBy: { quantity: "asc" },
    take,
  });

  return stocks
    .map((stock) => ({
      id: stock.id,
      productName: stock.product.name,
      sku: stock.product.sku,
      depotName: stock.depot.name,
      quantity: stock.quantity,
      threshold: stock.lowStockThreshold,
    }));
}

function activeOrdersWhere(start?: Date): Prisma.OrderWhereInput {
  return {
    status: { notIn: ["CANCELLED", "RETURNED"] },
    ...(start ? { createdAt: { gte: start } } : {}),
  };
}

function getPeriod(range: AnalyticsRange) {
  const now = new Date();
  if (range === "today") {
    return { label: "Aujourd hui", start: startOfToday() };
  }
  if (range === "7d") {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return { label: "7 derniers jours", start };
  }
  if (range === "30d") {
    const start = new Date(now);
    start.setDate(now.getDate() - 30);
    return { label: "30 derniers jours", start };
  }
  if (range === "month") {
    return { label: "Mois en cours", start: new Date(now.getFullYear(), now.getMonth(), 1) };
  }

  return { label: "Toutes periodes", start: undefined };
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function paginate<T>(items: T[], pagination: AdminPagination) {
  return toAdminPaginatedResult({
    items: items.slice(pagination.skip, pagination.skip + pagination.take),
    total: items.length,
    page: pagination.page,
    perPage: pagination.perPage,
  });
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

type SavProductAccumulator = {
  productId: string;
  name: string;
  sku: string;
  category: string;
  tickets: number;
  closed: number;
  refused: number;
  soldLines: number;
};
