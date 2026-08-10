import { z } from "zod";
import {
  moroccanPhoneSchema,
  nonNegativeMoneySchema,
  optionalTextSchema,
  positiveQuantitySchema,
  slugSchema,
} from "@/lib/validations/common";
import { customerSchema } from "@/lib/validations/customer";

export const deliveryMethodSchema = z.enum([
  "HOME_DELIVERY",
  "PICKUP_IN_STORE",
]);

export const paymentMethodSchema = z.enum([
  "CASH_ON_DELIVERY",
  "PAY_ON_SITE",
]);

export const orderItemSchema = z.object({
  productId: z.string().min(1, "Produit obligatoire."),
  quantity: positiveQuantitySchema,
  unitPrice: nonNegativeMoneySchema,
});

export const createOrderSchema = z
  .object({
    customer: customerSchema,
    deliveryMethod: deliveryMethodSchema,
    paymentMethod: paymentMethodSchema,
    deliveryFee: nonNegativeMoneySchema.default(0),
    customerNote: optionalTextSchema,
    items: z
      .array(orderItemSchema)
      .min(1, "Une commande doit contenir au moins un produit."),
  })
  .superRefine((value, context) => {
    if (
      value.deliveryMethod === "HOME_DELIVERY" &&
      !value.customer.address?.trim()
    ) {
      context.addIssue({
        code: "custom",
        path: ["customer", "address"],
        message: "L’adresse est obligatoire pour la livraison à domicile.",
      });
    }
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const publicCustomerTypeSchema = z.enum([
  "individual",
  "company",
  "school",
  "administration",
  "reseller",
  "association",
]);

export const publicDeliveryMethodSchema = z.enum([
  "home_delivery",
  "store_pickup",
]);

export const publicPaymentMethodSchema = z.enum([
  "cash_on_delivery",
  "pay_in_store",
]);

export const websiteOrderItemSchema = z.object({
  productSlug: slugSchema,
  quantity: positiveQuantitySchema.max(
    20,
    "Quantité maximale dépassée. Pour une commande en volume, demandez un devis.",
  ),
});

export const websiteOrderSchema = z
  .object({
    customer: z.object({
      fullName: z.string().trim().min(2, "Le nom complet est obligatoire."),
      phone: moroccanPhoneSchema,
      email: z
        .string()
        .trim()
        .email("Email invalide.")
        .optional()
        .or(z.literal("")),
      city: z.string().trim().min(2, "La ville est obligatoire."),
      address: z.string().trim().optional().or(z.literal("")),
      customerType: publicCustomerTypeSchema,
      organizationName: z.string().trim().optional().or(z.literal("")),
      note: optionalTextSchema,
    }),
    deliveryMethod: publicDeliveryMethodSchema,
    paymentMethod: publicPaymentMethodSchema,
    items: z
      .array(websiteOrderItemSchema)
      .min(1, "Une commande doit contenir au moins un produit.")
      .max(
        30,
        "Trop d'articles dans la commande. Pour une commande en volume, demandez un devis.",
      ),
  })
  .superRefine((value, context) => {
    if (
      value.deliveryMethod === "home_delivery" &&
      !value.customer.address?.trim()
    ) {
      context.addIssue({
        code: "custom",
        path: ["customer", "address"],
        message: "L'adresse est obligatoire pour la livraison à domicile.",
      });
    }

    if (
      value.customer.customerType !== "individual" &&
      !value.customer.organizationName?.trim()
    ) {
      context.addIssue({
        code: "custom",
        path: ["customer", "organizationName"],
        message: "Le nom de l'organisation est obligatoire pour ce type client.",
      });
    }
  });

export const orderTrackingSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(4, "Le numéro de commande est obligatoire.")
    .max(40, "Le numéro de commande est trop long."),
  phone: moroccanPhoneSchema,
});

export type WebsiteOrderInput = z.infer<typeof websiteOrderSchema>;
export type OrderTrackingInput = z.infer<typeof orderTrackingSchema>;
