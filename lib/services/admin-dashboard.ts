import { OrderStatus, ProductStatus } from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { formatDateTime, formatMoney } from "@/lib/admin/labels";

export type AdminDashboardData = {
  dbConnected: boolean;
  stats: {
    ordersToday: number;
    pendingOrders: number;
    newQuotes: number;
    newContacts: number;
    monthRevenue: number;
    monthRevenueLabel: string;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    totalLabel: string;
    status: OrderStatus;
    createdAt: string;
  }>;
  recentQuotes: Array<{
    id: string;
    quoteNumber: string;
    customerName: string;
    status: string;
    createdAt: string;
  }>;
  topProducts: Array<{
    productId: string;
    name: string;
    quantity: number;
    revenueLabel: string;
  }>;
  lowStockAlerts: Array<{
    id: string;
    productName: string;
    sku: string;
    depotName: string;
    quantity: number;
    threshold: number;
  }>;
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const db = getPrismaClient();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    ordersToday,
    pendingOrders,
    newQuotes,
    newContacts,
    monthRevenue,
    recentOrders,
    recentQuotes,
    orderItemGroups,
    stocks,
  ] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: todayStart } } }),
    db.order.count({ where: { status: "PENDING_CONFIRMATION" } }),
    db.quote.count({ where: { status: "NEW" } }),
    db.contactMessage.count({ where: { status: "NEW" } }),
    db.order.aggregate({
      where: {
        createdAt: { gte: monthStart },
        status: { notIn: ["CANCELLED", "RETURNED"] },
      },
      _sum: { total: true },
    }),
    db.order.findMany({
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.quote.findMany({
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    db.stock.findMany({
      include: {
        product: { select: { name: true, sku: true, status: true } },
        depot: { select: { name: true } },
      },
      take: 80,
    }),
  ]);

  const productIds = orderItemGroups.map((item) => item.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const productById = new Map(products.map((product) => [product.id, product]));
  const revenue = Number(monthRevenue._sum.total ?? 0);

  return {
    dbConnected: true,
    stats: {
      ordersToday,
      pendingOrders,
      newQuotes,
      newContacts,
      monthRevenue: revenue,
      monthRevenueLabel: formatMoney(revenue),
    },
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      totalLabel: formatMoney(Number(order.total)),
      status: order.status,
      createdAt: formatDateTime(order.createdAt),
    })),
    recentQuotes: recentQuotes.map((quote) => ({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      customerName: quote.customer?.name ?? quote.organizationName ?? "Client a qualifier",
      status: quote.status,
      createdAt: formatDateTime(quote.createdAt),
    })),
    topProducts: orderItemGroups.map((item) => ({
      productId: item.productId,
      name: productById.get(item.productId)?.name ?? "Produit supprime",
      quantity: item._sum.quantity ?? 0,
      revenueLabel: formatMoney(Number(item._sum.totalPrice ?? 0)),
    })),
    lowStockAlerts: stocks
      .filter(
        (stock) =>
          stock.product.status !== ProductStatus.ARCHIVED &&
          stock.quantity <= stock.lowStockThreshold,
      )
      .slice(0, 6)
      .map((stock) => ({
        id: stock.id,
        productName: stock.product.name,
        sku: stock.product.sku,
        depotName: stock.depot.name,
        quantity: stock.quantity,
        threshold: stock.lowStockThreshold,
      })),
  };
}
