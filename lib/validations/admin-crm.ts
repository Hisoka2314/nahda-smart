import {
  CustomerLevel,
  CustomerNoteType,
  CustomerRelationshipStatus,
  CustomerSource,
  CustomerType,
  DeliveryMethod,
  PaymentMethod,
} from "@prisma/client";
import { z } from "zod";
import {
  moroccanPhoneSchema,
  nonNegativeMoneySchema,
  optionalEmailSchema,
  positiveQuantitySchema,
} from "@/lib/validations/common";

const optionalString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    const text = value?.trim();
    return text ? text : undefined;
  });

export const adminCustomerTagOptions = [
  "fidele",
  "gros-client",
  "b2b",
  "sensible-prix",
  "livraison-rapide",
  "paiement-retarde",
  "besoin-support",
  "installation",
] as const;

export const adminCustomerSchema = z
  .object({
    id: optionalString,
    name: z.string().trim().min(2, "Nom client obligatoire."),
    phone: moroccanPhoneSchema,
    email: optionalEmailSchema.transform((value) => value || undefined),
    city: optionalString,
    address: optionalString,
    type: z.enum(CustomerType).default("INDIVIDUAL"),
    organizationName: optionalString,
    source: z.enum(CustomerSource).default("STORE"),
    level: z.enum(CustomerLevel).default("NEW"),
    relationshipStatus: z
      .enum(CustomerRelationshipStatus)
      .default("NORMAL"),
    internalNotes: optionalString,
    tags: z.array(z.enum(adminCustomerTagOptions)).default([]),
  })
  .superRefine((value, context) => {
    if (value.type !== "INDIVIDUAL" && !value.organizationName) {
      context.addIssue({
        code: "custom",
        path: ["organizationName"],
        message: "Le nom de l'organisation est obligatoire pour ce type client.",
      });
    }
  });

export const adminCustomerFiltersSchema = z.object({
  q: optionalString,
  type: z.enum(CustomerType).optional(),
  level: z.enum(CustomerLevel).optional(),
  relationshipStatus: z.enum(CustomerRelationshipStatus).optional(),
  source: z.enum(CustomerSource).optional(),
  city: optionalString,
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(10).max(50).default(20),
});

export const adminCustomerNoteSchema = z.object({
  customerId: z.string().min(1, "Client obligatoire."),
  type: z.enum(CustomerNoteType).default("INFORMATION"),
  content: z.string().trim().min(2, "La note est obligatoire.").max(3000),
  returnTo: optionalString,
});

export const adminManualOrderItemSchema = z.object({
  productId: z.string().min(1, "Produit obligatoire."),
  quantity: positiveQuantitySchema,
  unitPrice: nonNegativeMoneySchema,
  discount: z.preprocess(
    (value) => (value === "" ? 0 : value),
    z.coerce.number().min(0, "Remise invalide.").default(0),
  ),
});

export const adminManualOrderSchema = z
  .object({
    customerId: z.string().min(1, "Client obligatoire."),
    depotId: z.string().min(1, "Depot obligatoire."),
    deliveryMethod: z.enum(DeliveryMethod).default("PICKUP_IN_STORE"),
    paymentMethod: z.enum(PaymentMethod).default("PAY_ON_SITE"),
    status: z
      .enum(["PENDING_CONFIRMATION", "CONFIRMED"])
      .default("PENDING_CONFIRMATION"),
    customerNote: optionalString,
    internalNote: optionalString,
    items: z.array(adminManualOrderItemSchema).min(1, "Ajoutez au moins un produit."),
  })
  .superRefine((value, context) => {
    const productIds = new Set<string>();

    value.items.forEach((item, index) => {
      if (productIds.has(item.productId)) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "productId"],
          message: "Produit duplique dans la commande.",
        });
      }
      productIds.add(item.productId);

      if (item.discount > item.unitPrice * item.quantity) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "discount"],
          message: "La remise ne peut pas depasser le total de la ligne.",
        });
      }
    });
  });

export type AdminCustomerInput = z.infer<typeof adminCustomerSchema>;
export type AdminManualOrderInput = z.infer<typeof adminManualOrderSchema>;
export type AdminCustomerFiltersInput = z.infer<
  typeof adminCustomerFiltersSchema
>;
