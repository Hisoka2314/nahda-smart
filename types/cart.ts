import type { StockStatus } from "@/types/catalogue";

export type CartProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  price: number;
  oldPrice?: number;
  stockStatus: StockStatus | "low_stock";
  specs: string[];
  maxQuantity: number;
};

export type CartItem = {
  product: CartProduct;
  quantity: number;
};

export type CartAddResult = {
  ok: boolean;
  message: string;
};
