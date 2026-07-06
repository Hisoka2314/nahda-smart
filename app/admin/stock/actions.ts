"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { requireRole } from "@/lib/auth/admin-auth";
import { safeAdminReturnPath } from "@/lib/validations/admin";
import {
  adminStockMovementSchema,
  adminStockThresholdSchema,
} from "@/lib/validations/admin-catalogue";
import {
  createAdminStockMovement,
  updateAdminStockThreshold,
} from "@/lib/services/admin-stock";

export async function createStockMovementAction(formData: FormData) {
  const admin = await requireRole(["MANAGER", "STOCK_MANAGER"]);
  const parsed = adminStockMovementSchema.safeParse({
    productId: formData.get("productId"),
    depotId: formData.get("depotId"),
    targetDepotId: formData.get("targetDepotId"),
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    reason: formData.get("reason"),
    reference: formData.get("reference"),
    lowStockThreshold: formData.get("lowStockThreshold"),
  });
  const returnTo = safeAdminReturnPath(String(formData.get("returnTo") ?? ""), "/admin/stock");

  if (!parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    await createAdminStockMovement({ adminId: admin.id, ...parsed.data });
    revalidateStock(parsed.data.productId);
    redirect(`${returnTo}?success=movement`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=stock`);
  }
}

export async function updateStockThresholdAction(formData: FormData) {
  const admin = await requireRole(["MANAGER", "STOCK_MANAGER"]);
  const parsed = adminStockThresholdSchema.safeParse({
    productId: formData.get("productId"),
    depotId: formData.get("depotId"),
    lowStockThreshold: formData.get("lowStockThreshold"),
  });
  const returnTo = safeAdminReturnPath(String(formData.get("returnTo") ?? ""), "/admin/stock");

  if (!parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    await updateAdminStockThreshold({ adminId: admin.id, ...parsed.data });
    revalidateStock(parsed.data.productId);
    redirect(`${returnTo}?success=threshold`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=threshold`);
  }
}

function revalidateStock(productId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/stock");
  revalidatePath("/admin/produits");
  if (productId) revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/catalogue");
}
