import { brandSlugMap } from "@/data/brands";
import { catalogueCategoryMap } from "@/data/catalogue";
import type {
  CatalogProduct,
  DeliveryMode,
  ProductAudience,
  ProductCondition,
  ProductRange,
  ProductUsage,
  PurchaseType,
  StockLocation,
  StockStatus,
  WarrantyProvider,
} from "@/types/catalogue";
import type { Product } from "@/types/product";

export const stockStatusLabels: Record<StockStatus, string> = {
  in_stock: "En stock",
  on_order: "Sur commande",
  out_of_stock: "Rupture",
};

export const conditionLabels: Record<ProductCondition, string> = {
  new: "Neuf",
  used: "Occasion",
  refurbished: "Reconditionné",
};

export const usageLabels: Record<ProductUsage, string> = {
  home: "Maison",
  office: "Bureau",
  enterprise: "Entreprise",
  gaming: "Gaming",
  school: "École",
  administration: "Administration",
};

export const stockLocationLabels: Record<StockLocation, string> = {
  main_depot: "Dépôt principal",
  showroom: "Showroom",
  on_order: "Sur commande",
};

export const deliveryModeLabels: Record<DeliveryMode, string> = {
  delivery: "Livraison disponible",
  pickup: "Retrait sur place",
};

export const purchaseTypeLabels: Record<PurchaseType, string> = {
  direct: "Achat direct",
  quote: "Demande de devis",
  bundle: "Pack / bundle",
};

export const audienceLabels: Record<ProductAudience, string> = {
  individual: "Particulier",
  company: "Entreprise",
  school: "École",
  administration: "Administration",
  reseller: "Revendeur",
};

export const rangeLabels: Record<ProductRange, string> = {
  entry: "Entrée de gamme",
  mid: "Milieu de gamme",
  premium: "Premium",
  professional: "Professionnel",
};

export const warrantyProviderLabels: Record<WarrantyProvider, string> = {
  supplier: "Garantie fournisseur",
  store: "Garantie magasin",
};

export function getBrandName(brandSlug: string) {
  return brandSlugMap[brandSlug]?.name ?? titleFromSlug(brandSlug);
}

export function getBrandFallbackLabel(brandSlug: string) {
  return brandSlugMap[brandSlug]?.fallbackLabel ?? getBrandName(brandSlug);
}

export function getCategoryName(categorySlug: string) {
  return catalogueCategoryMap[categorySlug]?.name ?? titleFromSlug(categorySlug);
}

export function getDiscountLabel(product: CatalogProduct) {
  if (!product.oldPrice || product.oldPrice <= product.price) {
    return undefined;
  }

  const percent = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
  return `-${percent}%`;
}

export function toProductCardProduct(product: CatalogProduct): Product {
  const brand = brandSlugMap[product.brandSlug];
  const logoPath = product.brandIsOfficialAsset
    ? product.brandLogoPath
    : brand?.logoPath;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brandName ?? brand?.name ?? getBrandName(product.brandSlug),
    brandSlug: product.brandSlug,
    brandLogoPath: logoPath,
    category: getCategoryName(product.categorySlug),
    description: product.specs.join(" · "),
    specs: product.specs,
    price: product.price,
    compareAtPrice: product.oldPrice,
    image: product.image,
    status: product.stockStatus,
    stockQuantity: product.stockQuantity,
    isPromo: product.isPromo,
    discountLabel: getDiscountLabel(product),
    rating: product.rating,
    reviewCount: product.reviewCount,
  };
}

export function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
