import { z } from "zod";
import { NAHDA_WHATSAPP_NUMBER } from "@/lib/contact";
import type { CartItem } from "@/types/cart";
import type {
  CheckoutFormValues,
  CustomerType,
  DeliveryMethod,
  MockOrder,
  PaymentMethod,
  QuoteFormValues,
  QuoteNeed,
  QuoteRequest,
  QuoteUrgency,
} from "@/types/order";

export const ORDER_STORAGE_KEY = "nahda-smart-orders-v1";
export const QUOTE_STORAGE_KEY = "nahda-smart-quotes-v1";

export const customerTypeLabels: Record<CustomerType, string> = {
  individual: "Particulier",
  company: "Société",
  school: "École",
  administration: "Administration",
  reseller: "Revendeur",
  association: "Association",
};

export const deliveryMethodLabels: Record<DeliveryMethod, string> = {
  home_delivery: "Livraison à domicile",
  store_pickup: "Retrait sur place",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash_on_delivery: "Paiement à la livraison",
  pay_in_store: "Paiement sur place / retrait magasin",
};

export const orderStatusLabels = {
  pending_confirmation: "En attente de confirmation",
} satisfies Record<MockOrder["status"], string>;

export const quoteStatusLabels = {
  new: "Nouveau",
} satisfies Record<QuoteRequest["status"], string>;

export const quoteUrgencyLabels: Record<QuoteUrgency, string> = {
  normal: "Normal",
  urgent: "Urgent",
  planned: "Projet planifié",
};

export const quoteNeedLabels: Record<QuoteNeed, string> = {
  simple_purchase: "Achat simple",
  installation: "Installation",
  maintenance: "Maintenance",
  technical_advice: "Conseil technique",
  complete_solution: "Solution complète",
};

const professionalCustomerTypes = new Set<CustomerType>([
  "company",
  "school",
  "administration",
  "reseller",
  "association",
]);

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const optionalEmailSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().email("Email invalide.").optional());

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Le téléphone est obligatoire.")
  .refine(isMoroccanPhone, "Téléphone marocain invalide.");

const customerTypeSchema = z.enum([
  "individual",
  "company",
  "school",
  "administration",
  "reseller",
  "association",
]);

export const checkoutSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Le nom complet est obligatoire."),
    phone: phoneSchema,
    email: optionalEmailSchema,
    city: z.string().trim().min(2, "La ville est obligatoire."),
    address: optionalTrimmedString,
    customerType: customerTypeSchema,
    organizationName: optionalTrimmedString,
    note: optionalTrimmedString,
    deliveryMethod: z.enum(["home_delivery", "store_pickup"]),
    paymentMethod: z.enum(["cash_on_delivery", "pay_in_store"]),
  })
  .superRefine((data, context) => {
    if (data.deliveryMethod === "home_delivery" && !data.address) {
      context.addIssue({
        code: "custom",
        path: ["address"],
        message: "L'adresse est obligatoire pour la livraison à domicile.",
      });
    }

    if (
      isProfessionalCustomerType(data.customerType) &&
      !data.organizationName
    ) {
      context.addIssue({
        code: "custom",
        path: ["organizationName"],
        message: "Le nom de l'organisation est obligatoire pour ce type client.",
      });
    }
  });

export const quoteSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Le nom complet est obligatoire."),
    phone: phoneSchema,
    email: optionalEmailSchema,
    customerType: customerTypeSchema,
    organizationName: optionalTrimmedString,
    city: z.string().trim().min(2, "La ville est obligatoire."),
    message: optionalTrimmedString,
    productSlug: optionalTrimmedString,
    productName: optionalTrimmedString,
    desiredProducts: optionalTrimmedString,
    desiredQuantity: z.coerce
      .number()
      .int("La quantité doit être un nombre entier.")
      .min(1, "La quantité doit être au minimum 1.")
      .max(999, "La quantité demandée est trop élevée pour ce formulaire."),
    estimatedBudget: z.preprocess((value) => {
      if (typeof value !== "string") {
        return undefined;
      }

      const trimmed = value.trim();
      return trimmed.length > 0 ? Number(trimmed) : undefined;
    }, z.number().positive("Le budget doit être positif.").optional()),
    urgency: z.enum(["normal", "urgent", "planned"]),
    needs: z
      .array(
        z.enum([
          "simple_purchase",
          "installation",
          "maintenance",
          "technical_advice",
          "complete_solution",
        ]),
      )
      .min(1, "Choisissez au moins un besoin."),
  })
  .superRefine((data, context) => {
    if (
      isProfessionalCustomerType(data.customerType) &&
      !data.organizationName
    ) {
      context.addIssue({
        code: "custom",
        path: ["organizationName"],
        message: "Le nom de l'organisation est obligatoire pour ce type client.",
      });
    }

    if (!data.productSlug && !data.desiredProducts) {
      context.addIssue({
        code: "custom",
        path: ["desiredProducts"],
        message: "Indiquez les produits souhaités ou partez d'un produit.",
      });
    }
  });

export type CheckoutValidatedValues = z.infer<typeof checkoutSchema>;
export type QuoteValidatedValues = z.infer<typeof quoteSchema>;
export type FieldErrors = Record<string, string>;

export function isProfessionalCustomerType(type: CustomerType) {
  return professionalCustomerTypes.has(type);
}

