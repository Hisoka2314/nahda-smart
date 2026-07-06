import { getPrismaClient } from "@/lib/db";
import {
  prismaCategoryToCatalogCategory,
  prismaCategoryToProductCategory,
} from "@/lib/adapters/category-adapter";

export async function getPublicCategories() {
  const db = getPrismaClient();
  const categories = await db.category.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          products: {
            where: {
              status: { in: ["PUBLISHED", "ON_ORDER", "OUT_OF_STOCK"] },
            },
          },
        },
      },
    },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return categories.map(prismaCategoryToCatalogCategory);
}

export async function getPublicHomeCategories() {
  const db = getPrismaClient();
  const categories = await db.category.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          products: {
            where: {
              status: { in: ["PUBLISHED", "ON_ORDER", "OUT_OF_STOCK"] },
            },
          },
        },
      },
    },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    take: 12,
  });

  return categories.map(prismaCategoryToProductCategory);
}

export async function getPublicCategoryBySlug(slug: string) {
  const db = getPrismaClient();
  const category = await db.category.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          products: {
            where: {
              status: { in: ["PUBLISHED", "ON_ORDER", "OUT_OF_STOCK"] },
            },
          },
        },
      },
    },
  });

  return category ? prismaCategoryToCatalogCategory(category) : null;
}
