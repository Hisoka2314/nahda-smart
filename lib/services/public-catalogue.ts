import {
  catalogueCategories,
  catalogueProducts,
  getCategoryBySlug as getMockCategoryBySlug,
  getProductBySlug as getMockProductBySlug,
} from "@/data/catalogue";
import {
  categories as mockHomeCategories,
  featuredProducts,
} from "@/data/products";
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
import {
  getAccessoryProducts,
  getRecentlyViewedProducts,
  getSimilarProducts,
} from "@/lib/product";
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

export async function getPublicCatalogueData(
  params: CatalogueDataParams = {},
): Promise<PublicCatalogueData> {
  try {
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
      source: "prisma",
      products,
      categories,
      filterGroups,
    };
  } catch (error) {
    logFallback("catalogue", error);

    return {
      source: "mock",
      products: getMockCatalogueProducts(params),
      categories: catalogueCategories,
      filterGroups: getCatalogueFilterGroups({
        categorySlug: params.categorySlug,
        selectedCategorySlugs: params.selectedCategorySlugs ?? [],
        includeCategoryFilter: !params.categorySlug,
      }),
    };
  }
}

export async function getPublicCategoryData(slug: string) {
  try {
    return {
      source: "prisma" as const,
      category: await getPublicCategoryBySlug(slug),
    };
  } catch (error) {
    logFallback("category", error);

    return {
      source: "mock" as const,
      category: getMockCategoryBySlug(slug) ?? null,
    };
  }
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
  try {
    const [categories, bestSellers, recommendedProducts, promoProducts, brands] =
      await Promise.all([
        getPublicHomeCategories(),
        getBestSellingProducts(12),
        getRecommendedProducts(12),
        getPromoProducts(12),
        getPublicBrandMarks(),
      ]);

    return {
      source: "prisma",
      categories,
      featuredProducts: bestSellers.map(toProductCardProduct),
      recommendedProducts: recommendedProducts.map(toProductCardProduct),
      promoProducts: promoProducts.map(toProductCardProduct),
      brands,
    };
  } catch (error) {
    logFallback("home", error);

    return {
      source: "mock",
      categories: mockHomeCategories,
      featuredProducts,
      recommendedProducts: featuredProducts,
      promoProducts: featuredProducts.filter((product) => product.isPromo),
      brands: staticBrandMarks,
    };
  }
}

export async function getPublicProductPageData(
  slug: string,
): Promise<PublicProductPageData> {
  try {
    const product = await getPublicProductBySlug(slug);

    if (!product) {
      const mockProduct = getMockProductBySlug(slug) ?? null;

      return {
        source: mockProduct ? "mock" : "prisma",
        product: mockProduct,
        relatedProducts: mockProduct
          ? getSimilarProducts(mockProduct).map(toProductCardProduct)
          : [],
        accessoryProducts: mockProduct
          ? getAccessoryProducts(mockProduct).map(toProductCardProduct)
          : [],
        recentProducts: mockProduct
          ? getRecentlyViewedProducts(mockProduct).map(toProductCardProduct)
          : [],
      };
    }

    const [relatedProducts, accessoryProducts, recentProducts] =
      await Promise.all([
        getSimilarProductsFromDb(slug, 8),
        getRelatedAccessoriesFromDb(slug, 8),
        getPublicProducts({ excludeSlug: slug, take: 8 }),
      ]);

    return {
      source: "prisma",
      product,
      relatedProducts: relatedProducts.map(toProductCardProduct),
      accessoryProducts: accessoryProducts.map(toProductCardProduct),
      recentProducts: recentProducts.map(toProductCardProduct),
    };
  } catch (error) {
    logFallback("product", error);

    const product = getMockProductBySlug(slug) ?? null;

    return {
      source: "mock",
      product,
      relatedProducts: product
        ? getSimilarProducts(product).map(toProductCardProduct)
        : [],
      accessoryProducts: product
        ? getAccessoryProducts(product).map(toProductCardProduct)
        : [],
      recentProducts: product
        ? getRecentlyViewedProducts(product).map(toProductCardProduct)
        : [],
    };
  }
}

export async function getPublicSearchData(
  query: string,
): Promise<PublicSearchData> {
  try {
    const products = query.trim()
      ? await searchPublicProducts(query, 72)
      : [];

    return {
      source: "prisma",
      query,
      products,
    };
  } catch (error) {
    logFallback("search", error);

    return {
      source: "mock",
      query,
      products: searchMockProducts(query),
    };
  }
}

function resolveFilterCategorySlugs(params: CatalogueDataParams) {
  if (params.categorySlug) return [params.categorySlug];

  return params.selectedCategorySlugs ?? [];
}

function getMockCatalogueProducts(params: CatalogueDataParams) {
  const query = normalizeSearchQuery(params.query);

  return catalogueProducts.filter((product) => {
    if (params.categorySlug && product.categorySlug !== params.categorySlug) {
      return false;
    }

    if (!query) return true;

    return productMatchesSearch(product, query);
  });
}

function searchMockProducts(query: string) {
  const normalized = normalizeSearchQuery(query);

  if (!normalized) return [];

  return catalogueProducts.filter((product) =>
    productMatchesSearch(product, normalized),
  );
}

function productMatchesSearch(
  product: (typeof catalogueProducts)[number],
  query: string,
) {
  const haystack = [
    product.name,
    product.brandSlug,
    product.categorySlug,
    product.specs.join(" "),
    Object.values(product.attributes).flat().join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function normalizeSearchQuery(query?: string) {
  return query?.trim().toLowerCase() ?? "";
}

function logFallback(scope: string, error: unknown) {
  if (process.env.NODE_ENV === "production") return;

  const message = error instanceof Error ? "DB indisponible" : "Erreur inconnue";
  console.warn(`[Nahda Smart] Fallback mock ${scope}: ${message}`);
}
