"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth/admin-auth";
import { safeAdminReturnPath } from "@/lib/validations/admin";
import {
  adminBrandLogoSchema,
  adminBrandSchema,
} from "@/lib/validations/admin-catalogue";
import {
  createAdminBrand,
  updateAdminBrand,
  updateAdminBrandLogo,
} from "@/lib/services/admin-brands";
import { saveAdminImageUpload } from "@/lib/services/admin-upload";

export async function createBrandAction(formData: FormData) {
  const admin = await requireRole(["MANAGER"]);
  const parsed = adminBrandSchema.safeParse(payload(formData));

  if (!parsed.success) redirect("/admin/marques/nouveau?error=validation");

  try {
    const brand = await createAdminBrand(admin.id, parsed.data);
    revalidateBrand();
    redirect(`/admin/marques/${brand.id}?success=created`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`/admin/marques/nouveau?error=${errorCode(error)}`);
  }
}

export async function updateBrandAction(formData: FormData) {
  const admin = await requireRole(["MANAGER"]);
  const id = String(formData.get("id") ?? "");
  const returnTo = safeAdminReturnPath(String(formData.get("returnTo") ?? ""), `/admin/marques/${id}`);
  const parsed = adminBrandSchema.safeParse({ ...payload(formData), id });

  if (!id || !parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    await updateAdminBrand(admin.id, { ...parsed.data, id });
    revalidateBrand();
    redirect(`${returnTo}?success=updated`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=${errorCode(error)}`);
  }
}

export async function uploadBrandLogoAction(formData: FormData) {
  const admin = await requireRole(["MANAGER"]);
  const parsed = adminBrandLogoSchema.safeParse({
    brandId: formData.get("brandId"),
    isOfficialAsset: formData.has("isOfficialAsset"),
  });
  const file = formData.get("logo");
  const returnTo = safeAdminReturnPath(
    String(formData.get("returnTo") ?? ""),
    parsed.success ? `/admin/marques/${parsed.data.brandId}` : "/admin/marques",
  );

  if (!parsed.success || !(file instanceof File)) {
    redirect(`${returnTo}?error=validation`);
  }

  try {
    const logoPath = await saveAdminImageUpload(file, "brands");
    await updateAdminBrandLogo({
      adminId: admin.id,
      brandId: parsed.data.brandId,
      logoPath,
      isOfficialAsset: parsed.data.isOfficialAsset,
    });
    revalidateBrand();
    redirect(`${returnTo}?success=logo`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=logo`);
  }
}

export async function removeBrandLogoAction(formData: FormData) {
  const admin = await requireRole(["MANAGER"]);
  const brandId = String(formData.get("brandId") ?? "");
  const returnTo = safeAdminReturnPath(String(formData.get("returnTo") ?? ""), `/admin/marques/${brandId}`);

  if (!brandId) redirect(`${returnTo}?error=validation`);

  try {
    await updateAdminBrandLogo({ adminId: admin.id, brandId, logoPath: null });
    revalidateBrand();
    redirect(`${returnTo}?success=logo-removed`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=logo-remove`);
  }
}

function payload(formData: FormData) {
  return {
    name: formData.get("name"),
    slug: formData.get("slug"),
    logoPath: formData.get("logoPath"),
    isActive: formData.has("isActive"),
    isOfficialAsset: formData.has("isOfficialAsset"),
  };
}

function revalidateBrand() {
  revalidatePath("/");
  revalidatePath("/catalogue");
  revalidatePath("/admin/marques");
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