// Le tarif vient des reglages du site (SiteSetting.deliveryFee) et transite
// par le composant : ce module s'execute cote client et ne peut pas lire la
// base. Le montant fait foi cote serveur dans createWebsiteOrder.
export function getDeliveryFee(method: DeliveryMethod, homeDeliveryFee: number) {
  return method === "home_delivery" ? homeDeliveryFee : 0;
}

export function calculateCartSubtotal(items: CartItem[]) {
  return items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );
}

export function createMockOrder(
  values: CheckoutValidatedValues,
  items: CartItem[],
  homeDeliveryFee: number,
): MockOrder {
  if (items.length === 0) {
    throw new Error("Votre panier est vide.");
  }

  const normalizedItems = normalizeOrderItems(items);

  if (normalizedItems.length === 0) {
    throw new Error("Votre panier ne contient aucun produit disponible.");
  }

  const orders = readMockOrders();
  const subtotal = calculateCartSubtotal(normalizedItems);
  const deliveryFee = getDeliveryFee(values.deliveryMethod, homeDeliveryFee);
  const order: MockOrder = {
    orderNumber: generateDocumentNumber("CMD", orders.length + 1),
    customer: {
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      city: values.city,
      address: values.address,
      customerType: values.customerType,
      organizationName: values.organizationName,
      note: values.note,
    },
    items: normalizedItems,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    deliveryMethod: values.deliveryMethod,
    paymentMethod: values.paymentMethod,
    status: "pending_confirmation",
    createdAt: new Date().toISOString(),
  };

  writeMockOrders([order, ...orders]);
  return order;
}

export function createMockQuote(
  values: QuoteValidatedValues,
): QuoteRequest {
  const quotes = readMockQuotes();
  const quote: QuoteRequest = {
    quoteNumber: generateDocumentNumber("DEV", quotes.length + 1),
    fullName: values.fullName,
    phone: values.phone,
    email: values.email,
    customerType: values.customerType,
    organizationName: values.organizationName,
    city: values.city,
    message: values.message,
    productSlug: values.productSlug,
    productName: values.productName,
    desiredProducts: values.desiredProducts,
    desiredQuantity: values.desiredQuantity,
    estimatedBudget: values.estimatedBudget,
    urgency: values.urgency,
    needs: values.needs,
    status: "new",
    createdAt: new Date().toISOString(),
  };

  writeMockQuotes([quote, ...quotes]);
  return quote;
}

export function readMockOrders(): MockOrder[] {
  return readJsonStorage<MockOrder[]>(ORDER_STORAGE_KEY, []);
}

export function readMockQuotes(): QuoteRequest[] {
  return readJsonStorage<QuoteRequest[]>(QUOTE_STORAGE_KEY, []);
}

export function findMockOrder(orderNumber: string, phone: string) {
  const normalizedOrder = orderNumber.trim().toUpperCase();
  const normalizedPhone = normalizePhone(phone);

  return readMockOrders().find(
    (order) =>
      order.orderNumber.toUpperCase() === normalizedOrder &&
      normalizePhone(order.customer.phone) === normalizedPhone,
  );
}

export function buildOrderWhatsappUrl(orderNumber: string) {
  const text = `Bonjour Nahda Smart, je viens de passer une commande. Numéro : ${orderNumber}`;

  return `https://wa.me/${NAHDA_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function formatZodErrors(error: z.ZodError): FieldErrors {
  return error.issues.reduce<FieldErrors>((errors, issue) => {
    const field = issue.path[0];

    if (typeof field === "string" && !errors[field]) {
      errors[field] = issue.message;
    }

    return errors;
  }, {});
}

export function getInitialCheckoutValues(): CheckoutFormValues {
  return {
    fullName: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    customerType: "individual",
    organizationName: "",
    note: "",
    deliveryMethod: "home_delivery",
    paymentMethod: "cash_on_delivery",
  };
}

export function getInitialQuoteValues(
  product?: { slug: string; name: string },
): QuoteFormValues {
  return {
    fullName: "",
    phone: "",
    email: "",
    customerType: product ? "company" : "individual",
    organizationName: "",
    city: "",
    message: "",
    productSlug: product?.slug,
    productName: product?.name,
    desiredProducts: "",
    desiredQuantity: "1",
    estimatedBudget: "",
    urgency: "normal",
    needs: ["simple_purchase"],
  };
}

function generateDocumentNumber(prefix: "CMD" | "DEV", index: number) {
  const year = new Date().getFullYear();
  const sequence = String(index).padStart(4, "0");
  const randomSuffix = Math.random().toString(36).slice(2, 5).toUpperCase();

  return `${prefix}-${year}-${sequence}${randomSuffix}`;
}

function normalizeOrderItems(items: CartItem[]) {
  return items
    .filter(
      (item) =>
        item.product &&
        item.product.stockStatus !== "out_of_stock" &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0,
    )
    .map((item) => ({
      ...item,
      quantity: Math.max(1, Math.floor(item.quantity)),
    }));
}

function isMoroccanPhone(phone: string) {
  const normalized = normalizePhone(phone);

  return /^(?:0[5-8]\d{8}|212[5-8]\d{8})$/.test(normalized);
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

function readJsonStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
}

function writeMockOrders(orders: MockOrder[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
}

function writeMockQuotes(quotes: QuoteRequest[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(quotes));
}
