import { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { logAdminEvent } from "@/lib/auth/admin-auth";
import { formatDateTime } from "@/lib/admin/labels";
import {
  toAdminPaginatedResult,
  type AdminPagination,
} from "@/lib/admin/pagination";
import type { adminCategorySchema } from "@/lib/validations/admin-catalogue";
import type { z } from "zod";

export type AdminCategoryInput = z.infer<typeof adminCategorySchema>;

export type AdminCategoryFilters = {
  q?: string;
  status?: "active" | "inactive";
};

export async function getAdminCategories() {
  const db = getPrismaClient();
  const categories = await db.category.findMany({
    include: {
      parent: { select: { name: true } },
      _count: { select: { products: true, filterGroups: true } },
    },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentName: category.parent?.name,
    order: category.order,
    isActive: category.isActive,
    productCount: category._count.products,
    filterGroupCount: category._count.filterGroups,
    createdAt: formatDateTime(category.createdAt),
    updatedAt: formatDateTime(category.updatedAt),
  }));
}

export async function getAdminCategoriesPage(
  filters: AdminCategoryFilters,
  pagination: AdminPagination,
) {
  const db = getPrismaClient();
  const where = buildCategoryWhere(filters);
  const [total, categories] = await Promise.all([
    db.category.count({ where }),
    db.category.findMany({
      where,
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true, filterGroups: true } },
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  return toAdminPaginatedResult({
    items: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentName: category.parent?.name,
      order: category.order,
      isActive: category.isActive,
      productCount: category._count.products,
      filterGroupCount: category._count.filterGroups,
      createdAt: formatDateTime(category.createdAt),
      updatedAt: formatDateTime(category.updatedAt),
    })),
    total,
    page: pagination.page,
    perPage: pagination.perPage,
  });
}

export async function getAdminCategoryOptions(excludeId?: string) {
  const db = getPrismaClient();
  return db.category.findMany({
    where: excludeId ? { id: { not: excludeId } } : undefined,
    select: { id: true, name: true, slug: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
}

export async function getAdminCategoryById(id: string) {
  const db = getPrismaClient();
  return db.category.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { products: true, filterGroups: true } },
    },
  });
}

export async function createAdminCategory(adminId: string, input: AdminCategoryInput) {
  const db = getPrismaClient();
  const category = await db.category.create({
    data: categoryData(input),
    select: { id: true, name: true, slug: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_CATEGORY_CREATED",
    entity: "Category",
    entityId: category.id,
    metadata: { name: category.name, slug: category.slug },
  });

  return category;
}

export async function updateAdminCategory(adminId: string, input: AdminCategoryInput & { id: string }) {
  const db = getPrismaClient();
  const category = await db.category.update({
    where: { id: input.id },
    data: categoryData(input),
    select: { id: true, name: true, slug: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_CATEGORY_UPDATED",
    entity: "Category",
    entityId: category.id,
    metadata: { name: category.name, slug: category.slug },
  });

  return category;
}

function categoryData(input: AdminCategoryInput): Prisma.CategoryUncheckedCreateInput {
  return {
    name: input.name,
    slug: input.slug,
    parentId: input.parentId,
    icon: input.icon,
    bannerUrl: input.bannerUrl,
    description: input.description || null,
    order: input.order,
    isActive: input.isActive,
  };
}

function buildCategoryWhere(filters: AdminCategoryFilters): Prisma.CategoryWhereInput {
  const where: Prisma.CategoryWhereInput = {};
  const q = filters.q?.trim();

  if (filters.status === "active") where.isActive = true;
  if (filters.status === "inactive") where.isActive = false;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { parent: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}
