import { Prisma, ProductStatus } from "@prisma/client";
import {
  prismaProductToCatalogProduct,
  publicProductInclude,
} from "@/lib/adapters/product-adapter";
import { getPrismaClient } from "@/lib/db";

export type GetProductsParams = {
  categorySlug?: string;
  brandSlug?: string;
  status?: ProductStatus;
  search?: string;
  take?: number;
  skip?: number;
};

export async function getProducts(params: GetProductsParams = {}) {
  const db = getPrismaClient();
  const where: Prisma.ProductWhereInput = {
    status: params.status ?? ProductStatus.PUBLISHED,
  };

  if (params.categorySlug) {
    where.category = { slug: params.categorySlug };
  }

  if (params.brandSlug) {
    where.brand = { slug: params.brandSlug };
  }

  if (params.search?.trim()) {
    where.OR = [
      { name: { contains: params.search.trim(), mode: "insensitive" } },
      { sku: { contains: params.search.trim(), mode: "insensitive" } },
      { shortDescription: { contains: params.search.trim(), mode: "insensitive" } },
    ];
  }

  return db.product.findMany({
    where,
    include: {
      brand: true,
      category: true,
      images: { orderBy: { order: "asc" } },
      stocks: { include: { depot: true } },
    },
    orderBy: [{ isBestSeller: "desc" }, { createdAt: "desc" }],
    take: params.take ?? 24,
    skip: params.skip ?? 0,
  });
}

export async function getProductBySlug(slug: string) {
  const db = getPrismaClient();

  return db.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      category: true,
      images: { orderBy: { order: "asc" } },
      attributeValues: {
        include: {
          attribute: true,
          option: true,
        },
      },
      stocks: { include: { depot: true } },
    },
  });
}

export async function getCategories() {
  const db = getPrismaClient();

  return db.category.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
}

export type GetPublicProductsParams = {
  categorySlug?: string;
  categorySlugs?: string[];
  brandSlug?: string;
  search?: string;
  take?: number;
  skip?: number;
  onlyBestSellers?: boolean;
  onlyRecommended?: boolean;
  onlyPromos?: boolean;
  excludeSlug?: string;
};

export async function getPublicProducts(params: GetPublicProductsParams = {}) {
  const db = getPrismaClient();
  const where = buildPublicProductWhere(params);

  const products = await db.product.findMany({
    where,
    include: publicProductInclude,
    orderBy: [
      { isBestSeller: "desc" },
      { isRecommended: "desc" },
      { isPromo: "desc" },
      { createdAt: "desc" },
    ],
    take: params.take ?? 60,
    skip: params.skip ?? 0,
  });

  // Lambda explicite : passee en reference, Array.map fournirait l'index en
  // second argument, donc un options invalide.
  return products.map((product) => prismaProductToCatalogProduct(product));
}

export async function getPublicProductBySlug(slug: string) {
  const db = getPrismaClient();
  const product = await db.product.findUnique({
    where: { slug },
    include: publicProductInclude,
  });

  if (!product || product.status === ProductStatus.DRAFT || product.status === ProductStatus.ARCHIVED) {
    return null;
  }

  return prismaProductToCatalogProduct(product, { includeDetails: true });
}

export async function getBestSellingProducts(take = 10) {
  return getPublicProducts({ onlyBestSellers: true, take });
}

export async function getRecommendedProducts(take = 10) {
  return getPublicProducts({ onlyRecommended: true, take });
}

export async function getPromoProducts(take = 10) {
  return getPublicProducts({ onlyPromos: true, take });
}

export async function searchPublicProducts(query: string, take = 48) {
  return getPublicProducts({ search: query, take });
}

export async function getSimilarProductsFromDb(productSlug: string, take = 8) {
  const product = await getPublicProductBySlug(productSlug);

  if (!product) return [];

  return getPublicProducts({
    categorySlug: product.categorySlug,
    excludeSlug: product.slug,
    take,
  });
}

export async function getRelatedAccessoriesFromDb(productSlug: string, take = 8) {
  const accessoryCategorySlugs = [
    "accessoires",
    "peripheriques",
    "stockage",
    "baies-reseau-cablage",
    "multimedia",
    "onduleurs-energie",
  ];

  return getPublicProducts({
    categorySlugs: accessoryCategorySlugs,
    excludeSlug: productSlug,
    take,
  });
}

function buildPublicProductWhere(params: GetPublicProductsParams) {
  const where: Prisma.ProductWhereInput = {
    status: {
      in: [
        ProductStatus.PUBLISHED,
        ProductStatus.ON_ORDER,
        ProductStatus.OUT_OF_STOCK,
      ],
    },
  };

  if (params.categorySlug) {
    where.category = { slug: params.categorySlug };
  }

  if (params.categorySlugs?.length) {
    where.category = { slug: { in: params.categorySlugs } };
  }

  if (params.brandSlug) {
    where.brand = { slug: params.brandSlug };
  }

  if (params.excludeSlug) {
    where.slug = { not: params.excludeSlug };
  }

  if (params.onlyBestSellers) {
    where.isBestSeller = true;
  }

  if (params.onlyRecommended) {
    where.isRecommended = true;
  }

  if (params.onlyPromos) {
    where.OR = [{ isPromo: true }, { promoPrice: { not: null } }];
  }

  if (params.search?.trim()) {
    const query = params.search.trim();
    const searchConditions: Prisma.ProductWhereInput[] = [
      { name: { contains: query, mode: "insensitive" } },
      { sku: { contains: query, mode: "insensitive" } },
      { shortDescription: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { brand: { name: { contains: query, mode: "insensitive" } } },
      { category: { name: { contains: query, mode: "insensitive" } } },
      {
        attributeValues: {
          some: {
            OR: [
              { valueString: { contains: query, mode: "insensitive" } },
              { option: { label: { contains: query, mode: "insensitive" } } },
              { option: { value: { contains: query, mode: "insensitive" } } },
            ],
          },
        },
      },
    ];

    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      { OR: searchConditions },
    ];
  }

  return where;
}
