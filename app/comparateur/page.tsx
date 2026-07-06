import type { Metadata } from "next";
import { ComparePageClient } from "@/components/compare/compare-page-client";
import { ShopLayout } from "@/components/layout/shop-layout";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Comparateur | Nahda Smart",
  description:
    "Comparez côte à côte les produits Nahda Smart que vous avez sélectionnés sur cet appareil.",
};

export default function ComparatorPage() {
  return (
    <ShopLayout>
      <Container className="py-8 md:py-10">
        <ComparePageClient />
      </Container>
    </ShopLayout>
  );
}
