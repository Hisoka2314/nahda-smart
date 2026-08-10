import type { MetadataRoute } from "next";
import { absoluteUrl, isIndexable } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Espaces prives ou sans valeur pour l'indexation : back-office,
        // API, tunnel d'achat et pages personnelles du visiteur.
        disallow: [
          "/admin",
          "/api",
          "/checkout",
          "/panier",
          "/commande-confirmee",
          "/favoris",
          "/comparateur",
          "/suivre-commande",
          "/uploads",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
