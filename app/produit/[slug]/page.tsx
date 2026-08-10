import { notFound } from "next/navigation";
import { ShopLayout } from "@/components/layout/shop-layout";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { Container } from "@/components/ui/container";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/seo";
import { getPublicProducts } from "@/lib/services/products";
import { getPublicProductPageData } from "@/lib/services/public-catalogue";
import { getApprovedProductReviews } from "@/lib/services/reviews";
import { getSiteSettings } from "@/lib/settings";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

// Régénération au plus toutes les 5 minutes : stock, prix et avis suivent
// la base sans rebuild.
export const revalidate = 300;

// Pre-rendu des produits reellement publies : l'ancienne version listait le
// catalogue de demonstration et generait des pages sans equivalent en base.
export async function generateStaticParams() {
  const products = await getPublicProducts({ take: 200 });

  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const productData = await getPublicProductPageData(slug);
  const product = productData.product;

  if (!product) {
    return { title: "Produit introuvable" };
  }

  const description = product.specs.join(", ");

  return {
    title: product.name,
    description,
    alternates: { canonical: `/produit/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} | Nahda Smart`,
      description,
      url: `/produit/${product.slug}`,
      images: [{ url: product.image, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Nahda Smart`,
      description,
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [productData, settings] = await Promise.all([
    getPublicProductPageData(slug),
    getSiteSettings(),
  ]);
  const product = productData.product;

  if (!product) {
    notFound();
  }

  const reviews = await getApprovedProductReviews(product.slug).catch(() => ({
    average: null,
    count: 0,
    reviews: [],
  }));

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.specs.join(", "),
    sku: product.id,
    image: [absoluteUrl(product.image)],
    brand: { "@type": "Brand", name: product.brandName },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/produit/${product.slug}`),
      priceCurrency: "MAD",
      price: product.price,
      availability:
        product.stockStatus === "out_of_stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Nahda Smart" },
    },
    // Note publiee uniquement si des avis reels existent : declarer un
    // aggregateRating sans avis est une violation des regles Google.
    ...(reviews.count > 0 && reviews.average
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviews.average,
            reviewCount: reviews.count,
          },
        }
      : {}),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "Catalogue",
        item: absoluteUrl("/catalogue"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: absoluteUrl(`/produit/${product.slug}`),
      },
    ],
  };

  return (
    <ShopLayout>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <Container className="py-8 md:py-10">
        <ProductDetailClient
          product={product}
          relatedProducts={productData.relatedProducts}
          accessoryProducts={productData.accessoryProducts}
          recentProducts={productData.recentProducts}
          whatsappNumber={settings.whatsapp}
          reviews={reviews}
        />
      </Container>
    </ShopLayout>
  );
}
