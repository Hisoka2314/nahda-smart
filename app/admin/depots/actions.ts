"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { requireRole } from "@/lib/auth/admin-auth";
import { safeAdminReturnPath } from "@/lib/validations/admin";
import { adminDepotSchema } from "@/lib/validations/admin-catalogue";
import {
  createAdminDepot,
  updateAdminDepot,
} from "@/lib/services/admin-depots";

export async function createDepotAction(formData: FormData) {
  const admin = await requireRole(["MANAGER", "STOCK_MANAGER"]);
  const parsed = adminDepotSchema.safeParse(payload(formData));

  if (!parsed.success) redirect("/admin/depots?error=validation");

  try {
    await createAdminDepot(admin.id, parsed.data);
    revalidatePath("/admin/depots");
    revalidatePath("/admin/stock");
    redirect("/admin/depots?success=created");
  } catch (error) {
    unstable_rethrow(error);
    redirect("/admin/depots?error=save");
  }
}

export async function updateDepotAction(formData: FormData) {
  const admin = await requireRole(["MANAGER", "STOCK_MANAGER"]);
  const id = String(formData.get("id") ?? "");
  const returnTo = safeAdminReturnPath(String(formData.get("returnTo") ?? ""), "/admin/depots");
  const parsed = adminDepotSchema.safeParse({ ...payload(formData), id });

  if (!id || !parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    await updateAdminDepot(admin.id, { ...parsed.data, id });
    revalidatePath("/admin/depots");
    revalidatePath("/admin/stock");
    redirect(`${returnTo}?success=updated`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=save`);
  }
}

function payload(formData: FormData) {
  return {
    name: formData.get("name"),
    type: formData.get("type"),
    address: formData.get("address"),
    managerName: formData.get("managerName"),
    isActive: formData.has("isActive"),
  };
}
