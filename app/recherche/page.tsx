import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { ShopLayout } from "@/components/layout/shop-layout";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { toProductCardProduct } from "@/lib/catalogue";
import { searchRateLimit } from "@/lib/security/rate-limit";
import { getPublicSearchData } from "@/lib/services/public-catalogue";

export const metadata: Metadata = {
  title: "Recherche | Nahda Smart",
  description:
    "Recherche produit Nahda Smart dans le catalogue informatique, réseau, sécurité, impression et accessoires.",
};

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 80);
  const rateLimit = query ? searchRateLimit(await headers()) : { limited: false };
  const searchData = rateLimit.limited
    ? { source: "rate-limit" as const, query, products: [] }
    : await getPublicSearchData(query);

  return (
    <ShopLayout>
      <main className="bg-background py-8 md:py-10">
        <Container>
          <section className="overflow-hidden rounded-card border border-border-soft bg-nahda-ink text-white shadow-premium">
            <div className="p-6 md:p-8">
              <p className="text-sm font-black uppercase text-[#a8c84c]">
                Recherche catalogue
              </p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">
                {query ? `Résultats pour "${query}"` : "Rechercher un produit"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/70">
                Recherchez par nom, marque, catégorie, description ou attribut
                technique. Aucun paiement en ligne n&apos;est activé.
              </p>
              <form
                action="/recherche"
                method="get"
                className="mt-6 flex h-12 max-w-2xl overflow-hidden rounded-control bg-white text-nahda-ink shadow-sm"
              >
                <input
                  name="q"
                  defaultValue={query}
                  aria-label="Recherche"
                  className="min-w-0 flex-1 px-4 text-sm outline-none"
                  placeholder="Ex. hp, routeur, ssd..."
                />
                <button
                  type="submit"
                  className="grid w-14 place-items-center bg-nahda-olive text-white transition hover:bg-nahda-olive-dark"
                  aria-label="Rechercher"
                >
                  <Search size={20} />
                </button>
              </form>
            </div>
          </section>

          {rateLimit.limited ? (
            <EmptyState
              className="mt-8"
              title="Trop de recherches"
              description="Veuillez patienter quelques instants avant de relancer une recherche."
              action={
                <Link
                  href="/catalogue"
                  className="focus-ring inline-flex h-11 items-center justify-center rounded-control bg-nahda-olive px-4 text-sm font-black text-white transition hover:bg-nahda-olive-dark"
                >
                  Retour au catalogue
                </Link>
              }
            />
          ) : !query ? (
            <EmptyState
              className="mt-8"
              title="Saisissez une recherche"
              description="Vous pouvez chercher un produit, une marque ou une référence technique."
              action={
                <Link
                  href="/catalogue"
                  className="focus-ring inline-flex h-11 items-center justify-center rounded-control bg-nahda-olive px-4 text-sm font-black text-white transition hover:bg-nahda-olive-dark"
                >
                  Ouvrir le catalogue
                </Link>
              }
            />
          ) : searchData.products.length === 0 ? (
            <EmptyState
              className="mt-8"
              title="Aucun résultat"
              description="Essayez une autre marque, une référence plus courte ou contactez Nahda Smart pour une recherche fournisseur."
              action={
                <Link
                  href="/contact"
                  className="focus-ring inline-flex h-11 items-center justify-center rounded-control bg-nahda-olive px-4 text-sm font-black text-white transition hover:bg-nahda-olive-dark"
                >
                  Demander conseil
                </Link>
              }
            />
          ) : (
            <section className="mt-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase text-nahda-olive">
                    {searchData.products.length} résultat
                    {searchData.products.length > 1 ? "s" : ""}
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-nahda-ink">
                    Produits trouvés
                  </h2>
                </div>
                <Link
                  href={`/catalogue?q=${encodeURIComponent(query)}`}
                  className="focus-ring inline-flex h-11 items-center justify-center rounded-control border border-nahda-olive/[0.45] bg-white px-4 text-sm font-black text-nahda-olive-dark transition hover:bg-nahda-olive-soft"
                >
                  Filtrer dans le catalogue
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {searchData.products.map((product) => (
                  <ProductCard
                    key={product.slug}
                    product={toProductCardProduct(product)}
                  />
                ))}
              </div>
            </section>
          )}
        </Container>
      </main>
    </ShopLayout>
  );
}
