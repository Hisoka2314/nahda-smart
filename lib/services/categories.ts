import type { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import {
  prismaCategoryToCatalogCategory,
  prismaCategoryToProductCategory,
} from "@/lib/adapters/category-adapter";

// Une categorie vide n'a rien a faire devant un client : la vitrine annoncait
// "PC Bureau - 0 produits" et "All-in-One - 0 produits" sur sa page d'accueil,
// et les filtres du catalogue menaient a des pages sans resultat. Elles
// restent actives en base, donc pretes a reapparaitre des qu'un produit y
// entre, mais ne sont plus proposees tant qu'elles sont vides.
const CATEGORIE_NON_VIDE: Prisma.CategoryWhereInput = {
  isActive: true,
  products: {
    some: { status: { in: ["PUBLISHED", "ON_ORDER", "OUT_OF_STOCK"] } },
  },
};

export async function getPublicCategories() {
  const db = getPrismaClient();
  const categories = await db.category.findMany({
    where: CATEGORIE_NON_VIDE,
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
    where: CATEGORIE_NON_VIDE,
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
