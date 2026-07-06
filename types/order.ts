import type { CartItem } from "@/types/cart";

export type CustomerType =
  | "individual"
  | "company"
  | "school"
  | "administration"
  | "reseller"
  | "association";

export type DeliveryMethod = "home_delivery" | "store_pickup";

export type PaymentMethod = "cash_on_delivery" | "pay_in_store";

export type OrderStatus = "pending_confirmation";

export type QuoteStatus = "new";

export type QuoteUrgency = "normal" | "urgent" | "planned";

export type QuoteNeed =
  | "simple_purchase"
  | "installation"
  | "maintenance"
  | "technical_advice"
  | "complete_solution";

export type CustomerInfo = {
  fullName: string;
  phone: string;
  email?: string;
  city: string;
  address?: string;
  customerType: CustomerType;
  organizationName?: string;
  note?: string;
};

export type MockOrder = {
  orderNumber: string;
  customer: CustomerInfo;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
};

export type CheckoutFormValues = CustomerInfo & {
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
};

export type QuoteRequest = {
  quoteNumber: string;
  fullName: string;
  phone: string;
  email?: string;
  customerType: CustomerType;
  organizationName?: string;
  city: string;
  message?: string;
  productSlug?: string;
  productName?: string;
  desiredProducts?: string;
  desiredQuantity: number;
  estimatedBudget?: number;
  urgency: QuoteUrgency;
  needs: QuoteNeed[];
  status: QuoteStatus;
  createdAt: string;
};

export type QuoteFormValues = Omit<
  QuoteRequest,
  "quoteNumber" | "desiredQuantity" | "estimatedBudget" | "status" | "createdAt"
> & {
  desiredQuantity: string;
  estimatedBudget?: string;
};
