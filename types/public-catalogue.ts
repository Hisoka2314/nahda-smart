import type {
  CatalogCategory,
  CatalogProduct,
  FilterGroup,
} from "@/types/catalogue";
import type { Product, ProductCategory } from "@/types/product";

export type PublicCatalogueData = {
  products: CatalogProduct[];
  categories: CatalogCategory[];
  filterGroups: FilterGroup[];
};

export type PublicBrandMark = {
  name: string;
  slug: string;
  logoPath?: string;
  fallbackLabel: string;
  isOfficialAsset: boolean;
};

export type PublicHomeData = {
  categories: ProductCategory[];
  featuredProducts: Product[];
  recommendedProducts: Product[];
  promoProducts: Product[];
  brands: PublicBrandMark[];
};

export type PublicProductPageData = {
  product: CatalogProduct | null;
  relatedProducts: Product[];
  accessoryProducts: Product[];
  recentProducts: Product[];
};

export type PublicSearchData = {
  query: string;
  products: CatalogProduct[];
};
