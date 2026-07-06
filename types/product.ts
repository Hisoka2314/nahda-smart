export type ProductStatus =
  | "in_stock"
  | "on_order"
  | "low_stock"
  | "out_of_stock";

export type ProductCategoryIconKey =
  | "laptops"
  | "desktops"
  | "allInOne"
  | "software"
  | "printing"
  | "network"
  | "multimedia"
  | "peripherals"
  | "security"
  | "accessories"
  | "telephony"
  | "storage";

export type ProductCategory = {
  name: string;
  slug: string;
  description: string;
  image: string;
  iconKey: ProductCategoryIconKey;
  cta?: string;
  productCount?: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  brandSlug?: string;
  brandLogoPath?: string;
  category: string;
  description: string;
  specs: string[];
  price: number;
  compareAtPrice?: number;
  image: string;
  status: ProductStatus;
  // Stock physique total (tous depots) quand il vient de la base ;
  // absent pour les donnees statiques de demonstration.
  stockQuantity?: number;
  isPromo?: boolean;
  discountLabel?: string;
  rating?: number;
  reviewCount?: number;
};
