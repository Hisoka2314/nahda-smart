"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { requireAdminSection, requireRole } from "@/lib/auth/admin-auth";
import { safeAdminReturnPath } from "@/lib/validations/admin";
import {
  adminSupplierNoteSchema,
  adminSupplierPaymentSchema,
  adminSupplierPurchaseSchema,
  adminSupplierPurchaseStatusSchema,
  adminSupplierSchema,
} from "@/lib/validations/admin-suppliers";
import {
  addAdminSupplierNote,
  addAdminSupplierPayment,
  cancelAdminSupplierPurchase,
  createAdminSupplier,
  createAdminSupplierPurchase,
  receiveAdminSupplierPurchase,
  updateAdminSupplier,
} from "@/lib/services/admin-suppliers";

export async function createSupplierAction(formData: FormData) {
  const admin = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const parsed = adminSupplierSchema.safeParse(supplierPayloadFromForm(formData));

  if (!parsed.success) redirect("/admin/fournisseurs/nouveau?error=validation");

  try {
    const supplier = await createAdminSupplier({
      adminId: admin.id,
      input: parsed.data,
    });
    revalidateSupplierPaths(supplier.id);
    redirect(`/admin/fournisseurs/${supplier.id}?success=supplier-created`);
  } catch (error) {
    unstable_rethrow(error);
    redirect("/admin/fournisseurs/nouveau?error=supplier-create");
  }
}

export async function updateSupplierAction(formData: FormData) {
  const admin = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const id = String(formData.get("id") ?? "");
  const parsed = adminSupplierSchema.safeParse(supplierPayloadFromForm(formData));
  const returnTo = id ? `/admin/fournisseurs/${id}/modifier` : "/admin/fournisseurs";

  if (!parsed.success || !parsed.data.id) redirect(`${returnTo}?error=validation`);

  try {
    const supplier = await updateAdminSupplier({
      adminId: admin.id,
      input: parsed.data as typeof parsed.data & { id: string },
    });
    revalidateSupplierPaths(supplier.id);
    redirect(`/admin/fournisseurs/${supplier.id}?success=supplier-updated`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=supplier-update`);
  }
}

export async function addSupplierNoteAction(formData: FormData) {
  const admin = await requireAdminSection("suppliers");
  const parsed = adminSupplierNoteSchema.safeParse({
    supplierId: formData.get("supplierId"),
    type: formData.get("type"),
    content: formData.get("content"),
    returnTo: formData.get("returnTo"),
  });
  const returnTo = safeAdminReturnPath(
    String(formData.get("returnTo") ?? ""),
    "/admin/fournisseurs",
  );

  if (!parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    await addAdminSupplierNote({
      adminId: admin.id,
      supplierId: parsed.data.supplierId,
      type: parsed.data.type,
      content: parsed.data.content,
    });
    revalidateSupplierPaths(parsed.data.supplierId);
    redirect(`${returnTo}?success=supplier-note`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=supplier-note`);
  }
}

export async function createSupplierPurchaseAction(formData: FormData) {
  const admin = await requireRole(["SUPER_ADMIN", "MANAGER", "STOCK_MANAGER"]);
  const supplierId = String(formData.get("supplierId") ?? "");
  const parsed = adminSupplierPurchaseSchema.safeParse({
    supplierId,
    depotId: formData.get("depotId"),
    reference: formData.get("reference"),
    documentType: formData.get("documentType") ?? undefined,
    date: formData.get("date"),
    status: formData.get("status"),
    transportFee: formData.get("transportFee"),
    customsFee: formData.get("customsFee"),
    otherFee: formData.get("otherFee"),
    paid: formData.get("paid"),
    notes: formData.get("notes"),
    items: purchaseItemsFromForm(formData),
  });
  const returnTo = safeAdminReturnPath(
    String(formData.get("returnTo") ?? ""),
    "/admin/achats-fournisseurs/nouveau",
  );

  if (!parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    const purchase = await createAdminSupplierPurchase({
      adminId: admin.id,
      adminRole: admin.role,
      input: parsed.data,
    });
    revalidateSupplierPurchasePaths(parsed.data.supplierId, purchase.id);
    redirect(`/admin/achats-fournisseurs/${purchase.id}?success=supplier-purchase`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=supplier-purchase`);
  }
}

export async function receiveSupplierPurchaseAction(formData: FormData) {
  const admin = await requireRole(["SUPER_ADMIN", "MANAGER", "STOCK_MANAGER"]);
  const parsed = adminSupplierPurchaseStatusSchema.safeParse({
    purchaseId: formData.get("purchaseId"),
    returnTo: formData.get("returnTo"),
  });
  const returnTo = safeAdminReturnPath(
    String(formData.get("returnTo") ?? ""),
    "/admin/achats-fournisseurs",
  );

  if (!parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    const purchase = await receiveAdminSupplierPurchase({
      adminId: admin.id,
      purchaseId: parsed.data.purchaseId,
    });
    revalidateSupplierPurchasePaths(purchase.supplierId, purchase.id);
    redirect(`${returnTo}?success=supplier-purchase-received`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=supplier-purchase-received`);
  }
}

