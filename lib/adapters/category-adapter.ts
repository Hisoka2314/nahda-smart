import {
  catalogueCategories,
  catalogueImages,
} from "@/data/catalogue";
import { categories as homeCategories } from "@/data/products";
import type { CatalogCategory } from "@/types/catalogue";
import type { ProductCategory, ProductCategoryIconKey } from "@/types/product";

const catalogueFallbackBySlug = new Map(
  catalogueCategories.map((category) => [category.slug, category]),
);
const homeFallbackBySlug = new Map(
  homeCategories.map((category) => [category.slug, category]),
);

type PrismaPublicCategory = {
  name: string;
  slug: string;
  description: string | null;
  bannerUrl: string | null;
  icon: string | null;
  _count?: { products: number };
};

export function prismaCategoryToCatalogCategory(
  category: PrismaPublicCategory,
): CatalogCategory {
  const fallback = catalogueFallbackBySlug.get(category.slug);
  const image = fallback?.image ?? imageForCategory(category.slug);

  return {
    name: category.name,
    slug: category.slug,
    eyebrow: fallback?.eyebrow ?? "Catalogue",
    description:
      category.description ??
      fallback?.description ??
      "Produits tech Nahda Smart disponibles pour particuliers et professionnels.",
    image,
    bannerImage: category.bannerUrl ?? fallback?.bannerImage ?? image,
    productCount: category._count?.products ?? fallback?.productCount ?? 0,
  };
}

export function prismaCategoryToProductCategory(
  category: PrismaPublicCategory,
): ProductCategory {
  const fallback = homeFallbackBySlug.get(category.slug);

  return {
    name: category.name,
    slug: category.slug,
    description:
      category.description ??
      fallback?.description ??
      "Famille de produits tech Nahda Smart.",
    image: category.bannerUrl ?? fallback?.image ?? imageForCategory(category.slug),
    iconKey: fallback?.iconKey ?? iconForCategory(category.slug),
    cta: "Voir tout",
    productCount: category._count?.products ?? fallback?.productCount ?? 0,
  };
}

export function imageForCategory(slug: string) {
  if (slug.includes("portable")) return catalogueImages.laptop;
  if (slug.includes("bureau")) return catalogueImages.desktop;
  if (slug.includes("all-in-one")) return catalogueImages.aio;
  if (slug.includes("reseaux")) return catalogueImages.router;
  if (slug.includes("securite")) return catalogueImages.camera;
  if (slug.includes("impression")) return catalogueImages.printer;
  if (slug.includes("stockage")) return catalogueImages.ssd;
  if (slug.includes("onduleurs")) return catalogueImages.ups;
  if (slug.includes("telephonie")) return catalogueImages.phone;
  if (slug.includes("baies")) return catalogueImages.rack;
  if (slug.includes("multimedia")) return catalogueImages.headset;
  if (slug.includes("logiciels")) return catalogueImages.software;

  return catalogueImages.accessories;
}

function iconForCategory(slug: string): ProductCategoryIconKey {
  if (slug.includes("portable")) return "laptops";
  if (slug.includes("bureau")) return "desktops";
  if (slug.includes("all-in-one")) return "allInOne";
  if (slug.includes("logiciels")) return "software";
  if (slug.includes("impression")) return "printing";
  if (slug.includes("reseaux")) return "network";
  if (slug.includes("multimedia")) return "multimedia";
  if (slug.includes("peripheriques")) return "peripherals";
  if (slug.includes("securite")) return "security";
  if (slug.includes("telephonie")) return "telephony";
  if (slug.includes("stockage")) return "storage";

  return "accessories";
}
