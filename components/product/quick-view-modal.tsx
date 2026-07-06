"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ExternalLink,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatMad } from "@/lib/utils";
import type { CartProduct } from "@/types/cart";

export type QuickViewProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category?: string;
  image: string;
  description?: string;
  specs: string[];
  price: number;
  oldPrice?: number;
  stockStatus: CartProduct["stockStatus"];
  isPromo?: boolean;
  discountLabel?: string;
  rating?: number;
  reviewCount?: number;
};

type QuickViewModalProps = {
  open: boolean;
  product: QuickViewProduct;
  cartProduct: CartProduct;
  onClose: () => void;
};

const stockLabels = {
  in_stock: "En stock",
  on_order: "Sur commande",
  low_stock: "Stock limité",
  out_of_stock: "Rupture",
} satisfies Record<CartProduct["stockStatus"], string>;

export function QuickViewModal({
  open,
  product,
  cartProduct,
  onClose,
}: QuickViewModalProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState("");
  const canAddToCart = product.stockStatus !== "out_of_stock";
  const maxQuantity = Math.max(cartProduct.maxQuantity, 1);
  const compactSpecs = product.specs.slice(0, 5);

  const handleQuantityChange = (nextQuantity: number) => {
    setQuantity(Math.min(Math.max(Math.floor(nextQuantity), 1), maxQuantity));
  };

  const handleClose = () => {
    setQuantity(1);
    setFeedback("");
    onClose();
  };

  const handleAddToCart = () => {
    const result = addItem(cartProduct, quantity);

    setFeedback(result.message);
    window.setTimeout(() => setFeedback(""), 1800);
  };

  return (
    <Modal
      open={open}
      title="Aperçu rapide"
      size="lg"
      onClose={handleClose}
    >
      <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] border border-border-soft bg-[#f7f9f4] sm:aspect-square">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 220px"
              className="object-cover"
            />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[8px] bg-nahda-olive-soft px-2.5 py-1 text-xs font-black uppercase text-nahda-olive-dark">
              {product.brand}
            </span>
            {product.category ? (
              <span className="rounded-[8px] bg-surface-muted px-2.5 py-1 text-xs font-black text-neutral-600">
                {product.category}
              </span>
            ) : null}
          </div>

          <h3 className="mt-2 text-xl font-black leading-tight text-nahda-ink">
            {product.name}
          </h3>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge
              variant={product.stockStatus === "in_stock" ? "success" : "olive"}
            >
              {stockLabels[product.stockStatus]}
            </Badge>
            {product.discountLabel || product.isPromo ? (
              <Badge variant="promo">
                {product.discountLabel ?? "Promo"}
              </Badge>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {compactSpecs.map((spec) => (
              <span
                key={spec}
                className="rounded-[7px] bg-surface-muted px-2 py-1 text-xs font-bold text-neutral-600"
              >
                {spec}
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-2">
            <span className="text-2xl font-black text-nahda-olive-dark">
              {formatMad(product.price)}
            </span>
            {product.oldPrice ? (
              <span className="pb-1 text-sm text-neutral-400 line-through">
                {formatMad(product.oldPrice)}
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[118px_minmax(0,1fr)]">
            <div className="grid h-11 grid-cols-3 overflow-hidden rounded-control border border-border-soft bg-white">
              <button
                type="button"
                className="grid place-items-center text-nahda-ink transition hover:bg-surface-muted disabled:opacity-40"
                disabled={!canAddToCart || quantity <= 1}
                onClick={() => handleQuantityChange(quantity - 1)}
                aria-label="Réduire la quantité"
              >
                <Minus size={16} />
              </button>
              <span className="grid place-items-center text-sm font-black text-nahda-ink">
                {quantity}
              </span>
              <button
                type="button"
                className="grid place-items-center text-nahda-ink transition hover:bg-surface-muted disabled:opacity-40"
                disabled={!canAddToCart || quantity >= maxQuantity}
                onClick={() => handleQuantityChange(quantity + 1)}
                aria-label="Augmenter la quantité"
              >
                <Plus size={16} />
              </button>
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className="w-full"
            >
              <ShoppingCart size={17} />
              {canAddToCart ? "Ajouter au panier" : "Produit indisponible"}
            </Button>
          </div>

          {feedback ? (
            <p className="mt-3 rounded-[9px] bg-nahda-olive-soft px-3 py-2 text-sm font-black text-nahda-olive-dark">
              {feedback}
            </p>
          ) : null}

          <div className="mt-3 grid gap-2">
            <Link
              href={`/produit/${product.slug}`}
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-control border border-nahda-olive/[0.45] bg-white px-3 text-sm font-black text-nahda-olive-dark transition hover:bg-nahda-olive-soft"
              onClick={handleClose}
            >
              <ExternalLink size={16} />
              Voir le produit
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
