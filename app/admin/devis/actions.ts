"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import {
  adminQuoteStatusUpdateSchema,
  safeAdminReturnPath,
} from "@/lib/validations/admin";
import { updateAdminQuoteStatus } from "@/lib/services/admin-quotes";

export async function updateQuoteStatusAction(formData: FormData) {
  const admin = await requireAdminSection("quotes");
  const parsed = adminQuoteStatusUpdateSchema.safeParse({
    quoteId: formData.get("quoteId"),
    status: formData.get("status"),
    returnTo: formData.get("returnTo"),
  });
  const returnTo = safeAdminReturnPath(
    typeof formData.get("returnTo") === "string"
      ? String(formData.get("returnTo"))
      : undefined,
    "/admin/devis",
  );

  if (!parsed.success) {
    redirect(`${returnTo}?error=validation`);
  }

  try {
    await updateAdminQuoteStatus({
      adminId: admin.id,
      quoteId: parsed.data.quoteId,
      status: parsed.data.status,
    });
  } catch {
    redirect(`${returnTo}?error=quote-status`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/devis");
  revalidatePath(`/admin/devis/${parsed.data.quoteId}`);
  redirect(`${returnTo}?success=quote-status`);
}
