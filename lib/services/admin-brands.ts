import { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { logAdminEvent } from "@/lib/auth/admin-auth";
import { formatDateTime } from "@/lib/admin/labels";
import {
  toAdminPaginatedResult,
  type AdminPagination,
} from "@/lib/admin/pagination";
import { removeLocalPublicUpload } from "@/lib/services/admin-upload";
import type { adminBrandSchema } from "@/lib/validations/admin-catalogue";
import type { z } from "zod";

export type AdminBrandInput = z.infer<typeof adminBrandSchema>;
export type AdminBrandFilters = {
  q?: string;
  status?: "active" | "inactive";
  logo?: "with" | "without";
};

export async function getAdminBrands() {
  const db = getPrismaClient();
  const brands = await db.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logoPath: brand.logoPath,
    isActive: brand.isActive,
    isOfficialAsset: brand.isOfficialAsset,
    productCount: brand._count.products,
    createdAt: formatDateTime(brand.createdAt),
    updatedAt: formatDateTime(brand.updatedAt),
  }));
}

export async function getAdminBrandsPage(
  filters: AdminBrandFilters,
  pagination: AdminPagination,
) {
  const db = getPrismaClient();
  const where = buildBrandWhere(filters);
  const [total, brands] = await Promise.all([
    db.brand.count({ where }),
    db.brand.findMany({
      where,
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  return toAdminPaginatedResult({
    items: brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logoPath: brand.logoPath,
      isActive: brand.isActive,
      isOfficialAsset: brand.isOfficialAsset,
      productCount: brand._count.products,
      createdAt: formatDateTime(brand.createdAt),
      updatedAt: formatDateTime(brand.updatedAt),
    })),
    total,
    page: pagination.page,
    perPage: pagination.perPage,
  });
}

export async function getAdminBrandOptions() {
  const db = getPrismaClient();
  return db.brand.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}

export async function getAdminBrandById(id: string) {
  const db = getPrismaClient();
  return db.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
}

export async function createAdminBrand(adminId: string, input: AdminBrandInput) {
  const db = getPrismaClient();
  const brand = await db.brand.create({
    data: brandData(input),
    select: { id: true, name: true, slug: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_BRAND_CREATED",
    entity: "Brand",
    entityId: brand.id,
    metadata: { name: brand.name, slug: brand.slug },
  });

  return brand;
}

export async function updateAdminBrand(adminId: string, input: AdminBrandInput & { id: string }) {
  const db = getPrismaClient();
  const brand = await db.brand.update({
    where: { id: input.id },
    data: brandData(input),
    select: { id: true, name: true, slug: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_BRAND_UPDATED",
    entity: "Brand",
    entityId: brand.id,
    metadata: { name: brand.name, slug: brand.slug },
  });

  return brand;
}

export async function updateAdminBrandLogo({
  adminId,
  brandId,
  logoPath,
  isOfficialAsset,
}: {
  adminId: string;
  brandId: string;
  logoPath: string | null;
  isOfficialAsset?: boolean;
}) {
  const db = getPrismaClient();
  const previous = await db.brand.findUnique({
    where: { id: brandId },
    select: { logoPath: true },
  });
  const brand = await db.brand.update({
    where: { id: brandId },
    data: {
      logoPath,
      ...(isOfficialAsset !== undefined ? { isOfficialAsset } : {}),
    },
    select: { id: true, name: true, slug: true },
  });

  if (previous?.logoPath && previous.logoPath !== logoPath) {
    await removeLocalPublicUpload(previous.logoPath);
  }

  await logAdminEvent({
    adminId,
    action: logoPath ? "ADMIN_BRAND_LOGO_UPDATED" : "ADMIN_BRAND_LOGO_REMOVED",
    entity: "Brand",
    entityId: brand.id,
    metadata: { name: brand.name, slug: brand.slug },
  });

  return brand;
}

function brandData(input: AdminBrandInput): Prisma.BrandUncheckedCreateInput {
  return {
    name: input.name,
    slug: input.slug,
    logoPath: input.logoPath,
    isActive: input.isActive,
    isOfficialAsset: input.isOfficialAsset,
  };
}

function buildBrandWhere(filters: AdminBrandFilters): Prisma.BrandWhereInput {
  const where: Prisma.BrandWhereInput = {};
  const q = filters.q?.trim();

  if (filters.status === "active") where.isActive = true;
  if (filters.status === "inactive") where.isActive = false;
  if (filters.logo === "with") where.logoPath = { not: null };
  if (filters.logo === "without") where.logoPath = null;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}
