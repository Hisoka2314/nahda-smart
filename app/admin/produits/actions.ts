"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth/admin-auth";
import { safeAdminReturnPath } from "@/lib/validations/admin";
import {
  adminProductAttributeSchema,
  adminProductImageSchema,
  adminProductImageUpdateSchema,
  adminProductSchema,
} from "@/lib/validations/admin-catalogue";
import {
  addAdminProductImage,
  archiveAdminProduct,
  createAdminProduct,
  deleteAdminProductImage,
  updateAdminProduct,
  updateAdminProductAttribute,
  updateAdminProductImage,
} from "@/lib/services/admin-products";

const productManagerRoles = ["MANAGER"] as const;
const technicalWriterRoles = ["MANAGER", "STOCK_MANAGER"] as const;

export async function createProductAction(formData: FormData) {
  const admin = await requireRole([...productManagerRoles]);
  const parsed = adminProductSchema.safeParse(productPayload(formData));

  if (!parsed.success) redirect("/admin/produits/nouveau?error=validation");

  try {
    const product = await createAdminProduct(admin.id, parsed.data);
    revalidateCatalogue(product.slug);
    redirect(`/admin/produits/${product.id}?success=created`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`/admin/produits/nouveau?error=${errorCode(error)}`);
  }
}

export async function updateProductAction(formData: FormData) {
  const admin = await requireRole([...productManagerRoles]);
  const id = String(formData.get("id") ?? "");
  const returnTo = safeAdminReturnPath(String(formData.get("returnTo") ?? ""), `/admin/produits/${id}`);
  const parsed = adminProductSchema.safeParse({ ...productPayload(formData), id });

  if (!id || !parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    const product = await updateAdminProduct(admin.id, { ...parsed.data, id });
    revalidateCatalogue(product.slug);
    redirect(`${returnTo}?success=updated`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=${errorCode(error)}`);
  }
}

export async function archiveProductAction(formData: FormData) {
  const admin = await requireRole([...productManagerRoles]);
  const productId = String(formData.get("productId") ?? "");
  const returnTo = safeAdminReturnPath(String(formData.get("returnTo") ?? ""), "/admin/produits");

  if (!productId) redirect(`${returnTo}?error=validation`);

  try {
    await archiveAdminProduct(admin.id, productId);
    revalidateCatalogue();
    redirect(`${returnTo}?success=archived`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=archive`);
  }
}

export async function addProductImageAction(formData: FormData) {
  const admin = await requireRole([...productManagerRoles]);
  const parsed = adminProductImageSchema.safeParse({
    productId: formData.get("productId"),
    alt: formData.get("alt"),
    order: formData.get("order"),
  });
  const file = formData.get("image");
  const returnTo = safeAdminReturnPath(
    String(formData.get("returnTo") ?? ""),
    parsed.success ? `/admin/produits/${parsed.data.productId}` : "/admin/produits",
  );

  if (!parsed.success || !(file instanceof File)) {
    redirect(`${returnTo}?error=validation`);
  }

  try {
    await addAdminProductImage({
      adminId: admin.id,
      productId: parsed.data.productId,
      file,
      alt: parsed.data.alt,
      order: parsed.data.order,
    });
    revalidateCatalogue();
    redirect(`${returnTo}?success=image`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=image`);
  }
}

export async function updateProductImageAction(formData: FormData) {
  const admin = await requireRole([...productManagerRoles]);
  const parsed = adminProductImageUpdateSchema.safeParse({
    imageId: formData.get("imageId"),
    productId: formData.get("productId"),
    alt: formData.get("alt"),
    order: formData.get("order"),
  });
  const returnTo = safeAdminReturnPath(
    String(formData.get("returnTo") ?? ""),
    parsed.success ? `/admin/produits/${parsed.data.productId}` : "/admin/produits",
  );

  if (!parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    await updateAdminProductImage({
      adminId: admin.id,
      imageId: parsed.data.imageId,
      alt: parsed.data.alt,
      order: parsed.data.order,
    });
    revalidateCatalogue();
    redirect(`${returnTo}?success=image-updated`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=image-update`);
  }
}

export async function deleteProductImageAction(formData: FormData) {
  const admin = await requireRole([...productManagerRoles]);
  const imageId = String(formData.get("imageId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const returnTo = safeAdminReturnPath(String(formData.get("returnTo") ?? ""), `/admin/produits/${productId}`);

  if (!imageId || !productId) redirect(`${returnTo}?error=validation`);

  try {
    await deleteAdminProductImage(admin.id, imageId);
    revalidateCatalogue();
    redirect(`${returnTo}?success=image-deleted`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=image-delete`);
  }
}

export async function updateProductAttributeAction(formData: FormData) {
  const admin = await requireRole([...technicalWriterRoles]);
  const parsed = adminProductAttributeSchema.safeParse({
    productId: formData.get("productId"),
    attributeId: formData.get("attributeId"),
    optionId: formData.get("optionId"),
    valueString: formData.get("valueString"),
    valueNumber: formData.get("valueNumber"),
    valueBoolean: formData.get("valueBoolean"),
  });
  const returnTo = safeAdminReturnPath(
    String(formData.get("returnTo") ?? ""),
    parsed.success ? `/admin/produits/${parsed.data.productId}` : "/admin/produits",
  );

  if (!parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    await updateAdminProductAttribute({ adminId: admin.id, ...parsed.data });
    revalidateCatalogue();
    redirect(`${returnTo}?success=attribute`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=attribute`);
  }
}

function productPayload(formData: FormData) {
  return {
    name: formData.get("name"),
    slug: formData.get("slug"),
    sku: formData.get("sku"),
    barcode: formData.get("barcode"),
    brandId: formData.get("brandId"),
    categoryId: formData.get("categoryId"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    technicalDescription: formData.get("technicalDescription"),
    priceBuy: formData.get("priceBuy"),
    priceSell: formData.get("priceSell"),
    promoPrice: formData.get("promoPrice"),
    warrantyMonths: formData.get("warrantyMonths"),
    condition: formData.get("condition"),
    status: formData.get("status"),
    isPromo: formData.has("isPromo"),
    isNew: formData.has("isNew"),
    isRecommended: formData.has("isRecommended"),
    isBestSeller: formData.has("isBestSeller"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
  };
}

function errorCode(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "unique";
  }
  return "save";
}

function revalidateCatalogue(slug?: string) {
  revalidatePath("/");
  revalidatePath("/catalogue");
  revalidatePath("/recherche");
  revalidatePath("/admin/produits");
  if (slug) revalidatePath(`/produit/${slug}`);
}
