import {
  FilterInputType,
  Prisma,
  ProductCondition,
  ProductStatus,
} from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { logAdminEvent } from "@/lib/auth/admin-auth";
import {
  formatDateTime,
  formatMoney,
  productConditionLabels,
  productStatusLabels,
} from "@/lib/admin/labels";
import {
  removeLocalPublicUpload,
  saveAdminImageUpload,
} from "@/lib/services/admin-upload";
import {
  toAdminPaginatedResult,
  type AdminPagination,
} from "@/lib/admin/pagination";
import type { AdminProductInput } from "@/lib/validations/admin-catalogue";

export type AdminProductFilters = {
  q?: string;
  categoryId?: string;
  brandId?: string;
  status?: ProductStatus;
  condition?: ProductCondition;
  stock?: "in" | "low" | "out";
  promo?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  isRecommended?: boolean;
  sort?: "updated" | "name" | "price" | "stock";
};

const productListInclude = {
  brand: true,
  category: true,
  images: { orderBy: { order: "asc" }, take: 1 },
  stocks: true,
} satisfies Prisma.ProductInclude;

const productDetailInclude = {
  brand: true,
  category: true,
  images: { orderBy: { order: "asc" } },
  stocks: {
    include: { depot: true },
    orderBy: { depot: { name: "asc" } },
  },
  stockMovements: {
    include: {
      depot: true,
      createdBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  },
  attributeValues: {
    include: {
      attribute: { include: { group: true } },
      option: true,
    },
  },
} satisfies Prisma.ProductInclude;

type ProductListPayload = Prisma.ProductGetPayload<{ include: typeof productListInclude }>;
type ProductDetailPayload = Prisma.ProductGetPayload<{ include: typeof productDetailInclude }>;

export async function getAdminProducts(filters: AdminProductFilters = {}) {
  const db = getPrismaClient();
  const products = await db.product.findMany({
    where: buildProductWhere(filters),
    include: productListInclude,
    orderBy: [{ updatedAt: "desc" }],
    take: 80,
  });

  return products.map(toAdminProductListItem);
}

export async function getAdminProductsPage(
  filters: AdminProductFilters = {},
  pagination: AdminPagination,
) {
  const db = getPrismaClient();
  const where = buildProductWhere(filters);
  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      include: productListInclude,
      orderBy: productOrderBy(filters.sort),
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  return toAdminPaginatedResult({
    items: products.map(toAdminProductListItem),
    total,
    page: pagination.page,
    perPage: pagination.perPage,
  });
}

export async function getAdminProductById(id: string) {
  const db = getPrismaClient();
  const product = await db.product.findUnique({
    where: { id },
    include: productDetailInclude,
  });

  return product ? toAdminProductDetail(product) : null;
}

export async function getAdminProductFormOptions(categoryId?: string) {
  const db = getPrismaClient();
  const [brands, categories, depots, attributes] = await Promise.all([
    db.brand.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    db.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    }),
    db.depot.findMany({
      where: { isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
    categoryId
      ? db.filterAttribute.findMany({
          where: { categoryId, visible: true },
          include: {
            group: true,
            options: {
              where: { visible: true },
              orderBy: [{ order: "asc" }, { label: "asc" }],
            },
          },
          orderBy: [{ group: { order: "asc" } }, { order: "asc" }, { label: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  return { brands, categories, depots, attributes };
}

export async function createAdminProduct(adminId: string, input: AdminProductInput) {
  const db = getPrismaClient();
  const product = await db.product.create({
    data: productData(input),
    select: { id: true, name: true, sku: true, slug: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_PRODUCT_CREATED",
    entity: "Product",
    entityId: product.id,
    metadata: { name: product.name, sku: product.sku, slug: product.slug },
  });

  return product;
}

export async function updateAdminProduct(adminId: string, input: AdminProductInput & { id: string }) {
  const db = getPrismaClient();
  const product = await db.product.update({
    where: { id: input.id },
    data: productData(input),
    select: { id: true, name: true, sku: true, slug: true, status: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_PRODUCT_UPDATED",
    entity: "Product",
    entityId: product.id,
    metadata: { name: product.name, sku: product.sku, status: product.status },
  });

  return product;
}

export async function archiveAdminProduct(adminId: string, productId: string) {
  const db = getPrismaClient();
  const product = await db.product.update({
    where: { id: productId },
    data: { status: "ARCHIVED" },
    select: { id: true, name: true, sku: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_PRODUCT_ARCHIVED",
    entity: "Product",
    entityId: product.id,
    metadata: { name: product.name, sku: product.sku },
  });

  return product;
}

export async function addAdminProductImage({
  adminId,
  productId,
  file,
  alt,
  order,
}: {
  adminId: string;
  productId: string;
  file: File;
  alt?: string;
  order: number;
}) {
  const url = await saveAdminImageUpload(file, "products");
  const db = getPrismaClient();
  const image = await db.productImage.create({
    data: { productId, url, alt, order },
    select: { id: true, url: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_PRODUCT_IMAGE_ADDED",
    entity: "Product",
    entityId: productId,
    metadata: { imageId: image.id },
  });

  return image;
}

export async function updateAdminProductImage({
  adminId,
  imageId,
  alt,
  order,
}: {
  adminId: string;
  imageId: string;
  alt?: string;
  order: number;
}) {
  const db = getPrismaClient();
  const image = await db.productImage.update({
    where: { id: imageId },
    data: { alt, order },
    select: { id: true, productId: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_PRODUCT_IMAGE_UPDATED",
    entity: "ProductImage",
    entityId: image.id,
    metadata: { productId: image.productId },
  });

  return image;
}

export async function deleteAdminProductImage(adminId: string, imageId: string) {
  const db = getPrismaClient();
  const image = await db.productImage.delete({
    where: { id: imageId },
    select: { id: true, productId: true, url: true },
  });

  await removeLocalPublicUpload(image.url);
  await logAdminEvent({
    adminId,
    action: "ADMIN_PRODUCT_IMAGE_REMOVED",
    entity: "ProductImage",
    entityId: image.id,
    metadata: { productId: image.productId },
  });

  return image;
}

export async function updateAdminProductAttribute({
  adminId,
  productId,
  attributeId,
  optionId,
  valueString,
  valueNumber,
  valueBoolean,
}: {
  adminId: string;
  productId: string;
  attributeId: string;
  optionId?: string;
  valueString?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
}) {
  const db = getPrismaClient();
  const attribute = await db.filterAttribute.findUnique({
    where: { id: attributeId },
    select: { id: true, slug: true, type: true },
  });

  if (!attribute) throw new Error("Attribut introuvable.");

  const hasValue =
    Boolean(optionId) ||
    Boolean(valueString) ||
    valueNumber !== undefined ||
    valueBoolean !== undefined;

  await db.$transaction(async (tx) => {
    await tx.productAttributeValue.deleteMany({
      where: { productId, attributeId },
    });

    if (!hasValue) return;

    await tx.productAttributeValue.create({
      data: {
        productId,
        attributeId,
        optionId,
        valueString:
          optionId || attribute.type === FilterInputType.BOOLEAN
            ? undefined
            : valueString,
        valueNumber,
        valueBoolean,
      },
    });
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_PRODUCT_ATTRIBUTE_UPDATED",
    entity: "Product",
    entityId: productId,
    metadata: { attributeId, slug: attribute.slug },
  });
}

function productData(input: AdminProductInput): Prisma.ProductUncheckedCreateInput {
  const margin = input.priceSell - input.priceBuy;

  return {
    name: input.name,
    slug: input.slug,
    sku: input.sku,
    barcode: input.barcode,
    brandId: input.brandId,
    categoryId: input.categoryId,
    shortDescription: cleanOptional(input.shortDescription),
    description: input.description,
    technicalDescription: cleanOptional(input.technicalDescription),
    priceBuy: input.priceBuy,
    priceSell: input.priceSell,
    promoPrice: input.promoPrice,
    margin,
    warrantyMonths: input.warrantyMonths,
    condition: input.condition,
    status: input.status,
    isPromo: input.isPromo,
    isNew: input.isNew,
    isRecommended: input.isRecommended,
    isBestSeller: input.isBestSeller,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
  };
}

function buildProductWhere(filters: AdminProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.brandId) where.brandId = filters.brandId;
  if (filters.status) where.status = filters.status;
  if (filters.condition) where.condition = filters.condition;
  if (filters.promo) where.isPromo = true;
  if (filters.isNew) where.isNew = true;
  if (filters.isBestSeller) where.isBestSeller = true;
  if (filters.isRecommended) where.isRecommended = true;

  if (filters.stock === "in") {
    where.stocks = { some: { quantity: { gt: 0 } } };
  }
  if (filters.stock === "low") {
    where.stocks = { some: { quantity: { lte: 3 } } };
  }
  if (filters.stock === "out") {
    // "every" est vrai sur une relation vide : un produit sans ligne de stock
    // compte donc comme en rupture, ce qui est le cas.
    where.stocks = { every: { quantity: { lte: 0 } } };
  }

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { brand: { name: { contains: q, mode: "insensitive" } } },
      { category: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}

function productOrderBy(sort?: AdminProductFilters["sort"]): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === "name") return [{ name: "asc" }];
  if (sort === "price") return [{ priceSell: "desc" }, { updatedAt: "desc" }];
  if (sort === "stock") return [{ stocks: { _count: "desc" } }, { updatedAt: "desc" }];
  return [{ updatedAt: "desc" }];
}

function toAdminProductListItem(product: ProductListPayload) {
  const stockTotal = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    image: product.images[0]?.url,
    brandName: product.brand.name,
    categoryName: product.category.name,
    priceSell: Number(product.priceSell),
    priceSellLabel: formatMoney(Number(product.priceSell)),
    averageCost: Number(product.averageCost ?? product.priceBuy),
    averageCostLabel: formatMoney(
      Number(product.averageCost ?? product.priceBuy),
    ),
    hasCalculatedAverageCost: product.averageCost !== null,
    promoPrice: product.promoPrice ? Number(product.promoPrice) : undefined,
    promoPriceLabel: product.promoPrice
      ? formatMoney(Number(product.promoPrice))
      : undefined,
    stockTotal,
    status: product.status,
    statusLabel: productStatusLabels[product.status],
    condition: product.condition,
    conditionLabel: productConditionLabels[product.condition],
    isPromo: product.isPromo,
    isNew: product.isNew,
    isBestSeller: product.isBestSeller,
    isRecommended: product.isRecommended,
    createdAt: formatDateTime(product.createdAt),
    updatedAt: formatDateTime(product.updatedAt),
  };
}

function toAdminProductDetail(product: ProductDetailPayload) {
  const stockTotal = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0);

  return {
    ...toAdminProductListItem(product),
    barcode: product.barcode ?? "",
    brandId: product.brandId,
    categoryId: product.categoryId,
    shortDescription: product.shortDescription ?? "",
    description: product.description,
    technicalDescription: product.technicalDescription ?? "",
    priceBuy: Number(product.priceBuy),
    priceBuyLabel: formatMoney(Number(product.priceBuy)),
    margin: Number(product.margin ?? 0),
    marginLabel: formatMoney(Number(product.margin ?? 0)),
    warrantyMonths: product.warrantyMonths,
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    stockTotal,
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt ?? "",
      order: image.order,
    })),
    stocks: product.stocks.map((stock) => ({
      id: stock.id,
      depotId: stock.depotId,
      depotName: stock.depot.name,
      depotType: stock.depot.type,
      quantity: stock.quantity,
      lowStockThreshold: stock.lowStockThreshold,
    })),
    movements: product.stockMovements.map((movement) => ({
      id: movement.id,
      depotName: movement.depot.name,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason ?? "",
      reference: movement.reference ?? "",
      createdBy: movement.createdBy?.name,
      createdAt: formatDateTime(movement.createdAt),
    })),
    attributes: product.attributeValues.map((value) => ({
      id: value.id,
      attributeId: value.attributeId,
      attributeLabel: value.attribute.label,
      attributeSlug: value.attribute.slug,
      groupName: value.attribute.group.name,
      optionId: value.optionId ?? "",
      optionLabel: value.option?.label,
      valueString: value.valueString ?? "",
      valueNumber: value.valueNumber ? Number(value.valueNumber) : undefined,
      valueBoolean: value.valueBoolean ?? undefined,
    })),
  };
}

function cleanOptional(value?: string | null) {
  const text = value?.trim();
  return text ? text : undefined;
}
