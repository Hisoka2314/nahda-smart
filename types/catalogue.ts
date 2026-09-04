export type StockStatus = "in_stock" | "on_order" | "out_of_stock";

export type ProductCondition = "new" | "used" | "refurbished";

export type ProductUsage =
  | "home"
  | "office"
  | "enterprise"
  | "gaming"
  | "school"
  | "administration";

export type AttributeValue = string | number | boolean | string[];

export type StockLocation = "main_depot" | "showroom" | "on_order";

export type DeliveryMode = "delivery" | "pickup";

export type PurchaseType = "direct" | "quote" | "bundle";

export type ProductAudience =
  | "individual"
  | "company"
  | "school"
  | "administration"
  | "reseller";

export type ProductRange = "entry" | "mid" | "premium" | "professional";

export type WarrantyProvider = "supplier" | "store";

export type CatalogCategory = {
  name: string;
  slug: string;
  eyebrow: string;
  description: string;
  image: string;
  bannerImage: string;
  productCount: number;
};

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  // Fiche redigee et galerie complete, servies uniquement sur la page produit :
  // les inclure dans les listes alourdirait le catalogue de plusieurs centaines
  // de kilo-octets sans qu'aucune carte ne les affiche.
  description?: string;
  shortDescription?: string;
  images?: string[];
  categorySlug: string;
  brandSlug: string;
  brandName?: string;
  brandLogoPath?: string;
  brandIsOfficialAsset?: boolean;
  image: string;
  price: number;
  oldPrice?: number;
  stockStatus: StockStatus;
  // Stock physique total (tous depots) quand il vient de la base ;
  // absent pour les donnees statiques de demonstration.
  stockQuantity?: number;
  isPromo: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  rating: number;
  reviewCount: number;
  specs: string[];
  attributes: Record<string, AttributeValue>;
  usage: ProductUsage[];
  warranty: string;
  warrantyProvider: WarrantyProvider;
  condition: ProductCondition;
  deliveryAvailable: boolean;
  stockLocation: StockLocation;
  deliveryModes: DeliveryMode[];
  purchaseTypes: PurchaseType[];
  audiences: ProductAudience[];
  range: ProductRange;
  series: string;
  b2bQuoteCompatible: boolean;
  isRecommended: boolean;
  createdAt: string;
  salesRank: number;
};

export type FilterOption = {
  id?: string;
  label: string;
  value: string;
  count?: number;
  order?: number;
};

export type FilterGroupTone = "primary" | "advanced";

export type AttributeFilter = {
  key: string;
  label: string;
  options: FilterOption[];
  searchable?: boolean;
  tone?: FilterGroupTone;
};

export type FilterInputType =
  | "checkbox"
  | "radio"
  | "range"
  | "boolean"
  | "select"
  | "multi-select"
  | "search-list"
  | "numeric-range";

export type FilterAttributeSource =
  | "product-attribute"
  | "product-field"
  | "system";

export type FilterAttribute = {
  id: string;
  groupId: string;
  categorySlug: string;
  label: string;
  slug: string;
  type: FilterInputType;
  unit?: string;
  filterable: boolean;
  searchable: boolean;
  visible: boolean;
  order: number;
  options: FilterOption[];
  defaultOpen?: boolean;
  showEmptyOptions?: boolean;
  source?: FilterAttributeSource;
  paramKey?: string;
};

export type FilterGroup = {
  id: string;
  categorySlug: string;
  name: string;
  order: number;
  defaultOpen: boolean;
  isAdvanced: boolean;
  attributes: FilterAttribute[];
};

export type CategoryFilterConfig = {
  id: string;
  name: string;
  slug: string;
  filterGroups: FilterGroup[];
};

export type SortKey =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "best-sellers"
  | "promotions";

export type ProductViewMode = "grid" | "list";
