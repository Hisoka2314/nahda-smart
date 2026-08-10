import { cache } from "react";
import type { SiteSetting } from "@prisma/client";
import { getPrismaClient } from "@/lib/db";

type SiteSettingRow = SiteSetting;

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
  deliveryFee: number;
};

// Source unique du tarif de livraison. Le montant etait auparavant ecrit en
// dur dans le service commande, dans lib/orders.ts et dans le panier, ce
// dernier l'appliquant meme au retrait en magasin.
export function resolveDeliveryFee(
  settings: Pick<SiteSettings, "deliveryFee">,
  deliveryMethod: "home_delivery" | "store_pickup",
): number {
  return deliveryMethod === "home_delivery" ? settings.deliveryFee : 0;
}

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
  deliveryFee: 30,
};

// Mappeur unique partage avec le back-office : il etait duplique dans
// admin-site-settings.ts, ce qui laissait les deux versions diverger.
export function toSiteSettings(row: SiteSettingRow): SiteSettings {
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
    deliveryFee: Number(row.deliveryFee),
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
