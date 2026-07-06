"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { requireRole } from "@/lib/auth/admin-auth";
import { siteSettingsSchema } from "@/lib/validations/site-settings";
import { updateSiteSettings } from "@/lib/services/admin-site-settings";

export async function updateSiteSettingsAction(formData: FormData) {
  const admin = await requireRole(["SUPER_ADMIN"]);
  const parsed = siteSettingsSchema.safeParse({
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    addressPrimary: formData.get("addressPrimary"),
    addressSecondary: formData.get("addressSecondary") ?? "",
    mapsUrl: formData.get("mapsUrl") ?? "",
    facebookUrl: formData.get("facebookUrl") ?? "",
    instagramUrl: formData.get("instagramUrl") ?? "",
    openingHours: formData.get("openingHours"),
  });

  if (!parsed.success) {
    redirect("/admin/parametres?error=validation");
  }

  try {
    await updateSiteSettings(admin.id, parsed.data);
    // Rafraichit le back-office et l'ensemble du site public (footer, contact...).
    revalidatePath("/admin/parametres");
    revalidatePath("/", "layout");
    redirect("/admin/parametres?success=updated");
  } catch (error) {
    unstable_rethrow(error);
    redirect("/admin/parametres?error=save");
  }
}
