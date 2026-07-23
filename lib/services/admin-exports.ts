import {
  customerLevelLabels,
  customerTypeLabels,
  formatShortDate,
  orderStatusLabels,
  productStatusLabels,
  supplierPaymentMethodLabels,
  supplierPurchaseStatusLabels,
  supplierTypeLabels,
} from "@/lib/admin/labels";
import { getPrismaClient } from "@/lib/db";

export type AdminExportDataset =
  | "clients"
  | "fournisseurs"
  | "achats"
  | "commandes"
  | "produits"
  | "stock";

export type AdminExportValue = string | number;

export type AdminExportDefinition = {
  title: string;
  filename: string;
  columns: Array<{ header: string; key: string; width?: number }>;
  rows: Array<Record<string, AdminExportValue>>;
};

const MAX_EXPORT_ROWS = 5_000;

export async function getAdminExportDefinition(
  dataset: AdminExportDataset,
): Promise<AdminExportDefinition> {
  switch (dataset) {
    case "clients":
      return getClientsExport();
    case "fournisseurs":
      return getSuppliersExport();
    case "achats":
      return getPurchasesExport();
    case "commandes":
      return getOrdersExport();
    case "produits":
      return getProductsExport();
    case "stock":
      return getStockExport();
  }
}

async function getClientsExport(): Promise<AdminExportDefinition> {
  const db = getPrismaClient();
  const clients = await db.customer.findMany({
    include: {
      orders: {
        where: { status: { notIn: ["CANCELLED", "RETURNED"] } },
        select: { total: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_EXPORT_ROWS,
  });

  return {
    title: "Clients Nahda Smart",
    filename: "clients-nahda-smart",
    columns: [
      { header: "Code client", key: "reference", width: 16 },
      { header: "Nom", key: "name", width: 26 },
      { header: "Téléphone", key: "phone", width: 18 },
      { header: "Email", key: "email", width: 28 },
      { header: "Type", key: "type", width: 18 },
      { header: "Niveau", key: "level", width: 14 },
      { header: "Ville", key: "city", width: 18 },
      { header: "Commandes", key: "orders", width: 12 },
      { header: "Total dépensé (DH)", key: "total", width: 18 },
    ],
    rows: clients.map((client) => ({
      reference: client.reference,
      name: client.name,
      phone: client.phone,
      email: client.email ?? "",
      type: customerTypeLabels[client.type],
      level: customerLevelLabels[client.level],
      city: client.city ?? "",
      orders: client.orders.length,
      total: moneyNumber(
        client.orders.reduce((sum, order) => sum + Number(order.total), 0),
      ),
    })),
  };
}

async function getSuppliersExport(): Promise<AdminExportDefinition> {
  const db = getPrismaClient();
  const suppliers = await db.supplier.findMany({
    include: {
      purchases: {
        where: { status: { not: "CANCELLED" } },
        select: { total: true, paid: true, remaining: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_EXPORT_ROWS,
  });

  return {
    title: "Fournisseurs Nahda Smart",
    filename: "fournisseurs-nahda-smart",
    columns: [
      { header: "Code fournisseur", key: "reference", width: 20 },
      { header: "Nom", key: "name", width: 28 },
      { header: "Téléphone", key: "phone", width: 18 },
      { header: "Email", key: "email", width: 28 },
      { header: "Type", key: "type", width: 18 },
      { header: "Ville", key: "city", width: 18 },
      { header: "Achats", key: "purchases", width: 12 },
      { header: "Total achats (DH)", key: "total", width: 18 },
      { header: "Reste à payer (DH)", key: "remaining", width: 20 },
      { header: "Statut", key: "status", width: 12 },
    ],
    rows: suppliers.map((supplier) => ({
      reference: supplier.reference,
      name: supplier.name,
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      type: supplierTypeLabels[supplier.type],
      city: supplier.city ?? "",
      purchases: supplier.purchases.length,
      total: moneyNumber(
        supplier.purchases.reduce(
          (sum, purchase) => sum + Number(purchase.total),
          0,
        ),
      ),
      remaining: moneyNumber(
        supplier.purchases.reduce(
          (sum, purchase) => sum + Number(purchase.remaining),
          0,
        ),
      ),
      status: supplier.isActive ? "Actif" : "Inactif",
    })),
  };
}

async function getPurchasesExport(): Promise<AdminExportDefinition> {
  const db = getPrismaClient();
  const purchases = await db.supplierPurchase.findMany({
    include: {
      supplier: { select: { reference: true, name: true } },
      depot: { select: { name: true } },
      items: { select: { quantity: true } },
      payments: { select: { method: true } },
    },
    orderBy: { date: "desc" },
    take: MAX_EXPORT_ROWS,
  });

  return {
    title: "Achats fournisseurs Nahda Smart",
    filename: "achats-fournisseurs-nahda-smart",
    columns: [
      { header: "Date", key: "date", width: 14 },
      { header: "Code fournisseur", key: "supplierReference", width: 20 },
      { header: "Fournisseur", key: "supplier", width: 26 },
      { header: "Référence document", key: "reference", width: 22 },
      { header: "Dépôt", key: "depot", width: 20 },
      { header: "Statut", key: "status", width: 18 },
      { header: "Modes de paiement", key: "paymentMethods", width: 24 },
      { header: "Produits distincts", key: "products", width: 18 },
      { header: "Quantité achetée", key: "quantity", width: 18 },
      { header: "Total (DH)", key: "total", width: 16 },
      { header: "Payé (DH)", key: "paid", width: 16 },
      { header: "Reste (DH)", key: "remaining", width: 16 },
    ],
    rows: purchases.map((purchase) => ({
      date: formatShortDate(purchase.date),
      supplierReference: purchase.supplier.reference,
      supplier: purchase.supplier.name,
      reference: purchase.reference ?? "",
      depot: purchase.depot?.name ?? "",
      status: supplierPurchaseStatusLabels[purchase.status],
      paymentMethods: [
        ...new Set(
          purchase.payments.map(
            (payment) => supplierPaymentMethodLabels[payment.method],
          ),
        ),
      ].join(", "),
      products: purchase.items.length,
      quantity: purchase.items.reduce((sum, item) => sum + item.quantity, 0),
      total: moneyNumber(purchase.total),
      paid: moneyNumber(purchase.paid),
      remaining: moneyNumber(purchase.remaining),
    })),
  };
}

async function getOrdersExport(): Promise<AdminExportDefinition> {
  const db = getPrismaClient();
  const orders = await db.order.findMany({
    include: {
      customer: { select: { reference: true, name: true, phone: true } },
      items: { select: { quantity: true } },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_EXPORT_ROWS,
  });

  return {
    title: "Commandes Nahda Smart",
    filename: "commandes-nahda-smart",
    columns: [
      { header: "Commande", key: "orderNumber", width: 20 },
      { header: "Date", key: "date", width: 14 },
      { header: "Code client", key: "customerReference", width: 16 },
      { header: "Client", key: "customer", width: 26 },
      { header: "Téléphone", key: "phone", width: 18 },
      { header: "Statut", key: "status", width: 20 },
      { header: "Quantité produits", key: "quantity", width: 18 },
      { header: "Total (DH)", key: "total", width: 16 },
    ],
    rows: orders.map((order) => ({
      orderNumber: order.orderNumber,
      date: formatShortDate(order.createdAt),
      customerReference: order.customer.reference,
      customer: order.customer.name,
      phone: order.customer.phone,
      status: orderStatusLabels[order.status],
      quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
      total: moneyNumber(order.total),
    })),
  };
}

async function getProductsExport(): Promise<AdminExportDefinition> {
  const db = getPrismaClient();
  const products = await db.product.findMany({
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true } },
      stocks: { select: { quantity: true } },
    },
    orderBy: { name: "asc" },
    take: MAX_EXPORT_ROWS,
  });

  return {
    title: "Produits Nahda Smart",
    filename: "produits-nahda-smart",
    columns: [
      { header: "SKU", key: "sku", width: 18 },
      { header: "Produit", key: "name", width: 36 },
      { header: "Marque", key: "brand", width: 18 },
      { header: "Catégorie", key: "category", width: 20 },
      { header: "Statut", key: "status", width: 18 },
      { header: "Prix achat (DH)", key: "buyPrice", width: 18 },
      { header: "CMUP (DH)", key: "averageCost", width: 18 },
      { header: "Prix vente (DH)", key: "sellPrice", width: 18 },
      { header: "Stock total", key: "stock", width: 14 },
    ],
    rows: products.map((product) => ({
      sku: product.sku,
      name: product.name,
      brand: product.brand.name,
      category: product.category.name,
      status: productStatusLabels[product.status],
      buyPrice: moneyNumber(product.priceBuy),
      averageCost: moneyNumber(product.averageCost ?? product.priceBuy),
      sellPrice: moneyNumber(product.priceSell),
      stock: product.stocks.reduce((sum, stock) => sum + stock.quantity, 0),
    })),
  };
}

async function getStockExport(): Promise<AdminExportDefinition> {
  const db = getPrismaClient();
  const stocks = await db.stock.findMany({
    include: {
      product: {
        select: {
          sku: true,
          name: true,
          priceBuy: true,
          averageCost: true,
        },
      },
      depot: { select: { name: true } },
    },
    orderBy: [{ product: { name: "asc" } }, { depot: { name: "asc" } }],
    take: MAX_EXPORT_ROWS,
  });

  return {
    title: "Stock Nahda Smart",
    filename: "stock-nahda-smart",
    columns: [
      { header: "SKU", key: "sku", width: 18 },
      { header: "Produit", key: "product", width: 38 },
      { header: "Dépôt", key: "depot", width: 24 },
      { header: "Quantité", key: "quantity", width: 14 },
      { header: "CMUP (DH)", key: "averageCost", width: 18 },
      { header: "Valeur stock (DH)", key: "stockValue", width: 20 },
      { header: "Seuil bas", key: "threshold", width: 14 },
      { header: "État", key: "status", width: 18 },
    ],
    rows: stocks.map((stock) => ({
      sku: stock.product.sku,
      product: stock.product.name,
      depot: stock.depot.name,
      quantity: stock.quantity,
      averageCost: moneyNumber(
        stock.product.averageCost ?? stock.product.priceBuy,
      ),
      stockValue: moneyNumber(
        stock.quantity *
          Number(stock.product.averageCost ?? stock.product.priceBuy),
      ),
      threshold: stock.lowStockThreshold,
      status:
        stock.quantity <= 0
          ? "Rupture"
          : stock.quantity <= stock.lowStockThreshold
            ? "Stock bas"
            : "Disponible",
    })),
  };
}

function moneyNumber(value: { toString(): string } | number) {
  return Number(Number(value).toFixed(2));
}
