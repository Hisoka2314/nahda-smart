import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";
import { ShopLayout } from "@/components/layout/shop-layout";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Page introuvable | Nahda Smart",
  description:
    "Cette page n'existe pas ou a été déplacée. Retrouvez nos produits informatique, réseau et sécurité depuis le catalogue.",
  robots: { index: false, follow: true },
};

const suggestions = [
  { href: "/catalogue", label: "Voir le catalogue", icon: Compass },
  { href: "/recherche", label: "Rechercher un produit", icon: Search },
  { href: "/contact", label: "Nous contacter", icon: Home },
];

export default function NotFound() {
  return (
    <ShopLayout>
      <main className="bg-background py-16">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-black uppercase tracking-wide text-nahda-olive">
              Erreur 404
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-nahda-ink md:text-4xl">
              Cette page n&apos;existe pas
            </h1>
            <p className="mt-4 text-base leading-7 text-neutral-600">
              Le lien est peut-être erroné, ou le produit que vous cherchez
              n&apos;est plus au catalogue. Voici par où continuer.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {suggestions.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="focus-ring flex flex-col items-center gap-2 rounded-card border border-neutral-200 bg-white p-5 text-sm font-bold text-nahda-ink transition hover:border-nahda-olive hover:text-nahda-olive-dark"
                >
                  <Icon size={22} />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </main>
    </ShopLayout>
  );
}
