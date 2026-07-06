import {
  SupplierNoteType,
  SupplierPurchaseStatus,
  SupplierType,
} from "@prisma/client";
import { z } from "zod";
import {
  nonNegativeMoneySchema,
  optionalEmailSchema,
  optionalTextSchema,
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

export const supplierTagOptions = [
  "prix-interessant",
  "livraison-rapide",
  "garantie-fiable",
  "paiement-flexible",
  "a-surveiller",
  "probleme-sav",
  "import-direct",
] as const;

export const supplierTagLabels: Record<(typeof supplierTagOptions)[number], string> = {
  "prix-interessant": "Prix interessant",
  "livraison-rapide": "Livraison rapide",
  "garantie-fiable": "Garantie fiable",
  "paiement-flexible": "Paiement flexible",
  "a-surveiller": "A surveiller",
  "probleme-sav": "Probleme SAV",
  "import-direct": "Import direct",
};

export const adminSupplierSchema = z.object({
  id: optionalString,
  name: z.string().trim().min(2, "Nom fournisseur obligatoire."),
  phone: optionalString,
  email: optionalEmailSchema,
  city: optionalString,
  address: optionalString,
  type: z.enum(SupplierType),
  notes: optionalTextSchema,
  tags: z.array(z.enum(supplierTagOptions)).default([]),
  isActive: z.coerce.boolean().default(false),
});

export const adminSupplierNoteSchema = z.object({
  supplierId: z.string().min(1),
  type: z.enum(SupplierNoteType).default("INFORMATION"),
  content: z.string().trim().min(2, "Note obligatoire.").max(2000),
  returnTo: z.string().optional(),
});

export const adminSupplierPurchaseItemSchema = z.object({
  productId: z.string().min(1),
  quantity: positiveQuantitySchema,
  unitBuyPrice: nonNegativeMoneySchema,
  updateProductPrice: z.coerce.boolean().default(false),
});

export const adminSupplierPurchaseSchema = z
  .object({
    supplierId: z.string().min(1),
    depotId: z.string().min(1, "Depot de reception obligatoire."),
    reference: optionalString,
    date: z.coerce.date(),
    status: z.enum(SupplierPurchaseStatus).default("DRAFT"),
    transportFee: nonNegativeMoneySchema.default(0),
    customsFee: nonNegativeMoneySchema.default(0),
    otherFee: nonNegativeMoneySchema.default(0),
    paid: nonNegativeMoneySchema.default(0),
    notes: optionalTextSchema,
    items: z.array(adminSupplierPurchaseItemSchema).min(1, "Ajoutez au moins un produit."),
  })
  .superRefine((value, context) => {
    const seen = new Set<string>();
    let totalItems = 0;

    value.items.forEach((item, index) => {
      if (seen.has(item.productId)) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "productId"],
          message: "Ce produit est deja ajoute.",
        });
      }
      seen.add(item.productId);
      totalItems += item.quantity * item.unitBuyPrice;
    });

    const total =
      totalItems + value.transportFee + value.customsFee + value.otherFee;

    if (value.paid > total) {
      context.addIssue({
        code: "custom",
        path: ["paid"],
        message: "Le montant paye ne peut pas depasser le total achat.",
      });
    }

    if (value.status === "CANCELLED" && value.paid > 0) {
      context.addIssue({
        code: "custom",
        path: ["status"],
        message: "Un achat annule ne doit pas avoir de paiement.",
      });
    }
  });

export const adminSupplierPaymentSchema = z.object({
  purchaseId: z.string().min(1),
  amount: nonNegativeMoneySchema,
  method: optionalString,
  note: optionalTextSchema,
  returnTo: z.string().optional(),
});

export const adminSupplierPurchaseStatusSchema = z.object({
  purchaseId: z.string().min(1),
  returnTo: z.string().optional(),
});

export type AdminSupplierInput = z.infer<typeof adminSupplierSchema>;
export type AdminSupplierPurchaseInput = z.infer<typeof adminSupplierPurchaseSchema>;
