import { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { logAdminEvent } from "@/lib/auth/admin-auth";
import { filterInputTypeLabels } from "@/lib/admin/labels";
import {
  toAdminPaginatedResult,
  type AdminPagination,
} from "@/lib/admin/pagination";
import type {
  adminFilterAttributeSchema,
  adminFilterGroupSchema,
  adminFilterOptionSchema,
} from "@/lib/validations/admin-catalogue";
import type { z } from "zod";

export type AdminFilterGroupInput = z.infer<typeof adminFilterGroupSchema>;
export type AdminFilterAttributeInput = z.infer<typeof adminFilterAttributeSchema>;
export type AdminFilterOptionInput = z.infer<typeof adminFilterOptionSchema>;
export type AdminFilterIndexFilters = {
  q?: string;
  status?: "active" | "inactive";
};

export async function getAdminFiltersIndex() {
  const db = getPrismaClient();
  const categories = await db.category.findMany({
    include: {
      _count: {
        select: {
          products: true,
          filterGroups: true,
          filterAttributes: true,
        },
      },
    },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    isActive: category.isActive,
    productCount: category._count.products,
    groupCount: category._count.filterGroups,
    attributeCount: category._count.filterAttributes,
  }));
}

export async function getAdminFiltersIndexPage(
  filters: AdminFilterIndexFilters,
  pagination: AdminPagination,
) {
  const db = getPrismaClient();
  const where = buildFilterIndexWhere(filters);
  const [total, categories] = await Promise.all([
    db.category.count({ where }),
    db.category.findMany({
      where,
      include: {
        _count: {
          select: {
            products: true,
            filterGroups: true,
            filterAttributes: true,
          },
        },
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
      isActive: category.isActive,
      productCount: category._count.products,
      groupCount: category._count.filterGroups,
      attributeCount: category._count.filterAttributes,
    })),
    total,
    page: pagination.page,
    perPage: pagination.perPage,
  });
}

export async function getAdminFiltersForCategory(categoryId: string) {
  const db = getPrismaClient();
  return db.category.findUnique({
    where: { id: categoryId },
    include: {
      filterGroups: {
        include: {
          attributes: {
            include: {
              options: {
                orderBy: [{ order: "asc" }, { label: "asc" }],
              },
              _count: { select: { productValues: true } },
            },
            orderBy: [{ order: "asc" }, { label: "asc" }],
          },
        },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      },
    },
  });
}

export async function createAdminFilterGroup(adminId: string, input: AdminFilterGroupInput) {
  const db = getPrismaClient();
  const group = await db.filterGroup.create({
    data: groupData(input),
    select: { id: true, name: true, categoryId: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_FILTER_GROUP_CREATED",
    entity: "FilterGroup",
    entityId: group.id,
    metadata: { name: group.name, categoryId: group.categoryId },
  });

  return group;
}

export async function updateAdminFilterGroup(adminId: string, input: AdminFilterGroupInput & { id: string }) {
  const db = getPrismaClient();
  const group = await db.filterGroup.update({
    where: { id: input.id },
    data: groupData(input),
    select: { id: true, name: true, categoryId: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_FILTER_GROUP_UPDATED",
    entity: "FilterGroup",
    entityId: group.id,
    metadata: { name: group.name, categoryId: group.categoryId },
  });

  return group;
}

export async function createAdminFilterAttribute(adminId: string, input: AdminFilterAttributeInput) {
  const db = getPrismaClient();
  const attribute = await db.filterAttribute.create({
    data: attributeData(input),
    select: { id: true, label: true, categoryId: true, type: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_FILTER_ATTRIBUTE_CREATED",
    entity: "FilterAttribute",
    entityId: attribute.id,
    metadata: {
      label: attribute.label,
      categoryId: attribute.categoryId,
      type: filterInputTypeLabels[attribute.type],
    },
  });

  return attribute;
}

export async function updateAdminFilterAttribute(
  adminId: string,
  input: AdminFilterAttributeInput & { id: string },
) {
  const db = getPrismaClient();
  const attribute = await db.filterAttribute.update({
    where: { id: input.id },
    data: attributeData(input),
    select: { id: true, label: true, categoryId: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_FILTER_ATTRIBUTE_UPDATED",
    entity: "FilterAttribute",
    entityId: attribute.id,
    metadata: { label: attribute.label, categoryId: attribute.categoryId },
  });

  return attribute;
}

export async function createAdminFilterOption(adminId: string, input: AdminFilterOptionInput) {
  const db = getPrismaClient();
  const option = await db.filterOption.create({
    data: optionData(input),
    select: {
      id: true,
      label: true,
      attribute: { select: { categoryId: true } },
    },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_FILTER_OPTION_CREATED",
    entity: "FilterOption",
    entityId: option.id,
    metadata: { label: option.label, categoryId: option.attribute.categoryId },
  });

  return option;
}

export async function updateAdminFilterOption(adminId: string, input: AdminFilterOptionInput & { id: string }) {
  const db = getPrismaClient();
  const option = await db.filterOption.update({
    where: { id: input.id },
    data: optionData(input),
    select: {
      id: true,
      label: true,
      attribute: { select: { categoryId: true } },
    },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_FILTER_OPTION_UPDATED",
    entity: "FilterOption",
    entityId: option.id,
    metadata: { label: option.label, categoryId: option.attribute.categoryId },
  });

  return option;
}

function groupData(input: AdminFilterGroupInput): Prisma.FilterGroupUncheckedCreateInput {
  return {
    categoryId: input.categoryId,
    name: input.name,
    slug: input.slug,
    order: input.order,
    defaultOpen: input.defaultOpen,
    isAdvanced: input.isAdvanced,
    visible: input.visible,
  };
}

function attributeData(input: AdminFilterAttributeInput): Prisma.FilterAttributeUncheckedCreateInput {
  return {
    groupId: input.groupId,
    categoryId: input.categoryId,
    label: input.label,
    slug: input.slug,
    type: input.type,
    unit: input.unit,
    filterable: input.filterable,
    searchable: input.searchable,
    visible: input.visible,
    order: input.order,
  };
}

function optionData(input: AdminFilterOptionInput): Prisma.FilterOptionUncheckedCreateInput {
  return {
    attributeId: input.attributeId,
    label: input.label,
    value: input.value,
    order: input.order,
    visible: input.visible,
  };
}

function buildFilterIndexWhere(
  filters: AdminFilterIndexFilters,
): Prisma.CategoryWhereInput {
  const where: Prisma.CategoryWhereInput = {};
  const q = filters.q?.trim();

  if (filters.status === "active") where.isActive = true;
  if (filters.status === "inactive") where.isActive = false;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}
