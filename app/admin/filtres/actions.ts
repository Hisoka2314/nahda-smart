"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth/admin-auth";
import { safeAdminReturnPath } from "@/lib/validations/admin";
import {
  adminFilterAttributeSchema,
  adminFilterGroupSchema,
  adminFilterOptionSchema,
} from "@/lib/validations/admin-catalogue";
import {
  createAdminFilterAttribute,
  createAdminFilterGroup,
  createAdminFilterOption,
  updateAdminFilterAttribute,
  updateAdminFilterGroup,
  updateAdminFilterOption,
} from "@/lib/services/admin-filters";

export async function createFilterGroupAction(formData: FormData) {
  const admin = await requireRole(["MANAGER"]);
  const parsed = adminFilterGroupSchema.safeParse(groupPayload(formData));
  const returnTo = safeAdminReturnPath(String(formData.get("returnTo") ?? ""), "/admin/filtres");

  if (!parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    const group = await createAdminFilterGroup(admin.id, parsed.data);
    revalidateFilters(group.categoryId);
    redirect(`${returnTo}?success=group`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=${errorCode(error)}`);
  }
}

export async function updateFilterGroupAction(formData: FormData) {
  const admin = await requireRole(["MANAGER"]);
  const id = String(formData.get("id") ?? "");
  const parsed = adminFilterGroupSchema.safeParse({ ...groupPayload(formData), id });
  const returnTo = safeAdminReturnPath(String(formData.get("returnTo") ?? ""), "/admin/filtres");

  if (!id || !parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    const group = await updateAdminFilterGroup(admin.id, { ...parsed.data, id });
    revalidateFilters(group.categoryId);
    redirect(`${returnTo}?success=group-updated`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=${errorCode(error)}`);
  }
}

export async function createFilterAttributeAction(formData: FormData) {
  const admin = await requireRole(["MANAGER"]);
  const parsed = adminFilterAttributeSchema.safeParse(attributePayload(formData));
  const returnTo = safeAdminReturnPath(String(formData.get("returnTo") ?? ""), "/admin/filtres");

  if (!parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    const attribute = await createAdminFilterAttribute(admin.id, parsed.data);
    revalidateFilters(attribute.categoryId);
    redirect(`${returnTo}?success=attribute`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=${errorCode(error)}`);
  }
}

export async function updateFilterAttributeAction(formData: FormData) {
  const admin = await requireRole(["MANAGER"]);
  const id = String(formData.get("id") ?? "");
  const parsed = adminFilterAttributeSchema.safeParse({ ...attributePayload(formData), id });
  const returnTo = safeAdminReturnPath(String(formData.get("returnTo") ?? ""), "/admin/filtres");

  if (!id || !parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    const attribute = await updateAdminFilterAttribute(admin.id, { ...parsed.data, id });
    revalidateFilters(attribute.categoryId);
    redirect(`${returnTo}?success=attribute-updated`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=${errorCode(error)}`);
  }
}

export async function createFilterOptionAction(formData: FormData) {
  const admin = await requireRole(["MANAGER"]);
  const parsed = adminFilterOptionSchema.safeParse(optionPayload(formData));
  const returnTo = safeAdminReturnPath(String(formData.get("returnTo") ?? ""), "/admin/filtres");

  if (!parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    await createAdminFilterOption(admin.id, parsed.data);
    revalidateFilters();
    redirect(`${returnTo}?success=option`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=${errorCode(error)}`);
  }
}

export async function updateFilterOptionAction(formData: FormData) {
  const admin = await requireRole(["MANAGER"]);
  const id = String(formData.get("id") ?? "");
  const parsed = adminFilterOptionSchema.safeParse({ ...optionPayload(formData), id });
  const returnTo = safeAdminReturnPath(String(formData.get("returnTo") ?? ""), "/admin/filtres");

  if (!id || !parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    await updateAdminFilterOption(admin.id, { ...parsed.data, id });
    revalidateFilters();
    redirect(`${returnTo}?success=option-updated`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=${errorCode(error)}`);
  }
}

function groupPayload(formData: FormData) {
  return {
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    order: formData.get("order"),
    defaultOpen: formData.has("defaultOpen"),
    isAdvanced: formData.has("isAdvanced"),
    visible: formData.has("visible"),
  };
}

function attributePayload(formData: FormData) {
  return {
    groupId: formData.get("groupId"),
    categoryId: formData.get("categoryId"),
    label: formData.get("label"),
    slug: formData.get("slug"),
    type: formData.get("type"),
    unit: formData.get("unit"),
    filterable: formData.has("filterable"),
    searchable: formData.has("searchable"),
    visible: formData.has("visible"),
    order: formData.get("order"),
  };
}

function optionPayload(formData: FormData) {
  return {
    attributeId: formData.get("attributeId"),
    label: formData.get("label"),
    value: formData.get("value"),
    order: formData.get("order"),
    visible: formData.has("visible"),
  };
}

function revalidateFilters(categoryId?: string) {
  revalidatePath("/catalogue");
  revalidatePath("/admin/filtres");
  if (categoryId) revalidatePath(`/admin/filtres/${categoryId}`);
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
