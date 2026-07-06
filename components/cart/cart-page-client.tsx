"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMad } from "@/lib/utils";
import type { CartItem } from "@/types/cart";

export function CartPageClient() {
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <EmptyState
        className="my-10"
        title="Votre panier est vide"
        description="Ajoutez des produits depuis le catalogue ou une fiche produit. Les commandes Nahda Smart seront confirmées par notre équipe."
        action={
          <Link
            href="/catalogue"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-control bg-nahda-olive px-4 text-sm font-black text-white transition hover:bg-nahda-olive-dark"
          >
            <ShoppingCart size={17} />
            Retour à la boutique
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-nahda-olive">
              Panier
            </p>
            <h1 className="text-3xl font-black text-nahda-ink">
              Votre panier
            </h1>
            <p className="mt-2 text-sm font-bold text-neutral-500">
              Votre commande sera confirmée par notre équipe.
            </p>
          </div>
          <Button variant="outline" onClick={clearCart}>
            <Trash2 size={17} />
            Vider le panier
          </Button>
        </div>

        <div className="mt-6 grid gap-4">
          {items.map((item) => (
            <CartItemCard key={item.product.id} item={item} />
          ))}
        </div>
      </section>

      <aside className="lg:sticky lg:top-[170px] lg:self-start">
        <div className="rounded-card border border-border-soft bg-white p-5 shadow-premium">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-[10px] bg-nahda-olive-soft text-nahda-olive">
              <ShieldCheck size={21} />
            </span>
            <div>
              <h2 className="font-black text-nahda-ink">Résumé commande</h2>
              <p className="text-sm font-bold text-neutral-500">
                Confirmation par téléphone ou WhatsApp.
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-3 text-sm font-bold text-neutral-600">
            <div className="flex justify-between gap-4">
              <dt>Sous-total</dt>
              <dd>{formatMad(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Livraison</dt>
              <dd>{formatMad(deliveryFee)}</dd>
            </div>
            <div className="border-t border-border-soft pt-4">
              <div className="flex items-end justify-between gap-4">
                <dt className="text-base font-black text-nahda-ink">Total</dt>
                <dd className="text-3xl font-black text-nahda-olive-dark">
                  {formatMad(total)}
                </dd>
              </div>
            </div>
          </dl>

          <Link
            href="/checkout"
            className="focus-ring mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-control bg-nahda-olive px-6 text-base font-bold text-white shadow-[0_10px_24px_rgb(85_114_15_/_0.28)] transition hover:bg-nahda-olive-dark active:translate-y-px"
          >
            Passer commande
          </Link>

          <p className="mt-4 text-xs font-bold leading-5 text-neutral-500">
            Paiements actifs au lancement : paiement à la livraison, paiement
            sur place et demande de devis. Aucun paiement carte ne reste actif.
          </p>

          <Link
            href="/catalogue"
            className="focus-ring mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-control border border-nahda-olive/[0.45] bg-white px-4 text-sm font-black text-nahda-olive-dark transition hover:bg-nahda-olive-soft"
          >
            <ArrowLeft size={17} />
            Continuer mes achats
          </Link>
        </div>
      </aside>
    </div>
  );
}

function CartItemCard({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCart();
  const { product, quantity } = item;
  const atMaxQuantity = quantity >= product.maxQuantity;

  return (
    <article className="premium-card grid gap-4 p-4 md:grid-cols-[132px_minmax(0,1fr)_180px]">
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
        {atMaxQuantity ? (
          <p className="mt-3 text-xs font-black text-nahda-orange">
            Stock limité à {product.maxQuantity} unité(s).
          </p>
        ) : null}
      </div>

      <div className="flex flex-col justify-between gap-4 md:items-end">
        <div className="md:text-right">
          <p className="text-2xl font-black text-nahda-olive-dark">
            {formatMad(product.price * quantity)}
          </p>
          <p className="text-sm font-bold text-neutral-500">
            {formatMad(product.price)} / unité
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="grid h-10 grid-cols-3 overflow-hidden rounded-control border border-border-soft bg-white">
            <button
              type="button"
              aria-label="Réduire la quantité"
              disabled={quantity <= 1}
              onClick={() => updateQuantity(product.id, quantity - 1)}
              className="grid w-10 place-items-center transition hover:bg-surface-muted disabled:opacity-40"
            >
              <Minus size={15} />
            </button>
            <span className="grid w-10 place-items-center text-sm font-black">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Augmenter la quantité"
              disabled={atMaxQuantity}
              onClick={() => updateQuantity(product.id, quantity + 1)}
              className="grid w-10 place-items-center transition hover:bg-surface-muted disabled:opacity-40"
            >
              <Plus size={15} />
            </button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Supprimer du panier"
            onClick={() => removeItem(product.id)}
          >
            <Trash2 size={17} />
          </Button>
        </div>
      </div>
    </article>
  );
}
