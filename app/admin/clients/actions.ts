"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { requireAdminSection, requireRole } from "@/lib/auth/admin-auth";
import { safeAdminReturnPath } from "@/lib/validations/admin";
import {
  adminCustomerNoteSchema,
  adminCustomerSchema,
  adminManualOrderSchema,
} from "@/lib/validations/admin-crm";
import {
  addAdminCustomerNote,
  createAdminCustomer,
  createAdminManualOrder,
  updateAdminCustomer,
} from "@/lib/services/admin-clients";

export async function createCustomerAction(formData: FormData) {
  const admin = await requireRole(["MANAGER", "SELLER"]);
  const parsed = adminCustomerSchema.safeParse(customerPayloadFromForm(formData));

  if (!parsed.success) redirect("/admin/clients/nouveau?error=validation");

  try {
    const customer = await createAdminCustomer({
      adminId: admin.id,
      adminRole: admin.role,
      input: parsed.data,
    });
    revalidateCustomers(customer.id);
    redirect(`/admin/clients/${customer.id}?success=customer-created`);
  } catch (error) {
    unstable_rethrow(error);
    redirect("/admin/clients/nouveau?error=customer-create");
  }
}

export async function updateCustomerAction(formData: FormData) {
  const admin = await requireRole(["MANAGER", "SELLER", "ACCOUNTANT"]);
  const id = String(formData.get("id") ?? "");
  const returnTo = id ? `/admin/clients/${id}/modifier` : "/admin/clients";
  const parsed = adminCustomerSchema.safeParse(customerPayloadFromForm(formData));

  if (!parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    const customer = await updateAdminCustomer({
      adminId: admin.id,
      adminRole: admin.role,
      input: parsed.data,
    });
    revalidateCustomers(customer.id);
    redirect(`/admin/clients/${customer.id}?success=customer-updated`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=customer-update`);
  }
}

export async function addCustomerNoteAction(formData: FormData) {
  const admin = await requireAdminSection("customers");
  const parsed = adminCustomerNoteSchema.safeParse({
    customerId: formData.get("customerId"),
    type: formData.get("type"),
    content: formData.get("content"),
    returnTo: formData.get("returnTo"),
  });
  const returnTo = safeAdminReturnPath(
    String(formData.get("returnTo") ?? ""),
    "/admin/clients",
  );

  if (!parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    await addAdminCustomerNote({
      adminId: admin.id,
      customerId: parsed.data.customerId,
      type: parsed.data.type,
      content: parsed.data.content,
    });
    revalidateCustomers(parsed.data.customerId);
    redirect(`${returnTo}?success=customer-note`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=customer-note`);
  }
}

export async function createManualOrderAction(formData: FormData) {
  const admin = await requireRole(["MANAGER", "SELLER"]);
  const customerId = String(formData.get("customerId") ?? "");
  const parsed = adminManualOrderSchema.safeParse({
    customerId,
    depotId: formData.get("depotId"),
    deliveryMethod: formData.get("deliveryMethod"),
    paymentMethod: formData.get("paymentMethod"),
    status: formData.get("status"),
    customerNote: formData.get("customerNote"),
    internalNote: formData.get("internalNote"),
    items: manualOrderItemsFromForm(formData),
  });
  const returnTo = customerId
    ? `/admin/clients/${customerId}/nouvelle-commande`
    : "/admin/clients";

  if (!parsed.success) redirect(`${returnTo}?error=validation`);

  try {
    const order = await createAdminManualOrder({
      adminId: admin.id,
      adminRole: admin.role,
      input: parsed.data,
    });
    revalidateCustomers(customerId);
    revalidatePath("/admin");
    revalidatePath("/admin/commandes");
    revalidatePath("/admin/stock");
    revalidatePath("/catalogue");
    redirect(`/admin/commandes/${order.id}?success=manual-order`);
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=manual-order`);
  }
}

function customerPayloadFromForm(formData: FormData) {
  return {
    id: formData.get("id"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    city: formData.get("city"),
    address: formData.get("address"),
    type: formData.get("type"),
    organizationName: formData.get("organizationName"),
    source: formData.get("source"),
    level: formData.get("level"),
    relationshipStatus: formData.get("relationshipStatus"),
    internalNotes: formData.get("internalNotes"),
    tags: formData.getAll("tags"),
  };
}

function manualOrderItemsFromForm(formData: FormData) {
  const items = [];

  for (let index = 0; index < 6; index += 1) {
    const productId = String(formData.get(`items.${index}.productId`) ?? "");
    if (!productId) continue;

    items.push({
      productId,
      quantity: formData.get(`items.${index}.quantity`),
      unitPrice: formData.get(`items.${index}.unitPrice`),
      discount: formData.get(`items.${index}.discount`),
    });
  }

  return items;
}

function revalidateCustomers(customerId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  if (customerId) {
    revalidatePath(`/admin/clients/${customerId}`);
    revalidatePath(`/admin/clients/${customerId}/modifier`);
    revalidatePath(`/admin/clients/${customerId}/nouvelle-commande`);
  }
}
