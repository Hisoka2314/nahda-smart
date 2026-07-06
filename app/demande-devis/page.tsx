import type { Metadata } from "next";
import { QuoteRequestForm } from "@/components/checkout/quote-request-form";
import { ShopLayout } from "@/components/layout/shop-layout";
import { Container } from "@/components/ui/container";
import { getPublicProductPageData } from "@/lib/services/public-catalogue";

export const metadata: Metadata = {
  title: "Demande de devis | Nahda Smart",
  description:
    "Formulaire complet de demande de devis Nahda Smart pour sociétés, écoles, administrations, revendeurs et particuliers.",
};

type QuotePageProps = {
  searchParams: Promise<{
    product?: string;
  }>;
};

export default async function QuotePage({ searchParams }: QuotePageProps) {
  const { product: productSlug } = await searchParams;
  const product = productSlug
    ? (await getPublicProductPageData(productSlug)).product ?? undefined
    : undefined;

  return (
    <ShopLayout>
      <Container className="py-8 md:py-10">
        <QuoteRequestForm product={product} />
      </Container>
    </ShopLayout>
  );
}
