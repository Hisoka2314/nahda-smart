"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftRight, Eye, Heart, ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { QuickViewModal } from "@/components/product/quick-view-modal";
import { BrandMark } from "@/components/shop/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { brandSlugMap } from "@/data/brands";
import { catalogProductToCartProduct } from "@/lib/cart";
import {
  getBrandFallbackLabel,
  getBrandName,
  getCategoryName,
  getDiscountLabel,
  stockStatusLabels,
} from "@/lib/catalogue";
import { formatMad } from "@/lib/utils";
import type { CatalogProduct } from "@/types/catalogue";

type CatalogueProductRowProps = {
  product: CatalogProduct;
};

export function CatalogueProductRow({ product }: CatalogueProductRowProps) {
  const [added, setAdded] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [compared, setCompared] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const { addItem } = useCart();
  const cartProduct = catalogProductToCartProduct(product);
  const brand = brandSlugMap[product.brandSlug];
  const brandMark = {
    name: product.brandName ?? brand?.name ?? getBrandName(product.brandSlug),
    slug: product.brandSlug,
    logoPath: product.brandIsOfficialAsset ? product.brandLogoPath : brand?.logoPath,
    fallbackLabel: brand?.fallbackLabel ?? getBrandFallbackLabel(product.brandSlug),
    isOfficialAsset: Boolean(
      product.brandIsOfficialAsset
        ? product.brandLogoPath
        : brand?.logoPath && brand.isOfficialAsset,
    ),
  };

  const stopProductAction = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const addToCart = (event?: MouseEvent<HTMLElement>) => {
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

  const openQuickView = (event: MouseEvent<HTMLButtonElement>) => {
    stopProductAction(event);
    setQuickViewOpen(true);
  };

  const toggleCompare = (event: MouseEvent<HTMLButtonElement>) => {
    stopProductAction(event);
    const nextCompared = !compared;

    setCompared(nextCompared);
    setFeedback(
      nextCompared
        ? "Produit ajouté au comparateur."
        : "Produit retiré du comparateur.",
    );
    window.setTimeout(() => setFeedback(""), 1400);
  };

  const toggleFavorite = (event: MouseEvent<HTMLButtonElement>) => {
    stopProductAction(event);
    const nextFavorite = !favorite;

    setFavorite(nextFavorite);
    setFeedback(
      nextFavorite ? "Produit ajouté aux favoris." : "Produit retiré des favoris.",
    );
    window.setTimeout(() => setFeedback(""), 1400);
  };

  return (
    <article className="premium-card group grid gap-4 overflow-hidden p-3 transition hover:-translate-y-0.5 hover:border-nahda-olive/[0.42] hover:shadow-premium md:grid-cols-[210px_minmax(0,1fr)_190px]">
      <Link
        href={`/produit/${product.slug}`}
        className="focus-ring relative block aspect-[4/3] overflow-hidden rounded-[10px] border border-border-soft bg-[#f7f9f4] md:aspect-auto md:min-h-[176px]"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 230px"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge
            variant={product.stockStatus === "in_stock" ? "success" : "olive"}
          >
            {stockStatusLabels[product.stockStatus]}
          </Badge>
          {product.isPromo ? <Badge variant="promo">Promo</Badge> : null}
        </div>
      </Link>

      <div className="min-w-0 py-1">
        <div className="flex flex-wrap items-center gap-3">
          <BrandMark brand={brandMark} compact />
          <span className="rounded-[8px] bg-surface-muted px-2.5 py-1 text-xs font-black text-neutral-600">
            {getCategoryName(product.categorySlug)}
          </span>
          {product.isNew ? (
            <Badge variant="olive" className="normal-case">
              Nouveau
            </Badge>
          ) : null}
        </div>

        <Link
          href={`/produit/${product.slug}`}
          className="mt-3 block text-xl font-black leading-tight text-nahda-ink transition hover:text-nahda-olive"
        >
          {product.name}
        </Link>
        {product.reviewCount > 0 ? (
          <div className="mt-2 flex items-center gap-2 text-sm font-bold text-neutral-600">
            <Star size={15} className="fill-[#f7b500] text-[#f7b500]" />
            <span>{product.rating.toFixed(1)}</span>
            <span className="text-neutral-400">
              ({product.reviewCount} avis)
            </span>
          </div>
        ) : (
          <p className="mt-2 text-sm font-bold text-neutral-400">
            Pas encore d&apos;avis
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {product.specs.slice(0, 6).map((spec) => (
            <span
              key={spec}
              className="rounded-[7px] bg-surface-muted px-2 py-1 text-xs font-bold text-neutral-600"
            >
              {spec}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-[10px] border border-border-soft bg-white p-4 md:text-right">
        <div className="flex items-end gap-2 md:justify-end">
          <span className="text-2xl font-black text-nahda-olive-dark">
            {formatMad(product.price)}
          </span>
          {product.oldPrice ? (
            <span className="pb-1 text-sm text-neutral-400 line-through">
              {formatMad(product.oldPrice)}
            </span>
          ) : null}
        </div>
        {getDiscountLabel(product) ? (
          <p className="mt-1 text-sm font-black text-nahda-orange">
            {getDiscountLabel(product)}
          </p>
        ) : null}
        <div className="mt-4 grid grid-cols-[1fr_42px_42px_42px] gap-2 md:grid-cols-2">
          <Button
            className="md:col-span-2"
            onClick={addToCart}
            disabled={product.stockStatus === "out_of_stock"}
            variant={added && feedback ? "secondary" : "primary"}
          >
            <ShoppingCart size={17} />
            {product.stockStatus === "out_of_stock"
              ? "Rupture"
              : added
                ? "Ajouté"
                : "Panier"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Aperçu rapide"
            onClick={openQuickView}
          >
            <Eye size={17} />
          </Button>
          <Button
            variant={compared ? "secondary" : "outline"}
            size="icon"
            aria-label="Comparer"
            onClick={toggleCompare}
          >
            <ArrowLeftRight size={17} />
          </Button>
          <Button
            variant={favorite ? "secondary" : "outline"}
            size="icon"
            aria-label="Favoris"
            onClick={toggleFavorite}
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
          brand: getBrandName(product.brandSlug),
          category: getCategoryName(product.categorySlug),
          image: product.image,
          description: product.specs.join(" · "),
          specs: product.specs,
          price: product.price,
          oldPrice: product.oldPrice,
          stockStatus: product.stockStatus,
          isPromo: product.isPromo,
          discountLabel: getDiscountLabel(product),
          rating: product.rating,
          reviewCount: product.reviewCount,
        }}
      />
    </article>
  );
}
