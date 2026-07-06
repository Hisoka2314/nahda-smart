export type PublicOrderItemDTO = {
  productSlug: string;
  productName: string;
  productImage: string;
  brandName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type PublicOrderDTO = {
  orderNumber: string;
  status: string;
  statusLabel: string;
  deliveryMethod: string;
  deliveryMethodLabel: string;
  paymentMethod: string;
  paymentMethodLabel: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  customer: {
    name: string;
    city?: string;
    type: string;
    typeLabel: string;
    organizationName?: string;
  };
  items: PublicOrderItemDTO[];
};

export type OrderTrackingDTO = PublicOrderDTO;

export type PublicQuoteDTO = {
  quoteNumber: string;
  status: string;
  statusLabel: string;
  createdAt: string;
};

export type ContactResultDTO = {
  id: string;
  status: string;
  statusLabel: string;
  createdAt: string;
};
