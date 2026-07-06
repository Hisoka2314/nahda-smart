import {
  ServiceTicketNoteType,
  ServiceTicketStatus,
  ServiceTicketType,
  ServiceTicketUrgency,
} from "@prisma/client";
import { z } from "zod";
import {
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

export const adminServiceTicketCreateSchema = z.object({
  customerId: z.string().min(1, "Client obligatoire."),
  orderId: optionalString,
  productId: optionalString,
  supplierId: optionalString,
  type: z.enum(ServiceTicketType),
  urgency: z.enum(ServiceTicketUrgency).default("MEDIUM"),
  problem: z.string().trim().min(5, "Description probleme obligatoire.").max(4000),
  internalNotes: optionalTextSchema,
});

export const adminServiceTicketStatusSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(ServiceTicketStatus),
  note: optionalString,
  returnTo: z.string().optional(),
});

export const adminServiceTicketNoteSchema = z.object({
  ticketId: z.string().min(1),
  type: z.enum(ServiceTicketNoteType).default("INTERNAL"),
  content: z.string().trim().min(2, "Note obligatoire.").max(3000),
  returnTo: z.string().optional(),
});

export const adminServiceTicketResolutionSchema = z
  .object({
    ticketId: z.string().min(1),
    action: z.enum(["REPAIR", "REPLACE", "CLOSE"]),
    depotId: optionalString,
    quantity: positiveQuantitySchema.default(1),
    returnToStock: z.coerce.boolean().default(false),
    note: optionalString,
    returnTo: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.action === "REPLACE" && !value.depotId) {
      context.addIssue({
        code: "custom",
        path: ["depotId"],
        message: "Depot obligatoire pour un remplacement.",
      });
    }

    if (value.action === "REPAIR" && value.returnToStock && !value.depotId) {
      context.addIssue({
        code: "custom",
        path: ["depotId"],
        message: "Depot obligatoire pour retourner le produit en stock.",
      });
    }
  });

export type AdminServiceTicketCreateInput = z.infer<
  typeof adminServiceTicketCreateSchema
>;
export type AdminServiceTicketResolutionInput = z.infer<
  typeof adminServiceTicketResolutionSchema
>;
