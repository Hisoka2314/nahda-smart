"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { requireRole } from "@/lib/auth/admin-auth";
import { safeAdminReturnPath } from "@/lib/validations/admin";
import {
  adminServiceTicketCreateSchema,
  adminServiceTicketNoteSchema,
  adminServiceTicketResolutionSchema,
  adminServiceTicketStatusSchema,
} from "@/lib/validations/admin-sav";
import {
  addAdminServiceTicketNote,
  createAdminServiceTicket,
  resolveAdminServiceTicket,
  updateAdminServiceTicketStatus,
} from "@/lib/services/admin-sav";

export async function createServiceTicketAction(formData: FormData) {
  const admin = await requireRole(["SUPER_ADMIN", "MANAGER", "SELLER"]);
  const parsed = adminServiceTicketCreateSchema.safeParse({
    customerId: formData.get("customerId"),
    orderId: formData.get("orderId"),
    productId: formData.get("productId"),
    supplierId: formData.get("supplierId"),
    type: formData.get("type"),
    urgency: formData.get("urgency"),
    problem: formData.get("problem"),
    internalNotes: formData.get("internalNotes"),
  });

  if (!parsed.success) {
    redirect("/admin/sav/nouveau?error=validation");
  }

  try {
    const ticket = await createAdminServiceTicket({
      adminId: admin.id,
      input: parsed.data,
    });
    revalidateSavPaths(ticket.id);
    redirect(`/admin/sav/${ticket.id}?success=sav-created`);
  } catch (error) {
    unstable_rethrow(error);
    redirect("/admin/sav/nouveau?error=sav-create");
  }
}

export async function updateServiceTicketStatusAction(formData: FormData) {
  const admin = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const parsed = adminServiceTicketStatusSchema.safeParse({
    ticketId: formData.get("ticketId"),
    status: formData.get("status"),
    note: formData.get("note"),
    returnTo: formData.get("returnTo"),
  });
  const returnTo = safeAdminReturnPath(
    String(formData.get("returnTo") ?? ""),
    "/admin/sav",
  );

  if (!parsed.success) {
    redirect(`${returnTo}?error=validation`);
  }

  try {
    await updateAdminServiceTicketStatus({
      adminId: admin.id,
      ticketId: parsed.data.ticketId,
      status: parsed.data.status,
      note: parsed.data.note,
    });
    revalidateSavPaths(parsed.data.ticketId);
    redirect(`${returnTo}?success=sav-status`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=sav-status`);
  }
}

export async function addServiceTicketNoteAction(formData: FormData) {
  const admin = await requireRole([
    "SUPER_ADMIN",
    "MANAGER",
    "SELLER",
    "STOCK_MANAGER",
  ]);
  const parsed = adminServiceTicketNoteSchema.safeParse({
    ticketId: formData.get("ticketId"),
    type: formData.get("type"),
    content: formData.get("content"),
    returnTo: formData.get("returnTo"),
  });
  const returnTo = safeAdminReturnPath(
    String(formData.get("returnTo") ?? ""),
    "/admin/sav",
  );

  if (!parsed.success) {
    redirect(`${returnTo}?error=validation`);
  }

  try {
    await addAdminServiceTicketNote({
      adminId: admin.id,
      ticketId: parsed.data.ticketId,
      type: parsed.data.type,
      content: parsed.data.content,
    });
    revalidateSavPaths(parsed.data.ticketId);
    redirect(`${returnTo}?success=sav-note`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=sav-note`);
  }
}

export async function resolveServiceTicketAction(formData: FormData) {
  const parsed = adminServiceTicketResolutionSchema.safeParse({
    ticketId: formData.get("ticketId"),
    action: formData.get("action"),
    depotId: formData.get("depotId"),
    quantity: formData.get("quantity"),
    returnToStock: formData.get("returnToStock") === "on",
    note: formData.get("note"),
    returnTo: formData.get("returnTo"),
  });
  const returnTo = safeAdminReturnPath(
    String(formData.get("returnTo") ?? ""),
    "/admin/sav",
  );

  if (!parsed.success) {
    redirect(`${returnTo}?error=validation`);
  }

  const admin =
    parsed.data.action === "CLOSE"
      ? await requireRole(["SUPER_ADMIN", "MANAGER"])
      : await requireRole(["SUPER_ADMIN", "MANAGER", "STOCK_MANAGER"]);

  try {
    await resolveAdminServiceTicket({
      adminId: admin.id,
      input: parsed.data,
    });
    revalidateSavPaths(parsed.data.ticketId);
    revalidatePath("/admin/stock");
    revalidatePath("/admin/produits");
    revalidatePath("/catalogue");

    const success =
      parsed.data.action === "REPAIR"
        ? "sav-repaired"
        : parsed.data.action === "REPLACE"
          ? "sav-replaced"
          : "sav-closed";
    redirect(`${returnTo}?success=${success}`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=sav-stock`);
  }
}

function revalidateSavPaths(ticketId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/sav");
  if (ticketId) revalidatePath(`/admin/sav/${ticketId}`);
}
