"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeftRight, Check, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { useCompare } from "@/components/compare/compare-provider";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMad } from "@/lib/utils";
import type { CartProduct } from "@/types/cart";

const stockLabel: Record<CartProduct["stockStatus"], string> = {
  in_stock: "En stock",
  on_order: "Sur commande",
  low_stock: "Stock limité",
  out_of_stock: "Rupture",
};

export function ComparePageClient() {
  const { items, count, clear } = useCompare();

  if (count === 0) {
    return (
      <EmptyState
        className="my-10"
        title="Aucun produit à comparer"
        description="Ajoutez des produits au comparateur depuis le catalogue ou une fiche produit (icône ⇄) pour les mettre côte à côte ici."
        action={
          <Link
            href="/catalogue"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-control bg-nahda-olive px-4 text-sm font-black text-white transition hover:bg-nahda-olive-dark"
          >
            <ArrowLeftRight size={17} />
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
          <p className="text-sm font-black uppercase text-nahda-olive">
            Comparateur
          </p>
          <h1 className="text-3xl font-black text-nahda-ink">
            Comparer ({count})
          </h1>
          <p className="mt-2 text-sm font-bold text-neutral-500">
            Comparaison locale, jusqu&apos;à 4 produits sur cet appareil.
          </p>
        </div>
        <Button variant="outline" onClick={clear}>
          <Trash2 size={17} />
          Tout vider
        </Button>
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${count}, minmax(240px, 1fr))`,
          }}
        >
          {items.map((product) => (
            <CompareColumn key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CompareColumn({ product }: { product: CartProduct }) {
  const { addItem } = useCart();
  const compare = useCompare();
  const favorites = useFavorites();
  const favorite = favorites.has(product.id);
  const outOfStock = product.stockStatus === "out_of_stock";

  return (
    <article className="premium-card flex min-w-0 flex-col gap-4 p-4">
      <Link
        href={`/produit/${product.slug}`}
        className="focus-ring relative block aspect-[4/3] overflow-hidden rounded-[10px] border border-border-soft bg-[#f7f9f4]"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 60vw, 240px"
          className="object-cover"
        />
      </Link>

      <div>
        <p className="text-xs font-black uppercase text-nahda-olive">
          {product.brand}
        </p>
        <Link
          href={`/produit/${product.slug}`}
          className="mt-1 block min-h-[44px] text-base font-black leading-6 text-nahda-ink transition hover:text-nahda-olive"
        >
          {product.name}
        </Link>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-xl font-black text-nahda-olive-dark">
          {formatMad(product.price)}
        </span>
        {product.oldPrice ? (
          <span className="pb-0.5 text-sm text-neutral-400 line-through">
            {formatMad(product.oldPrice)}
          </span>
        ) : null}
      </div>

      <dl className="grid gap-2 border-t border-border-soft pt-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="font-bold text-neutral-500">Catégorie</dt>
          <dd className="text-right font-black text-nahda-ink">
            {product.category}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="font-bold text-neutral-500">Disponibilité</dt>
          <dd>
            <Badge
              variant={
                product.stockStatus === "in_stock"
                  ? "success"
                  : outOfStock
                    ? "default"
                    : "olive"
              }
            >
              {stockLabel[product.stockStatus]}
            </Badge>
          </dd>
        </div>
      </dl>

      <div className="border-t border-border-soft pt-3">
        <p className="text-xs font-black uppercase text-neutral-400">
          Caractéristiques
        </p>
        <ul className="mt-2 grid gap-1.5">
          {product.specs.slice(0, 8).map((spec) => (
            <li
              key={spec}
              className="flex items-start gap-2 text-sm leading-5 text-neutral-700"
            >
              <Check
                size={15}
                className="mt-0.5 shrink-0 text-nahda-olive"
              />
              {spec}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto grid gap-2 pt-1">
        <Button onClick={() => addItem(product)} disabled={outOfStock}>
          <ShoppingCart size={16} />
          {outOfStock ? "Rupture" : "Ajouter au panier"}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={favorite ? "secondary" : "outline"}
            size="sm"
            aria-label="Favoris"
            onClick={() => favorites.toggle(product)}
          >
            {favorite ? "Favori ✓" : "Favoris"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Retirer du comparateur"
            onClick={() => compare.remove(product.id)}
          >
            <Trash2 size={15} />
            Retirer
          </Button>
        </div>
      </div>
    </article>
  );
}
