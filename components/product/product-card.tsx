"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeftRight, Eye, Heart, ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { useCompare } from "@/components/compare/compare-provider";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { QuickViewModal } from "@/components/product/quick-view-modal";
import { BrandMark } from "@/components/shop/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { productCardToCartProduct } from "@/lib/cart";
import { formatMad } from "@/lib/utils";
import type { Product } from "@/types/product";

const statusLabel = {
  in_stock: "En stock",
  on_order: "Sur commande",
  low_stock: "Stock limité",
  out_of_stock: "Rupture",
} satisfies Record<Product["status"], string>;

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const { addItem } = useCart();
  const favorites = useFavorites();
  const compare = useCompare();
  const cartProduct = productCardToCartProduct(product);
  const favorite = favorites.has(product.id);
  const compared = compare.has(product.id);

  const stopProductAction = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleAddToCart = (event?: MouseEvent<HTMLElement>) => {
    if (event) {
      stopProductAction(event);
    }

    const result = addItem(cartProduct);

    setFeedback(result.message);
    setAdded(true);
    window.setTimeout(() => {
      setAdded(false);
      setFeedback("");
    }, 1600);
  };

  const handleQuickView = (event: MouseEvent<HTMLButtonElement>) => {
    stopProductAction(event);
    setQuickViewOpen(true);
  };

  const handleFavorite = (event: MouseEvent<HTMLButtonElement>) => {
    stopProductAction(event);
    const result = favorites.toggle(cartProduct);

    setFeedback(result.message);
    window.setTimeout(() => setFeedback(""), 1400);
  };

  const handleCompare = (event: MouseEvent<HTMLButtonElement>) => {
    stopProductAction(event);
    const result = compare.toggle(cartProduct);

    setFeedback(result.message);
    window.setTimeout(() => setFeedback(""), 1400);
  };

  const productBrand = {
    name: product.brand,
    slug: product.brandSlug ?? product.brand.toLowerCase().replace(/\s+/g, "-"),
    logoPath: product.brandLogoPath,
    fallbackLabel: product.brand,
    isOfficialAsset: Boolean(product.brandLogoPath),
  };

  return (
    <motion.article
      className="premium-card group relative overflow-hidden p-3.5"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="absolute left-4 top-4 z-10 flex gap-2">
        <Badge
          variant={
            product.status === "in_stock"
              ? "success"
              : product.status === "out_of_stock"
                ? "danger"
                : "olive"
          }
        >
          {statusLabel[product.status]}
        </Badge>
        {product.discountLabel ? (
          <Badge variant="promo">{product.discountLabel}</Badge>
        ) : product.isPromo ? (
          <Badge variant="promo">Promo</Badge>
        ) : null}
      </div>

      <Link
        href={`/produit/${product.slug}`}
        className="focus-ring relative block aspect-[4/3] overflow-hidden rounded-[10px] border border-border-soft bg-[#f7f9f4]"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 24vw"
          className={`object-cover transition duration-500 group-hover:scale-105 ${
            product.status === "out_of_stock" ? "opacity-45 grayscale" : ""
          }`}
        />
        {/* Bandeau explicite : le badge seul passait inapercu dans une grille
            de produits, et le client comprenait la rupture au clic. */}
        {product.status === "out_of_stock" ? (
          <span className="absolute inset-x-0 bottom-0 bg-[#a11212]/90 py-1.5 text-center text-xs font-black uppercase tracking-wide text-white">
            Rupture de stock
          </span>
        ) : null}
        <BrandMark
          brand={productBrand}
          compact
          className="absolute bottom-3 right-3 max-w-[118px] backdrop-blur"
        />
      </Link>

      <div className="pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase text-nahda-olive">
            {product.brand}
          </p>
          {product.rating ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-500">
              <Star size={13} className="fill-[#f7b500] text-[#f7b500]" />
              {product.rating}
            </span>
          ) : null}
        </div>
        <Link
          href={`/produit/${product.slug}`}
          className="mt-1 block min-h-[48px] text-base font-black leading-6 text-nahda-ink transition hover:text-nahda-olive"
        >
          {product.name}
        </Link>
        <div className="mt-2.5 flex min-h-[46px] flex-wrap content-start gap-1.5">
          {product.specs.slice(0, 4).map((spec) => (
            <span
              key={spec}
              className="max-w-full truncate rounded-[7px] bg-surface-muted px-2 py-1 text-[11px] font-bold text-neutral-600"
            >
              {spec}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-end gap-2">
          <span className="text-xl font-black text-nahda-olive-dark">
            {formatMad(product.price)}
          </span>
          {product.compareAtPrice ? (
            <span className="pb-0.5 text-sm text-neutral-400 line-through">
              {formatMad(product.compareAtPrice)}
            </span>
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-[1fr_42px_42px_42px] gap-2">
          <Button
            aria-label={`Ajouter ${product.name} au panier`}
            onClick={handleAddToCart}
            variant={added && feedback ? "secondary" : "primary"}
            disabled={product.status === "out_of_stock"}
          >
            <ShoppingCart size={17} />
            <span className="hidden sm:inline">
              {product.status === "out_of_stock"
                ? "Rupture"
                : added
                  ? "Ajouté"
                  : "Panier"}
            </span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Aperçu rapide"
            onClick={handleQuickView}
          >
            <Eye size={17} />
          </Button>
          <Button
            variant={compared ? "secondary" : "outline"}
            size="icon"
            aria-label="Comparer"
            onClick={handleCompare}
          >
            <ArrowLeftRight size={17} />
          </Button>
          <Button
            variant={favorite ? "secondary" : "outline"}
            size="icon"
            aria-label="Ajouter aux favoris"
            onClick={handleFavorite}
          >
            <Heart
              size={17}
              className={favorite ? "fill-nahda-olive text-nahda-olive" : ""}
            />
          </Button>
        </div>
        {feedback ? (
          <p className="mt-2 text-xs font-bold text-nahda-olive-dark">
            {feedback}
          </p>
        ) : null}
      </div>

      <QuickViewModal
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        cartProduct={cartProduct}
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          category: product.category,
          image: product.image,
          description: product.description,
          specs: product.specs,
          price: product.price,
          oldPrice: product.compareAtPrice,
          stockStatus: product.status,
          isPromo: product.isPromo,
          discountLabel: product.discountLabel,
          rating: product.rating,
          reviewCount: product.reviewCount,
        }}
      />
    </motion.article>
  );
}
