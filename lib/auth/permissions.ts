import type { AdminRole } from "@prisma/client";

export type AdminSection =
  | "products"
  | "categories"
  | "brands"
  | "filters"
  | "orders"
  | "customers"
  | "contacts"
  | "quotes"
  | "sav"
  | "logs"
  | "suppliers"
  | "stock"
  | "depots"
  | "reports"
  | "revenues"
  | "margins"
  | "delivery"
  | "settings";

const allSections: AdminSection[] = [
  "products",
  "categories",
  "brands",
  "filters",
  "orders",
  "customers",
  "contacts",
  "quotes",
  "sav",
  "logs",
  "suppliers",
  "stock",
  "depots",
  "reports",
  "revenues",
  "margins",
  "delivery",
  "settings",
];

export const adminRoleLabels: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super administrateur",
  MANAGER: "Manager",
  SELLER: "Vendeur",
  STOCK_MANAGER: "Responsable stock",
  ACCOUNTANT: "Comptable",
  DELIVERY: "Livraison",
};

export const adminSectionLabels: Record<AdminSection, string> = {
  products: "Produits",
  categories: "Categories",
  brands: "Marques",
  filters: "Filtres",
  orders: "Commandes",
  customers: "Clients",
  contacts: "Contacts",
  quotes: "Devis",
  sav: "SAV",
  logs: "Logs admin",
  suppliers: "Fournisseurs",
  stock: "Stock",
  depots: "Depots",
  reports: "Rapports",
  revenues: "Revenus",
  margins: "Marges",
  delivery: "Livraison",
  settings: "Parametres",
};

export const permissionsByRole: Record<AdminRole, AdminSection[]> = {
  SUPER_ADMIN: allSections,
  MANAGER: [
    "products",
    "categories",
    "brands",
    "filters",
    "orders",
    "customers",
    "contacts",
    "quotes",
    "sav",
    "suppliers",
    "stock",
    "depots",
    "reports",
    "revenues",
    "margins",
  ],
  SELLER: ["products", "orders", "customers", "quotes", "sav"],
  STOCK_MANAGER: ["products", "suppliers", "sav", "stock", "depots"],
  ACCOUNTANT: [
    "products",
    "revenues",
    "margins",
    "suppliers",
    "orders",
    "customers",
    "sav",
    "reports",
  ],
  DELIVERY: ["delivery", "orders", "sav"],
};

export function canAccessAdminSection(
  role: AdminRole,
  section: AdminSection,
): boolean {
  return permissionsByRole[role]?.includes(section) ?? false;
}

export function roleCanAccessAny(
  role: AdminRole,
  sections: AdminSection[],
): boolean {
  return sections.some((section) => canAccessAdminSection(role, section));
}