export async function addSupplierPaymentAction(formData: FormData) {
  const admin = await requireRole(["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"]);
  const parsed = adminSupplierPaymentSchema.safeParse({
    purchaseId: formData.get("purchaseId"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    note: formData.get("note"),
    returnTo: formData.get("returnTo"),
  });
  const returnTo = safeAdminReturnPath(
    String(formData.get("returnTo") ?? ""),
    "/admin/achats-fournisseurs",
  );

  if (!parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    const purchase = await addAdminSupplierPayment({
      adminId: admin.id,
      purchaseId: parsed.data.purchaseId,
      amount: parsed.data.amount,
      method: parsed.data.method,
      note: parsed.data.note,
    });
    revalidateSupplierPurchasePaths(purchase.supplierId, purchase.id);
    redirect(`${returnTo}?success=supplier-payment`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=supplier-payment`);
  }
}

export async function cancelSupplierPurchaseAction(formData: FormData) {
  const admin = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const parsed = adminSupplierPurchaseStatusSchema.safeParse({
    purchaseId: formData.get("purchaseId"),
    returnTo: formData.get("returnTo"),
  });
  const returnTo = safeAdminReturnPath(
    String(formData.get("returnTo") ?? ""),
    "/admin/achats-fournisseurs",
  );

  if (!parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    const purchase = await cancelAdminSupplierPurchase({
      adminId: admin.id,
      purchaseId: parsed.data.purchaseId,
    });
    revalidateSupplierPurchasePaths(purchase.supplierId, purchase.id);
    redirect(`${returnTo}?success=supplier-purchase-cancelled`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=supplier-purchase-cancelled`);
  }
}

function supplierPayloadFromForm(formData: FormData) {
  return {
    id: formData.get("id"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    city: formData.get("city"),
    address: formData.get("address"),
    type: formData.get("type"),
    notes: formData.get("notes"),
    tags: formData.getAll("tags"),
    isActive: formData.get("isActive") === "on",
  };
}

function purchaseItemsFromForm(formData: FormData) {
  const items = [];

  for (let index = 0; index < 12; index += 1) {
    const productId = String(formData.get(`items.${index}.productId`) ?? "");
    if (!productId) continue;

    items.push({
      productId,
      quantity: formData.get(`items.${index}.quantity`),
      unitBuyPrice: formData.get(`items.${index}.unitBuyPrice`),
      updateProductPrice: formData.get(`items.${index}.updateProductPrice`) === "on",
    });
  }

  return items;
}

function revalidateSupplierPaths(supplierId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/fournisseurs");
  revalidatePath("/admin/achats-fournisseurs");
  if (supplierId) {
    revalidatePath(`/admin/fournisseurs/${supplierId}`);
    revalidatePath(`/admin/fournisseurs/${supplierId}/modifier`);
    revalidatePath(`/admin/fournisseurs/${supplierId}/achat`);
  }
}

function revalidateSupplierPurchasePaths(supplierId?: string, purchaseId?: string) {
  revalidateSupplierPaths(supplierId);
  revalidatePath("/admin/stock");
  revalidatePath("/admin/produits");
  revalidatePath("/catalogue");
  if (purchaseId) revalidatePath(`/admin/achats-fournisseurs/${purchaseId}`);
}
