import type { Metadata } from "next";
import { CartProvider } from "@/components/cart/cart-provider";
import { CompareProvider } from "@/components/compare/compare-provider";
import { FavoritesProvider } from "@/components/favorites/favorites-provider";
import { getSiteSettings } from "@/lib/settings";
import { getSiteUrl, isIndexable } from "@/lib/seo";
import "./globals.css";

const siteName = "Nahda Smart";
const siteDescription =
  "Boutique e-commerce marocaine pour matériel informatique, réseau, télécommunication, sécurité, accessoires et solutions B2B.";

export const metadata: Metadata = {
  // metadataBase resout les URL relatives (Open Graph, canoniques). Sans lui,
  // aucun apercu ne s'affichait au partage d'un lien sur WhatsApp ou Facebook.
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteName} | Technologie, réseau et sécurité au Maroc`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  alternates: { canonical: "/" },
  robots: isIndexable()
    ? { index: true, follow: true }
    : { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName,
    locale: "fr_MA",
    url: "/",
    title: `${siteName} | Technologie, réseau et sécurité au Maroc`,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Technologie, réseau et sécurité au Maroc`,
    description: siteDescription,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const settings = await getSiteSettings();

  return (
    <html lang="fr" className="h-full antialiased" data-scroll-behavior="smooth">
      <head>
        {plausibleDomain ? (
          <script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
          />
        ) : null}
      </head>
      <body className="flex min-h-full flex-col">
        <CartProvider deliveryFee={settings.deliveryFee}>
          <FavoritesProvider>
            <CompareProvider>{children}</CompareProvider>
          </FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  );
}
