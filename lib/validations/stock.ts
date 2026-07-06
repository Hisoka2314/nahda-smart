import { z } from "zod";
import { positiveQuantitySchema } from "@/lib/validations/common";

export const stockMovementTypeSchema = z.enum([
  "IN",
  "OUT",
  "TRANSFER",
  "ADJUSTMENT",
  "RESERVED",
  "RELEASED",
]);

export const stockMovementSchema = z.object({
  productId: z.string().min(1),
  depotId: z.string().min(1),
  type: stockMovementTypeSchema,
  quantity: positiveQuantitySchema,
  reason: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  createdById: z.string().min(1).optional(),
});

export type StockMovementInput = z.infer<typeof stockMovementSchema>;
