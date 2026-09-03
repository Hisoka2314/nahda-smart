import { absoluteUrl } from "@/lib/seo";

export const NAHDA_WHATSAPP_NUMBER = "212600000000";

type ProductWhatsappInput = {
  name: string;
  slug: string;
  path?: string;
  whatsappNumber?: string;
};

export function buildProductWhatsappUrl({
  name,
  slug,
  path,
  whatsappNumber,
}: ProductWhatsappInput) {
  const productPath = path ?? `/produit/${slug}`;
  // L'URL vient de la configuration, pas de window.location : le serveur
  // rendait un lien relatif et le client un lien absolu, ce que React signale
  // comme une divergence d'hydratation et ne corrige pas. Le href conserve
  // dans la page etait donc le relatif, et le message WhatsApp arrivait au
  // magasin avec "/produit/xyz" au lieu d'une adresse cliquable.
  const productUrl = absoluteUrl(productPath);
  const text = `Bonjour Nahda Smart, je suis intéressé par ce produit : ${name} - ${productUrl}`;
  const number = (whatsappNumber ?? NAHDA_WHATSAPP_NUMBER).replace(/\D/g, "");

  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
