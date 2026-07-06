import {
  ContactMessageStatus,
  CustomerLevel,
  CustomerNoteType,
  CustomerRelationshipStatus,
  CustomerSource,
  CustomerType,
  DeliveryMethod,
  DepotType,
  FilterInputType,
  OrderStatus,
  PaymentMethod,
  ProductCondition,
  ProductStatus,
  QuoteStatus,
  ServiceTicketNoteType,
  ServiceTicketStatus,
  ServiceTicketType,
  ServiceTicketUrgency,
  StockMovementType,
  SupplierNoteType,
  SupplierPurchaseStatus,
  SupplierType,
} from "@prisma/client";

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: "En attente",
  CONFIRMED: "Confirmee",
  PREPARING: "En preparation",
  SHIPPED: "Expediee",
  DELIVERED: "Livree",
  CANCELLED: "Annulee",
  RETURNED: "Retournee",
};

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  NEW: "Nouveau",
  STUDYING: "En etude",
  SENT: "Envoye",
  ACCEPTED: "Accepte",
  REFUSED: "Refuse",
  EXPIRED: "Expire",
};

export const contactStatusLabels: Record<ContactMessageStatus, string> = {
  NEW: "Nouveau",
  READ: "En cours",
  NO_ANSWER: "Pas de reponse",
  CALLBACK: "A rappeler",
  CONVERTED: "Converti client",
  LOST: "Perdu",
  ARCHIVED: "Archive",
};

export const customerTypeLabels: Record<CustomerType, string> = {
  INDIVIDUAL: "Particulier",
  COMPANY: "Societe",
  SCHOOL: "Ecole",
  ADMINISTRATION: "Administration",
  RESELLER: "Revendeur",
  ASSOCIATION: "Association",
};

export const customerLevelLabels: Record<CustomerLevel, string> = {
  NEW: "Nouveau",
  LOYAL: "Fidele",
  VIP: "VIP",
  B2B: "B2B",
};

export const customerRelationshipStatusLabels: Record<
  CustomerRelationshipStatus,
  string
> = {
  GOOD: "Bon client",
  NORMAL: "Client normal",
  LOYAL: "Client fidele",
  VIP: "VIP",
  WATCH: "A surveiller",
  LATE_PAYER: "Mauvais payeur",
  DISPUTE: "Litige",
  BLOCKED: "Bloque",
};

export const customerSourceLabels: Record<CustomerSource, string> = {
  WEBSITE: "Site",
  WHATSAPP: "WhatsApp",
  FACEBOOK: "Facebook",
  GOOGLE: "Google",
  STORE: "Boutique",
  RECOMMENDATION: "Recommandation",
};

export const customerNoteTypeLabels: Record<CustomerNoteType, string> = {
  INFORMATION: "Information",
  FOLLOW_UP: "Suivi",
  PAYMENT: "Paiement",
  DELIVERY: "Livraison",
  DISPUTE: "Litige",
  SAV: "SAV",
  COMMERCIAL: "Commercial",
};

export const supplierTypeLabels: Record<SupplierType, string> = {
  IMPORTER: "Importateur",
  WHOLESALER: "Grossiste",
  RESELLER: "Revendeur",
  INDIVIDUAL: "Particulier",
  DISTRIBUTOR: "Distributeur",
};

export const supplierPurchaseStatusLabels: Record<SupplierPurchaseStatus, string> = {
  DRAFT: "Brouillon",
  RECEIVED: "Recu",
  PARTIALLY_PAID: "Partiellement paye",
  PAID: "Paye",
  CANCELLED: "Annule",
};

export const supplierNoteTypeLabels: Record<SupplierNoteType, string> = {
  INFORMATION: "Information",
  PAYMENT: "Paiement",
  DELIVERY: "Livraison",
  QUALITY: "Qualite",
  SAV: "SAV",
  COMMERCIAL: "Commercial",
  DISPUTE: "Litige",
};

export const serviceTicketTypeLabels: Record<ServiceTicketType, string> = {
  RETURN: "Retour",
  REPAIR: "Reparation",
  EXCHANGE: "Echange",
  WARRANTY_CLAIM: "Garantie fournisseur",
  TECH_SUPPORT: "Support technique",
};

export const serviceTicketStatusLabels: Record<ServiceTicketStatus, string> = {
  NEW: "Nouveau",
  IN_REVIEW: "En revue",
  DIAGNOSIS_DONE: "Diagnostic termine",
  IN_PROGRESS: "En cours",
  WAITING_PARTS: "Attente pieces",
  REPAIRED: "Repare",
  REPLACED: "Remplace",
  REFUSED: "Refuse",
  CLOSED: "Cloture",
};

export const serviceTicketUrgencyLabels: Record<ServiceTicketUrgency, string> = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
};

