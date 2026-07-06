"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeftRight, Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { useCompare } from "@/components/compare/compare-provider";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMad } from "@/lib/utils";
import type { CartProduct } from "@/types/cart";

export function FavoritesPageClient() {
  const { items, count, clear } = useFavorites();

  if (count === 0) {
    return (
      <EmptyState
        className="my-10"
        title="Aucun favori pour le moment"
        description="Cliquez sur le cœur d'un produit dans le catalogue ou sur une fiche produit pour le retrouver ici, sur cet appareil."
        action={
          <Link
            href="/catalogue"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-control bg-nahda-olive px-4 text-sm font-black text-white transition hover:bg-nahda-olive-dark"
          >
            <Heart size={17} />
            Explorer le catalogue
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase text-nahda-olive">Favoris</p>
          <h1 className="text-3xl font-black text-nahda-ink">
            Mes favoris ({count})
          </h1>
          <p className="mt-2 text-sm font-bold text-neutral-500">
            Sauvegardés localement sur cet appareil.
          </p>
        </div>
        <Button variant="outline" onClick={clear}>
          <Trash2 size={17} />
          Tout vider
        </Button>
      </div>

      <div className="mt-6 grid gap-4">
        {items.map((product) => (
          <FavoriteRow key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function FavoriteRow({ product }: { product: CartProduct }) {
  const { addItem } = useCart();
  const favorites = useFavorites();
  const compare = useCompare();
  const compared = compare.has(product.id);
  const outOfStock = product.stockStatus === "out_of_stock";

  return (
    <article className="premium-card grid gap-4 p-4 md:grid-cols-[132px_minmax(0,1fr)_200px]">
      <Link
        href={`/produit/${product.slug}`}
        className="focus-ring relative aspect-[4/3] overflow-hidden rounded-[10px] border border-border-soft bg-[#f7f9f4] md:aspect-square"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 132px"
          className="object-cover"
        />
      </Link>

      <div className="min-w-0">
        <p className="text-xs font-black uppercase text-nahda-olive">
          {product.brand} · {product.category}
        </p>
        <Link
          href={`/produit/${product.slug}`}
          className="mt-1 block text-lg font-black leading-6 text-nahda-ink transition hover:text-nahda-olive"
        >
          {product.name}
        </Link>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.specs.slice(0, 4).map((spec) => (
            <span
              key={spec}
              className="rounded-[7px] bg-surface-muted px-2 py-1 text-xs font-bold text-neutral-600"
            >
              {spec}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 md:items-end">
        <div className="md:text-right">
          <p className="text-2xl font-black text-nahda-olive-dark">
            {formatMad(product.price)}
          </p>
          {product.oldPrice ? (
            <p className="text-sm text-neutral-400 line-through">
              {formatMad(product.oldPrice)}
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row md:justify-end">
          <Button
            className="w-full sm:w-auto"
            onClick={() => addItem(product)}
            disabled={outOfStock}
          >
            <ShoppingCart size={16} />
            {outOfStock ? "Rupture" : "Panier"}
          </Button>
          <Button
            variant={compared ? "secondary" : "outline"}
            size="icon"
            aria-label="Comparer"
            onClick={() => compare.toggle(product)}
          >
            <ArrowLeftRight size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Retirer des favoris"
            onClick={() => favorites.remove(product.id)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </article>
  );
}
