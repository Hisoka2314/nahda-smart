import { getCatalogueFilterGroups } from "@/data/filter-definitions";
import { toProductCardProduct } from "@/lib/catalogue";
import {
  getPublicCategories,
  getPublicCategoryBySlug,
  getPublicHomeCategories,
} from "@/lib/services/categories";
import { getPublicFiltersForCategories } from "@/lib/services/filters";
import {
  getBestSellingProducts,
  getPromoProducts,
  getPublicProductBySlug,
  getPublicProducts,
  getRecommendedProducts,
  getRelatedAccessoriesFromDb,
  getSimilarProductsFromDb,
  searchPublicProducts,
} from "@/lib/services/products";
import { brandAssets } from "@/data/brands";
import { getPrismaClient } from "@/lib/db";
import type {
  PublicBrandMark,
  PublicCatalogueData,
  PublicHomeData,
  PublicProductPageData,
  PublicSearchData,
} from "@/types/public-catalogue";

type CatalogueDataParams = {
  categorySlug?: string;
  selectedCategorySlugs?: string[];
  query?: string;
};

// Aucun repli sur les donnees de demonstration : si la base est indisponible,
// l'erreur remonte a app/error.tsx. Servir un catalogue fictif afficherait des
// produits inexistants a des prix inventes, et le client ne s'en apercevait
// qu'a l'echec de sa commande.
export async function getPublicCatalogueData(
  params: CatalogueDataParams = {},
): Promise<PublicCatalogueData> {
  const selectedSlugs = resolveFilterCategorySlugs(params);
  const [products, categories, filterGroups] = await Promise.all([
    getPublicProducts({
      categorySlug: params.categorySlug,
      search: params.query,
      take: 120,
    }),
    getPublicCategories(),
    getPublicFiltersForCategories(selectedSlugs),
  ]);

  return {
    products,
    categories,
    filterGroups:
      filterGroups.length > 0
        ? filterGroups
        : getCatalogueFilterGroups({
            categorySlug: params.categorySlug,
            selectedCategorySlugs: params.selectedCategorySlugs ?? [],
            includeCategoryFilter: !params.categorySlug,
          }),
  };
}

export async function getPublicCategoryData(slug: string) {
  return { category: await getPublicCategoryBySlug(slug) };
}

const staticBrandMarks: PublicBrandMark[] = brandAssets.map((brand) => ({
  name: brand.name,
  slug: brand.slug,
  logoPath: brand.logoPath,
  fallbackLabel: brand.fallbackLabel,
  isOfficialAsset: brand.isOfficialAsset,
}));

async function getPublicBrandMarks(): Promise<PublicBrandMark[]> {
  const db = getPrismaClient();
  const brands = await db.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      name: true,
      slug: true,
      logoPath: true,
      isOfficialAsset: true,
    },
  });

  // Les logos de marques sont des visuels statiques, pas des donnees
  // commerciales : ce repli-la n'invente aucun produit ni aucun prix.
  if (brands.length === 0) {
    return staticBrandMarks;
  }

  return brands.map((brand) => ({
    name: brand.name,
    slug: brand.slug,
    logoPath: brand.logoPath ?? undefined,
    fallbackLabel: brand.name,
    isOfficialAsset: brand.isOfficialAsset,
  }));
}

export async function getPublicHomeData(): Promise<PublicHomeData> {
  const [categories, bestSellers, recommendedProducts, promoProducts, brands] =
    await Promise.all([
      getPublicHomeCategories(),
      getBestSellingProducts(12),
      getRecommendedProducts(12),
      getPromoProducts(12),
      getPublicBrandMarks(),
    ]);

  return {
    categories,
    featuredProducts: bestSellers.map(toProductCardProduct),
    recommendedProducts: recommendedProducts.map(toProductCardProduct),
    promoProducts: promoProducts.map(toProductCardProduct),
    brands,
  };
}

export async function getPublicProductPageData(
  slug: string,
): Promise<PublicProductPageData> {
  const product = await getPublicProductBySlug(slug);

  // Produit absent de la base : la page doit rendre un 404, pas un produit
  // de demonstration portant le meme slug.
  if (!product) {
    return {
      product: null,
      relatedProducts: [],
      accessoryProducts: [],
      recentProducts: [],
    };
  }

  const [relatedProducts, accessoryProducts, recentProducts] = await Promise.all([
    getSimilarProductsFromDb(slug, 8),
    getRelatedAccessoriesFromDb(slug, 8),
    getPublicProducts({ excludeSlug: slug, take: 8 }),
  ]);

  return {
    product,
    relatedProducts: relatedProducts.map(toProductCardProduct),
    accessoryProducts: accessoryProducts.map(toProductCardProduct),
    recentProducts: recentProducts.map(toProductCardProduct),
  };
}

export async function getPublicSearchData(
  query: string,
): Promise<PublicSearchData> {
  const products = query.trim() ? await searchPublicProducts(query, 72) : [];

  return { query, products };
}

function resolveFilterCategorySlugs(params: CatalogueDataParams) {
  if (params.categorySlug) return [params.categorySlug];

  return params.selectedCategorySlugs ?? [];
}
