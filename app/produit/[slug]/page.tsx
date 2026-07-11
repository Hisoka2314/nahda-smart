import { notFound } from "next/navigation";
import { ShopLayout } from "@/components/layout/shop-layout";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { Container } from "@/components/ui/container";
import { catalogueProducts } from "@/data/catalogue";
import { getProductBySlug as getMockProductBySlug } from "@/lib/product";
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

export function generateStaticParams() {
  return catalogueProducts.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const productData = await getPublicProductPageData(slug);
  const product = productData.product ?? getMockProductBySlug(slug);

  if (!product) {
    return {
      title: "Produit introuvable | Nahda Smart",
    };
  }

  return {
    title: `${product.name} | Nahda Smart`,
    description: product.specs.join(", "),
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

  return (
    <ShopLayout>
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
