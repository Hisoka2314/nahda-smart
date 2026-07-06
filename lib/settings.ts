import { cache } from "react";
import { getPrismaClient } from "@/lib/db";

export const SITE_SETTING_ID = "site";

export type SiteSettings = {
  companyName: string;
  email: string;
  phone: string;
  whatsapp: string;
  addressPrimary: string;
  addressSecondary: string;
  mapsUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  openingHours: string;
};

// Valeurs par defaut : servent de fallback tant que la ligne n'existe pas
// (ou si la base est indisponible), pour que le site public ne casse jamais.
export const defaultSiteSettings: SiteSettings = {
  companyName: "Nahda Smart",
  email: "contact@nahdasmart.ma",
  phone: "0800 123 456",
  whatsapp: "212600000000",
  addressPrimary: "Casablanca, Maarif",
  addressSecondary: "",
  mapsUrl: "",
  facebookUrl: "",
  instagramUrl: "",
  openingHours: "Lun - Sam : 9h00 - 18h00",
};

function toSiteSettings(row: Record<keyof SiteSettings, string>): SiteSettings {
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

// Cache par requete : plusieurs composants serveur peuvent appeler
// getSiteSettings() sans multiplier les requetes DB.
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const prisma = getPrismaClient();
    const existing = await prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
    });

    if (!existing) {
      return defaultSiteSettings;
    }

    return toSiteSettings(existing);
  } catch {
    return defaultSiteSettings;
  }
});

// Normalise le numero WhatsApp (chiffres uniquement) pour construire un lien wa.me.
export function toWhatsappDigits(whatsapp: string): string {
  return whatsapp.replace(/\D/g, "");
}

// Lien d'itineraire : URL configurée, sinon recherche Google Maps sur l'adresse.
export function buildMapsUrl(settings: SiteSettings): string {
  if (settings.mapsUrl) {
    return settings.mapsUrl;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.addressPrimary)}`;
}
