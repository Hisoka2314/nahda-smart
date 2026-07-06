"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminEvent, requireRole } from "@/lib/auth/admin-auth";
import {
  adminOrderInternalNoteSchema,
  adminOrderStatusUpdateSchema,
  safeAdminReturnPath,
} from "@/lib/validations/admin";
import {
  cancelStalePendingOrders,
  updateAdminOrderInternalNote,
  updateAdminOrderStatus,
} from "@/lib/services/admin-orders";

export async function cancelStaleOrdersAction() {
  const admin = await requireRole(["MANAGER"]);

  let result = { scanned: 0, cancelled: 0 };

  try {
    result = await cancelStalePendingOrders({ adminId: admin.id });
  } catch {
    redirect("/admin/commandes?error=stale-orders");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/commandes");
  redirect(`/admin/commandes?success=stale-orders&cancelled=${result.cancelled}`);
}

export async function updateOrderStatusAction(formData: FormData) {
  const admin = await requireRole(["MANAGER", "SELLER", "DELIVERY"]);
  const parsed = adminOrderStatusUpdateSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    note: formData.get("note"),
    returnTo: formData.get("returnTo"),
  });
  const returnTo = safeAdminReturnPath(
    typeof formData.get("returnTo") === "string"
      ? String(formData.get("returnTo"))
      : undefined,
    "/admin/commandes",
  );

  if (!parsed.success) {
    redirect(`${returnTo}?error=validation`);
  }

  if (
    admin.role === "DELIVERY" &&
    !["SHIPPED", "DELIVERED"].includes(parsed.data.status)
  ) {
    await logAdminEvent({
      adminId: admin.id,
      action: "ADMIN_UNAUTHORIZED_ACCESS",
      entity: "Order",
      entityId: parsed.data.orderId,
      metadata: {
        role: admin.role,
        requestedStatus: parsed.data.status,
      },
    });
    redirect("/admin/unauthorized");
  }

  try {
    await updateAdminOrderStatus({
      adminId: admin.id,
      orderId: parsed.data.orderId,
      status: parsed.data.status,
      note: parsed.data.note,
    });
  } catch {
    redirect(`${returnTo}?error=order-status`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${parsed.data.orderId}`);
  redirect(`${returnTo}?success=order-status`);
}

export async function updateOrderInternalNoteAction(formData: FormData) {
  const admin = await requireRole(["MANAGER", "SELLER", "ACCOUNTANT"]);
  const parsed = adminOrderInternalNoteSchema.safeParse({
    orderId: formData.get("orderId"),
    internalNote: formData.get("internalNote"),
    returnTo: formData.get("returnTo"),
  });
  const returnTo = safeAdminReturnPath(
    typeof formData.get("returnTo") === "string"
      ? String(formData.get("returnTo"))
      : undefined,
    "/admin/commandes",
  );

  if (!parsed.success) {
    redirect(`${returnTo}?error=validation`);
  }

  try {
    await updateAdminOrderInternalNote({
      adminId: admin.id,
      orderId: parsed.data.orderId,
      internalNote: parsed.data.internalNote,
    });
  } catch {
    redirect(`${returnTo}?error=order-note`);
  }

  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${parsed.data.orderId}`);
  redirect(`${returnTo}?success=order-note`);
}
