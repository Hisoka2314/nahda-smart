import { getPrismaClient } from "@/lib/db";
import { logAdminEvent } from "@/lib/auth/admin-auth";
import {
  SITE_SETTING_ID,
  defaultSiteSettings,
  type SiteSettings,
} from "@/lib/settings";
import type { SiteSettingsInput } from "@/lib/validations/site-settings";

function toSettings(row: Record<keyof SiteSettings, string>): SiteSettings {
  return {
    companyName: row.companyName,
    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp,
    addressPrimary: row.addressPrimary,
    addressSecondary: row.addressSecondary,
    mapsUrl: row.mapsUrl,
    facebookUrl: row.facebookUrl,
    instagramUrl: row.instagramUrl,
    openingHours: row.openingHours,
  };
}

// Garantit l'existence de la ligne unique et renvoie ses valeurs courantes
// pour pré-remplir le formulaire d'administration.
export async function getSiteSettingsForAdmin(): Promise<SiteSettings> {
  const db = getPrismaClient();
  const row = await db.siteSetting.upsert({
    where: { id: SITE_SETTING_ID },
    create: { id: SITE_SETTING_ID, ...defaultSiteSettings },
    update: {},
  });

  return toSettings(row);
}

export async function updateSiteSettings(
  adminId: string,
  input: SiteSettingsInput,
): Promise<SiteSettings> {
  const db = getPrismaClient();
  const row = await db.siteSetting.upsert({
    where: { id: SITE_SETTING_ID },
    create: { id: SITE_SETTING_ID, ...input },
    update: { ...input },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_SETTINGS_UPDATED",
    entity: "SiteSetting",
    entityId: SITE_SETTING_ID,
    metadata: { email: input.email, phone: input.phone },
  });

  return toSettings(row);
}
