import {
  ContactMessageStatus,
  CustomerType,
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  QuoteStatus,
} from "@prisma/client";
import { z } from "zod";

export const adminOrderStatusUpdateSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(OrderStatus),
  note: z.string().max(800).optional(),
  returnTo: z.string().optional(),
});

export const adminOrderInternalNoteSchema = z.object({
  orderId: z.string().min(1),
  internalNote: z.string().max(3000).optional(),
  returnTo: z.string().optional(),
});

export const adminQuoteStatusUpdateSchema = z.object({
  quoteId: z.string().min(1),
  status: z.enum(QuoteStatus),
  returnTo: z.string().optional(),
});

export const adminContactStatusUpdateSchema = z.object({
  contactId: z.string().min(1),
  status: z.enum(ContactMessageStatus),
  returnTo: z.string().optional(),
});

export const adminOrderFiltersSchema = z.object({
  q: z.string().optional(),
  status: z.enum(OrderStatus).optional(),
  customerType: z.enum(CustomerType).optional(),
  payment: z.enum(PaymentMethod).optional(),
  delivery: z.enum(DeliveryMethod).optional(),
  date: z.enum(["today", "7d", "30d"]).optional(),
});

export const adminQuoteFiltersSchema = z.object({
  q: z.string().optional(),
  status: z.enum(QuoteStatus).optional(),
});

export const adminContactFiltersSchema = z.object({
  q: z.string().optional(),
  status: z.enum(ContactMessageStatus).optional(),
});

export const adminClientFiltersSchema = z.object({
  q: z.string().optional(),
  type: z.enum(CustomerType).optional(),
});

export function safeAdminReturnPath(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/admin")) return fallback;
  if (value.startsWith("//") || value.includes("://")) return fallback;
  return value;
}
