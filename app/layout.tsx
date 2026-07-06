import type { Metadata } from "next";
import { CartProvider } from "@/components/cart/cart-provider";
import { CompareProvider } from "@/components/compare/compare-provider";
import { FavoritesProvider } from "@/components/favorites/favorites-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nahda Smart | Technologie, réseau et sécurité au Maroc",
  description:
    "Boutique e-commerce marocaine pour matériel informatique, réseau, télécommunication, sécurité, accessoires et solutions B2B.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

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
        <CartProvider>
          <FavoritesProvider>
            <CompareProvider>{children}</CompareProvider>
          </FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  );
}
