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
  const productUrl =
    typeof window === "undefined"
      ? productPath
      : `${window.location.origin}${productPath}`;
  const text = `Bonjour Nahda Smart, je suis intéressé par ce produit : ${name} - ${productUrl}`;
  const number = (whatsappNumber ?? NAHDA_WHATSAPP_NUMBER).replace(/\D/g, "");

  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
