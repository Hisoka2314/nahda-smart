import { z } from "zod";
import {
  nonNegativeMoneySchema,
  optionalEmailSchema,
  optionalTextSchema,
  positiveQuantitySchema,
} from "@/lib/validations/common";

export const supplierTypeSchema = z.enum([
  "IMPORTER",
  "WHOLESALER",
  "RESELLER",
  "INDIVIDUAL",
  "DISTRIBUTOR",
]);

export const supplierSchema = z.object({
  name: z.string().trim().min(2, "Nom fournisseur obligatoire."),
  phone: z.string().trim().optional(),
  email: optionalEmailSchema,
  city: z.string().trim().optional(),
  address: z.string().trim().optional(),
  type: supplierTypeSchema,
  notes: optionalTextSchema,
});

export const supplierPurchaseItemSchema = z.object({
  productId: z.string().min(1),
  quantity: positiveQuantitySchema,
  unitBuyPrice: nonNegativeMoneySchema,
});

export const supplierPurchaseSchema = z.object({
  supplierId: z.string().min(1),
  reference: z.string().trim().optional(),
  paid: nonNegativeMoneySchema.default(0),
  date: z.coerce.date(),
  notes: optionalTextSchema,
  items: z.array(supplierPurchaseItemSchema).min(1),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
export type SupplierPurchaseInput = z.infer<typeof supplierPurchaseSchema>;
