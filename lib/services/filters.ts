import { getPrismaClient } from "@/lib/db";
import { prismaFilterGroupsToUiGroups } from "@/lib/adapters/filter-adapter";

export async function getPublicFiltersForCategories(categorySlugs: string[]) {
  const db = getPrismaClient();

  if (categorySlugs.length === 0) {
    return prismaFilterGroupsToUiGroups([], { includeGlobal: true });
  }

  const groups = await db.filterGroup.findMany({
    where: {
      visible: true,
      category: { slug: { in: categorySlugs } },
    },
    include: {
      category: { select: { slug: true } },
      attributes: {
        where: { visible: true, filterable: true },
        include: {
          options: {
            where: { visible: true },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return prismaFilterGroupsToUiGroups(groups, { includeGlobal: true });
}

export async function getPublicFiltersForCategory(categorySlug?: string) {
  return getPublicFiltersForCategories(categorySlug ? [categorySlug] : []);
}
