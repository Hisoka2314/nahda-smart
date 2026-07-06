"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth/admin-auth";
import { safeAdminReturnPath } from "@/lib/validations/admin";
import { adminCategorySchema } from "@/lib/validations/admin-catalogue";
import {
  createAdminCategory,
  updateAdminCategory,
} from "@/lib/services/admin-categories";

export async function createCategoryAction(formData: FormData) {
  const admin = await requireRole(["MANAGER"]);
  const parsed = adminCategorySchema.safeParse(payload(formData));

  if (!parsed.success) redirect("/admin/categories/nouveau?error=validation");

  try {
    const category = await createAdminCategory(admin.id, parsed.data);
    revalidateCategory();
    redirect(`/admin/categories/${category.id}?success=created`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`/admin/categories/nouveau?error=${errorCode(error)}`);
  }
}

export async function updateCategoryAction(formData: FormData) {
  const admin = await requireRole(["MANAGER"]);
  const id = String(formData.get("id") ?? "");
  const returnTo = safeAdminReturnPath(String(formData.get("returnTo") ?? ""), `/admin/categories/${id}`);
  const parsed = adminCategorySchema.safeParse({ ...payload(formData), id });

  if (!id || !parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    await updateAdminCategory(admin.id, { ...parsed.data, id });
    revalidateCategory();
    redirect(`${returnTo}?success=updated`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=${errorCode(error)}`);
  }
}

function payload(formData: FormData) {
  return {
    name: formData.get("name"),
    slug: formData.get("slug"),
    parentId: formData.get("parentId"),
    icon: formData.get("icon"),
    bannerUrl: formData.get("bannerUrl"),
    description: formData.get("description"),
    order: formData.get("order"),
    isActive: formData.has("isActive"),
  };
}

function revalidateCategory() {
  revalidatePath("/");
  revalidatePath("/catalogue");
  revalidatePath("/admin/categories");
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
