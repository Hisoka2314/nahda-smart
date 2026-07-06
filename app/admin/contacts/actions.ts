"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import {
  adminContactStatusUpdateSchema,
  safeAdminReturnPath,
} from "@/lib/validations/admin";
import {
  convertContactToCustomer,
  registerContactCallAttempt,
  saveContactNote,
  scheduleContactCallback,
  updateAdminContactStatus,
} from "@/lib/services/admin-contacts";

function contactId(formData: FormData) {
  const value = formData.get("contactId");
  return typeof value === "string" && value.length > 0 ? value : null;
}

function returnPath(formData: FormData) {
  return safeAdminReturnPath(
    typeof formData.get("returnTo") === "string"
      ? String(formData.get("returnTo"))
      : undefined,
    "/admin/contacts",
  );
}

function refreshContacts() {
  revalidatePath("/admin");
  revalidatePath("/admin/contacts");
}

export async function updateContactStatusAction(formData: FormData) {
  const admin = await requireAdminSection("contacts");
  const parsed = adminContactStatusUpdateSchema.safeParse({
    contactId: formData.get("contactId"),
    status: formData.get("status"),
    returnTo: formData.get("returnTo"),
  });
  const returnTo = returnPath(formData);

  if (!parsed.success) {
    redirect(`${returnTo}?error=validation`);
  }

  try {
    await updateAdminContactStatus({
      adminId: admin.id,
      contactId: parsed.data.contactId,
      status: parsed.data.status,
    });
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=contact-status`);
  }

  refreshContacts();
  redirect(`${returnTo}?success=contact-status`);
}

// Appel sans réponse : +1 tentative, statut "Pas de réponse".
export async function leadNoAnswerAction(formData: FormData) {
  const admin = await requireAdminSection("contacts");
  const id = contactId(formData);
  const returnTo = returnPath(formData);

  if (!id) redirect(`${returnTo}?error=validation`);

  try {
    await registerContactCallAttempt({ adminId: admin.id, contactId: id });
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=contact-status`);
  }

  refreshContacts();
  redirect(`${returnTo}?success=lead-no-answer`);
}

// Planifie un rappel à une date donnée.
export async function leadCallbackAction(formData: FormData) {
  const admin = await requireAdminSection("contacts");
  const id = contactId(formData);
  const returnTo = returnPath(formData);
  const rawDate = formData.get("callbackAt");
  const callbackAt =
    typeof rawDate === "string" && rawDate ? new Date(rawDate) : null;

  if (!id || !callbackAt || Number.isNaN(callbackAt.getTime())) {
    redirect(`${returnTo}?error=validation`);
  }

  try {
    await scheduleContactCallback({
      adminId: admin.id,
      contactId: id,
      callbackAt,
    });
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=contact-status`);
  }

  refreshContacts();
  redirect(`${returnTo}?success=lead-callback`);
}

export async function leadNoteAction(formData: FormData) {
  const admin = await requireAdminSection("contacts");
  const id = contactId(formData);
  const returnTo = returnPath(formData);
  const note = typeof formData.get("note") === "string" ? String(formData.get("note")) : "";

  if (!id) redirect(`${returnTo}?error=validation`);

  try {
    await saveContactNote({ adminId: admin.id, contactId: id, note });
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=contact-status`);
  }

  refreshContacts();
  redirect(`${returnTo}?success=lead-note`);
}

// Convertit le lead en client puis ouvre directement la fiche client.
export async function leadConvertAction(formData: FormData) {
  const admin = await requireAdminSection("contacts");
  const id = contactId(formData);
  const returnTo = returnPath(formData);

  if (!id) redirect(`${returnTo}?error=validation`);

  let customerId: string;

  try {
    const result = await convertContactToCustomer({
      adminId: admin.id,
      contactId: id,
    });
    customerId = result.customerId;
  } catch (error) {
    unstable_rethrow(error);
    redirect(`${returnTo}?error=lead-convert`);
  }

  refreshContacts();
  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${customerId}?success=customer-created`);
}
