import { Suspense } from "react";
import type { Metadata } from "next";
import { CataloguePageClient } from "@/components/catalogue/catalogue-page-client";
import { ShopLayout } from "@/components/layout/shop-layout";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { getPublicCatalogueData } from "@/lib/services/public-catalogue";

export const metadata: Metadata = {
  title: "Catalogue complet",
  description:
    "Tout le matériel Nahda Smart : PC portables et bureau, réseau, vidéosurveillance, télécommunication et accessoires. Prix, stock et fiches détaillées.",
  alternates: { canonical: "/catalogue" },
  openGraph: {
    title: "Catalogue complet | Nahda Smart",
    description:
      "PC, réseau, sécurité et accessoires : parcourez tout le catalogue Nahda Smart.",
    url: "/catalogue",
  },
};

type CataloguePageProps = {
  searchParams: Promise<{
    category?: string;
    q?: string;
  }>;
};

export default async function CataloguePage({ searchParams }: CataloguePageProps) {
  const params = await searchParams;
  const selectedCategorySlugs = splitParam(params.category);
  const catalogueData = await getPublicCatalogueData({
    selectedCategorySlugs,
    query: params.q,
  });

  return (
    <ShopLayout>
      <Suspense
        fallback={
          <main className="bg-background py-10">
            <div className="mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-8">
              <LoadingSkeleton className="h-[420px]" />
            </div>
          </main>
        }
      >
        <CataloguePageClient
          products={catalogueData.products}
          categories={catalogueData.categories}
          filterGroups={catalogueData.filterGroups}
        />
      </Suspense>
    </ShopLayout>
  );
}

function splitParam(value?: string) {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}