export const serviceTicketNoteTypeLabels: Record<ServiceTicketNoteType, string> = {
  INTERNAL: "Interne",
  TECHNICAL: "Technique",
  CLIENT: "Client",
  PARTS: "Pieces",
  RESOLUTION: "Resolution",
};

export const deliveryMethodLabels: Record<DeliveryMethod, string> = {
  HOME_DELIVERY: "Livraison a domicile",
  PICKUP_IN_STORE: "Retrait sur place",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH_ON_DELIVERY: "Paiement a la livraison",
  PAY_ON_SITE: "Paiement sur place",
};

export const productStatusLabels: Record<ProductStatus, string> = {
  PUBLISHED: "Publie",
  DRAFT: "Brouillon",
  ARCHIVED: "Archive",
  OUT_OF_STOCK: "Rupture",
  ON_ORDER: "Sur commande",
};

export const productConditionLabels: Record<ProductCondition, string> = {
  NEW: "Neuf",
  USED: "Occasion",
  REFURBISHED: "Reconditionne",
};

export const depotTypeLabels: Record<DepotType, string> = {
  MAIN_DEPOT: "Depot principal",
  SHOWROOM: "Showroom",
  SECONDARY_DEPOT: "Depot secondaire",
  STORE: "Magasin",
};

export const stockMovementTypeLabels: Record<StockMovementType, string> = {
  IN: "Entree stock",
  OUT: "Sortie stock",
  TRANSFER: "Transfert",
  ADJUSTMENT: "Ajustement",
  RESERVED: "Reservation",
  RELEASED: "Liberation",
};

export const filterInputTypeLabels: Record<FilterInputType, string> = {
  CHECKBOX: "Checkbox",
  RADIO: "Radio",
  RANGE: "Intervalle",
  BOOLEAN: "Oui / non",
  SELECT: "Select",
  MULTI_SELECT: "Multi-select",
  SEARCH_LIST: "Liste recherchable",
  NUMERIC_RANGE: "Intervalle numerique",
};

export function formatDateTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("fr-MA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatShortDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("fr-MA", {
    dateStyle: "medium",
  }).format(date);
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("fr-MA", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value) + " DH";
}

type AdminTone = "success" | "warning" | "danger" | "info" | "muted";

export function getOrderStatusTone(status: OrderStatus): AdminTone {
  if (status === "DELIVERED") return "success";
  if (status === "CANCELLED" || status === "RETURNED") return "danger";
  if (status === "PENDING_CONFIRMATION") return "warning";
  return "info";
}

export function getQuoteStatusTone(status: QuoteStatus): AdminTone {
  if (status === "ACCEPTED") return "success";
  if (status === "REFUSED" || status === "EXPIRED") return "danger";
  if (status === "NEW") return "warning";
  return "info";
}

export function getContactStatusTone(status: ContactMessageStatus): AdminTone {
  if (status === "NEW") return "warning";
  if (status === "CONVERTED") return "success";
  if (status === "NO_ANSWER" || status === "CALLBACK") return "warning";
  if (status === "LOST" || status === "ARCHIVED") return "muted";
  return "info";
}

export function getProductStatusTone(status: ProductStatus): AdminTone {
  if (status === "PUBLISHED") return "success";
  if (status === "ARCHIVED" || status === "OUT_OF_STOCK") return "danger";
  if (status === "ON_ORDER") return "warning";
  return "muted";
}

export function getStockTone(quantity: number, threshold: number): AdminTone {
  if (quantity <= 0) return "danger";
  if (quantity <= threshold) return "warning";
  return "success";
}

export function getCustomerRelationshipTone(
  status: CustomerRelationshipStatus,
): AdminTone {
  if (status === "GOOD" || status === "LOYAL" || status === "VIP") {
    return "success";
  }
  if (status === "WATCH" || status === "LATE_PAYER") return "warning";
  if (status === "DISPUTE" || status === "BLOCKED") return "danger";
  return "info";
}

export function getSupplierPurchaseStatusTone(
  status: SupplierPurchaseStatus,
): AdminTone {
  if (status === "PAID") return "success";
  if (status === "CANCELLED") return "danger";
  if (status === "PARTIALLY_PAID") return "warning";
  if (status === "RECEIVED") return "info";
  return "muted";
}

export function getServiceTicketStatusTone(
  status: ServiceTicketStatus,
): AdminTone {
  if (status === "REPAIRED" || status === "REPLACED" || status === "CLOSED") {
    return "success";
  }
  if (status === "REFUSED") return "danger";
  if (status === "WAITING_PARTS" || status === "NEW") return "warning";
  return "info";
}

export function getServiceTicketUrgencyTone(
  urgency: ServiceTicketUrgency,
): AdminTone {
  if (urgency === "HIGH") return "danger";
  if (urgency === "MEDIUM") return "warning";
  return "info";
}
