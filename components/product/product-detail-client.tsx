"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  CheckCircle2,
  Heart,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { useCompare } from "@/components/compare/compare-provider";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { BrandMark } from "@/components/shop/brand-mark";
import { SectionCarousel } from "@/components/shop/section-carousel";
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
import {
  buildWhatsappUrl,
  getProductDescription,
  getProductGallery,
  getProductHighlights,
  getProductRecommendedUsage,
  getTechnicalSections,
} from "@/lib/product";
import { formatMad } from "@/lib/utils";
import type { CatalogProduct } from "@/types/catalogue";
import type { Product } from "@/types/product";
import type { TechnicalSection } from "@/lib/product";
import type { PublicProductReviews } from "@/lib/services/reviews";

type ProductDetailClientProps = {
  product: CatalogProduct;
  relatedProducts: Product[];
  accessoryProducts: Product[];
  recentProducts: Product[];
  whatsappNumber?: string;
  reviews: PublicProductReviews;
};

const tabs = [
  "Description",
  "Fiche technique",
  "Livraison",
  "Garantie & SAV",
  "Avis clients",
] as const;

type ProductTab = (typeof tabs)[number];

export function ProductDetailClient({
  product,
  relatedProducts,
  accessoryProducts,
  recentProducts,
  whatsappNumber,
  reviews,
}: ProductDetailClientProps) {
  const gallery = useMemo(() => getProductGallery(product), [product]);
  const highlights = useMemo(() => getProductHighlights(product), [product]);
  const technicalSections = useMemo(() => getTechnicalSections(product), [product]);
  const cartProduct = useMemo(() => catalogProductToCartProduct(product), [product]);
  const { addItem } = useCart();
  const favorites = useFavorites();
  const compare = useCompare();
  const [selectedImage, setSelectedImage] = useState(gallery[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<ProductTab>("Description");
  const [feedback, setFeedback] = useState("");
  const favorite = favorites.has(product.id);
  const compared = compare.has(product.id);
  const brand = brandSlugMap[product.brandSlug];
  const discountLabel = getDiscountLabel(product);
  const canAddToCart = product.stockStatus !== "out_of_stock";
  const estimatedTotal = product.price * quantity + 30;
  const whatsappUrl = buildWhatsappUrl(
    product,
    `/produit/${product.slug}`,
    whatsappNumber,
  );
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

  const handleQuantityChange = (nextQuantity: number) => {
    setQuantity(Math.min(Math.max(nextQuantity, 1), cartProduct.maxQuantity || 1));
  };

  const handleAddToCart = () => {
    const result = addItem(cartProduct, quantity);
    setFeedback(result.message);
    window.setTimeout(() => setFeedback(""), 1800);
  };

  const handleToggleFavorite = () => {
    const result = favorites.toggle(cartProduct);
    setFeedback(result.message);
    window.setTimeout(() => setFeedback(""), 1800);
  };

  const handleToggleCompare = () => {
    const result = compare.toggle(cartProduct);
    setFeedback(result.message);
    window.setTimeout(() => setFeedback(""), 1800);
  };

  return (
    <div className="pb-44 lg:pb-0">
      <nav
        aria-label="Fil d'Ariane"
        className="mb-5 flex flex-wrap items-center gap-2 text-sm font-bold text-neutral-500"
      >
        <Link href="/" className="transition hover:text-nahda-olive">
          Accueil
        </Link>
        <span>/</span>
        <Link href="/catalogue" className="transition hover:text-nahda-olive">
          Catalogue
        </Link>
        <span>/</span>
        <Link
          href={`/categorie/${product.categorySlug}`}
          className="transition hover:text-nahda-olive"
        >
          {getCategoryName(product.categorySlug)}
        </Link>
        <span>/</span>
        <span className="text-nahda-ink">{product.name}</span>
      </nav>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.9fr)_340px]">
        <ProductGallery
          productName={product.name}
          gallery={gallery}
          selectedImage={selectedImage}
          onSelect={setSelectedImage}
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                product.stockStatus === "in_stock"
                  ? "success"
                  : product.stockStatus === "out_of_stock"
                    ? "danger"
                    : "olive"
              }
            >
              {stockStatusLabels[product.stockStatus]}
            </Badge>
            {product.isPromo ? <Badge variant="promo">Promo</Badge> : null}
            {product.isNew ? <Badge variant="olive">Nouveau</Badge> : null}
            <span className="min-w-0 max-w-full break-all rounded-[8px] bg-surface-muted px-2.5 py-1 text-xs font-black text-neutral-600">
              SKU : {product.id.toUpperCase()}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <BrandMark brand={brandMark} compact />
            <span className="text-sm font-bold text-neutral-500">
              {getCategoryName(product.categorySlug)}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-black leading-tight text-nahda-ink md:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-bold text-neutral-600">
            {product.reviewCount > 0 ? (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <Star size={16} className="fill-[#f7b500] text-[#f7b500]" />
                  {product.rating.toFixed(1)}
                </span>
                <span>({product.reviewCount} avis)</span>
              </>
            ) : (
              <span className="text-neutral-400">Pas encore d&apos;avis</span>
            )}
            <button
              type="button"
              className="text-nahda-olive-dark underline-offset-4 transition hover:underline"
              onClick={() => setActiveTab("Avis clients")}
            >
              Ajouter un avis
            </button>
          </div>

          <p className="mt-4 text-base leading-7 text-neutral-700">
            {getProductDescription(product)}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {highlights.map((highlight) => (
              <span
                key={highlight}
                className="rounded-[9px] bg-nahda-olive-soft px-3 py-1.5 text-sm font-black text-nahda-olive-dark"
              >
                {highlight}
              </span>
            ))}
          </div>

          <div className="mt-6 rounded-card border border-border-soft bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-end gap-3">
              <span className="text-4xl font-black text-nahda-olive-dark">
                {formatMad(product.price)}
              </span>
              {product.oldPrice ? (
                <span className="pb-1 text-lg text-neutral-400 line-through">
                  {formatMad(product.oldPrice)}
                </span>
              ) : null}
              {discountLabel ? (
                <Badge variant="promo" className="mb-1">
                  {discountLabel}
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 text-sm font-bold text-neutral-500">
              Tous les prix sont affichés en DH. La commande sera confirmée par
              notre équipe.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-[130px_minmax(0,1fr)]">
              <div className="grid h-12 grid-cols-3 overflow-hidden rounded-control border border-border-soft bg-white">
                <button
                  type="button"
                  className="grid place-items-center text-nahda-ink transition hover:bg-surface-muted disabled:opacity-40"
                  disabled={quantity <= 1}
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
                  disabled={!canAddToCart || quantity >= cartProduct.maxQuantity}
                  onClick={() => handleQuantityChange(quantity + 1)}
                  aria-label="Augmenter la quantité"
                >
                  <Plus size={16} />
                </button>
              </div>
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={!canAddToCart}
              >
                <ShoppingCart size={19} />
                {canAddToCart ? "Ajouter au panier" : "Produit en rupture"}
              </Button>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-control border border-[#25d366]/40 bg-white px-4 text-sm font-black text-[#1a7f3c] transition hover:bg-[#eefbf3]"
              >
                <MessageCircle size={18} />
                Commander via WhatsApp
              </a>
              <Link
                href={`/demande-devis?product=${product.slug}`}
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-control border border-nahda-olive/[0.45] bg-white px-4 text-sm font-black text-nahda-olive-dark transition hover:bg-nahda-olive-soft"
              >
                <PackageCheck size={18} />
                Demander un devis
              </Link>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Button
                variant={favorite ? "secondary" : "outline"}
                onClick={handleToggleFavorite}
              >
                <Heart
                  size={18}
                  className={favorite ? "fill-nahda-olive text-nahda-olive" : ""}
                />
                {favorite ? "Dans les favoris" : "Favoris"}
              </Button>
              <Button
                variant={compared ? "secondary" : "outline"}
                onClick={handleToggleCompare}
              >
                <ArrowLeftRight size={18} />
                {compared ? "Dans le comparateur" : "Comparer"}
              </Button>
            </div>

            {feedback ? (
              <p className="mt-3 rounded-[9px] bg-nahda-olive-soft px-3 py-2 text-sm font-black text-nahda-olive-dark">
                {feedback}
              </p>
            ) : null}
          </div>
        </div>

        <ConfidencePanel
          quantity={quantity}
          estimatedTotal={estimatedTotal}
          product={product}
        />
      </section>

      <ProductTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        product={product}
        technicalSections={technicalSections}
        reviews={reviews}
      />

      <ProductSlider title="Produits similaires" products={relatedProducts} />
      <ProductSlider
        title="Accessoires recommandés"
        products={accessoryProducts}
      />
      <ProductSlider title="Produits récemment vus" products={recentProducts} />

      <div className="fixed inset-x-0 bottom-[74px] z-30 border-t border-border-soft bg-white/95 p-3 shadow-[0_-14px_30px_rgb(20_31_8_/_0.12)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-[1fr_44px_44px] gap-2">
          <Button onClick={handleAddToCart} disabled={!canAddToCart}>
            <ShoppingCart size={18} />
            {canAddToCart ? formatMad(product.price) : "Rupture"}
          </Button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Commander via WhatsApp"
            className="focus-ring grid h-11 place-items-center rounded-control border border-[#25d366]/40 bg-white text-[#1a7f3c]"
          >
            <MessageCircle size={19} />
          </a>
          <Link
            href={`/demande-devis?product=${product.slug}`}
            aria-label="Demander un devis"
            className="focus-ring grid h-11 place-items-center rounded-control border border-nahda-olive/[0.45] bg-white text-nahda-olive-dark"
          >
            <PackageCheck size={19} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProductGallery({
  productName,
  gallery,
  selectedImage,
  onSelect,
}: {
  productName: string;
  gallery: string[];
  selectedImage: string;
  onSelect: (image: string) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[82px_minmax(0,1fr)] xl:sticky xl:top-[170px] xl:self-start">
      <div className="order-2 flex gap-2 overflow-x-auto pb-1 md:order-1 md:flex-col md:overflow-visible">
        {gallery.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => onSelect(image)}
            className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-[10px] border bg-white transition ${
              image === selectedImage
                ? "border-nahda-olive shadow-card"
                : "border-border-soft hover:border-nahda-olive/[0.45]"
            }`}
            aria-label={`Afficher l'image ${index + 1}`}
          >
            <Image
              src={image}
              alt={`${productName} miniature ${index + 1}`}
              fill
              sizes="80px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
      <motion.div
        key={selectedImage}
        className="relative order-1 aspect-[4/3] min-h-[240px] overflow-hidden rounded-card border border-border-soft bg-[#f7f9f4] shadow-card sm:min-h-[300px] md:order-2"
        initial={{ opacity: 0.88 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22 }}
      >
        <Image
          src={selectedImage}
          alt={productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 48vw"
          className="object-cover transition duration-500 hover:scale-[1.035]"
        />
        <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-nahda-ink shadow-card">
          Zoom léger au survol
        </div>
      </motion.div>
    </div>
  );
}

function ConfidencePanel({
  product,
  quantity,
  estimatedTotal,
}: {
  product: CatalogProduct;
  quantity: number;
  estimatedTotal: number;
}) {
  const trustItems = [
    {
      icon: Truck,
      title: "Livraison partout au Maroc",
      detail: "Livraison placeholder à partir de 30 DH",
    },
    {
      icon: Store,
      title: "Retrait sur place",
      detail: "Disponibilité à confirmer en magasin",
    },
    {
      icon: CheckCircle2,
      title: "Paiement à la livraison",
      detail: "Aucun paiement en ligne au lancement",
    },
    {
      icon: ShieldCheck,
      title: "Garantie & SAV",
      detail: `${product.warranty} avec support expert`,
    },
  ];

  return (
    <aside className="xl:sticky xl:top-[170px] xl:self-start">
      <div className="overflow-hidden rounded-card border border-border-soft bg-white shadow-premium">
        <div className="bg-nahda-ink px-5 py-4 text-white">
          <p className="text-lg font-black">Acheter en toute confiance</p>
          <p className="mt-1 text-sm text-white/70">
            Votre commande sera confirmée par notre équipe.
          </p>
        </div>

        <div className="grid gap-4 p-5">
          {trustItems.map((item) => (
            <div key={item.title} className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-nahda-olive-soft text-nahda-olive">
                <item.icon size={20} />
              </span>
              <div>
                <p className="text-sm font-black text-nahda-ink">{item.title}</p>
                <p className="mt-1 text-sm leading-5 text-neutral-600">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border-soft p-5">
          <div className="flex justify-between gap-4 text-sm font-bold text-neutral-600">
            <span>Quantité</span>
            <span>{quantity}</span>
          </div>
          <div className="mt-3 flex justify-between gap-4 text-sm font-bold text-neutral-600">
            <span>Livraison</span>
            <span>À partir de 30 DH</span>
          </div>
          <div className="mt-4 flex items-end justify-between gap-4">
            <span className="text-base font-black text-nahda-ink">
              Total estimé
            </span>
            <span className="text-2xl font-black text-nahda-olive-dark">
              {formatMad(estimatedTotal)}
            </span>
          </div>
          <Link
            href="/panier"
            className="focus-ring mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-control bg-nahda-olive px-4 text-sm font-black text-white shadow-[0_10px_24px_rgb(85_114_15_/_0.28)] transition hover:bg-nahda-olive-dark"
          >
            <ShoppingCart size={18} />
            Voir le panier
          </Link>
          <p className="mt-3 text-center text-xs font-bold text-neutral-500">
            Paiement actif : livraison ou retrait sur place.
          </p>
        </div>
      </div>
    </aside>
  );
}

function ProductTabs({
  activeTab,
  onChange,
  product,
  technicalSections,
  reviews,
}: {
  activeTab: ProductTab;
  onChange: (tab: ProductTab) => void;
  product: CatalogProduct;
  technicalSections: ReturnType<typeof getTechnicalSections>;
  reviews: PublicProductReviews;
}) {
  return (
    <section className="mt-10 rounded-card border border-border-soft bg-white shadow-card">
      <div className="hide-scrollbar flex overflow-x-auto border-b border-border-soft">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`min-h-14 shrink-0 px-4 text-sm font-black transition md:px-5 ${
              tab === activeTab
                ? "border-b-2 border-nahda-olive text-nahda-olive-dark"
                : "text-neutral-500 hover:bg-surface-muted hover:text-nahda-ink"
            }`}
            onClick={() => onChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-5 md:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === "Description" ? (
              <DescriptionTab product={product} />
            ) : null}
            {activeTab === "Fiche technique" ? (
              <TechnicalTab sections={technicalSections} />
            ) : null}
            {activeTab === "Livraison" ? <DeliveryTab /> : null}
            {activeTab === "Garantie & SAV" ? (
              <WarrantyTab product={product} />
            ) : null}
            {activeTab === "Avis clients" ? (
              <ProductReviews productSlug={product.slug} reviews={reviews} />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function DescriptionTab({ product }: { product: CatalogProduct }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div>
        <h2 className="text-xl font-black text-nahda-ink">
          Une solution fiable pour vos besoins tech
        </h2>
        <p className="mt-3 leading-7 text-neutral-700">
          {getProductDescription(product)}
        </p>
        <p className="mt-3 leading-7 text-neutral-700">
          Usage recommandé : {getProductRecommendedUsage(product)}. Notre équipe
          peut confirmer la disponibilité, proposer une alternative compatible
          ou préparer un devis pour société, école ou administration.
        </p>
      </div>
      <div className="rounded-card bg-nahda-olive-soft p-5">
        <p className="text-sm font-black uppercase text-nahda-olive-dark">
          Points forts
        </p>
        <ul className="mt-3 grid gap-2 text-sm font-bold text-neutral-700">
          {product.specs.map((spec) => (
            <li key={spec} className="flex gap-2">
              <CheckCircle2 size={16} className="mt-0.5 text-nahda-olive" />
              <span>{spec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TechnicalTab({ sections }: { sections: TechnicalSection[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {sections.map((section) => (
        <div
          key={section.title}
          className="overflow-hidden rounded-[10px] border border-border-soft"
        >
          <div className="bg-surface-muted px-4 py-3">
            <h3 className="text-sm font-black uppercase text-nahda-ink">
              {section.title}
            </h3>
          </div>
          <dl className="divide-y divide-border-soft">
            {section.items.map((item) => (
              <div
                key={`${section.title}-${item.label}`}
                className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[170px_minmax(0,1fr)]"
              >
                <dt className="font-bold text-neutral-500">{item.label}</dt>
                <dd className="min-w-0 font-black text-nahda-ink">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

function DeliveryTab() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[
        ["Livraison partout au Maroc", "Livraison placeholder à partir de 30 DH après confirmation."],
        ["Retrait sur place", "Retrait magasin possible selon disponibilité et validation par notre équipe."],
        ["Commande confirmée", "Nahda Smart contacte le client avant toute préparation finale."],
      ].map(([title, detail]) => (
        <div key={title} className="rounded-card border border-border-soft p-5">
          <p className="font-black text-nahda-ink">{title}</p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">{detail}</p>
        </div>
      ))}
    </div>
  );
}

function WarrantyTab({ product }: { product: CatalogProduct }) {
  return (
    <div className="rounded-card bg-surface-muted p-5">
      <p className="text-lg font-black text-nahda-ink">
        Garantie {product.warranty} et support expert
      </p>
      <p className="mt-3 leading-7 text-neutral-700">
        Les conditions exactes seront confirmées par notre équipe Nahda Smart au
        moment de la commande. Le SAV peut orienter vers un remplacement, une
        réparation ou une alternative selon le statut du produit et la garantie
        applicable.
      </p>
    </div>
  );
}

function ProductSlider({
  title,
  products,
}: {
  title: string;
  products: Product[];
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase text-nahda-olive">
            Nahda Smart
          </p>
          <h2 className="text-2xl font-black text-nahda-ink">{title}</h2>
        </div>
      </div>
      <SectionCarousel ariaLabel={title}>
        {products.map((item) => (
          <div
            key={item.id}
            className="w-[276px] flex-none snap-start sm:w-[300px]"
          >
            <ProductCard product={item} />
          </div>
        ))}
      </SectionCarousel>
    </section>
  );
}
