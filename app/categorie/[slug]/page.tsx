import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CataloguePageClient } from "@/components/catalogue/catalogue-page-client";
import { ShopLayout } from "@/components/layout/shop-layout";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { getPublicCategories } from "@/lib/services/categories";
import {
  getPublicCatalogueData,
  getPublicCategoryData,
} from "@/lib/services/public-catalogue";

// Régénération au plus toutes les 5 minutes : stock, prix et avis suivent
// la base sans rebuild.
export const revalidate = 300;

// Les pages pre-rendues suivent les categories reellement publiees : l'ancien
// generateStaticParams listait les categories de demonstration, ce qui
// pre-generait des pages sans equivalent en base.
export async function generateStaticParams() {
  const categories = await getPublicCategories();

  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { category } = await getPublicCategoryData(slug);

  if (!category) return { title: "Catégorie introuvable" };

  const description =
    category.description?.trim() ||
    `Découvrez la sélection ${category.name} de Nahda Smart : prix, stock et fiches détaillées.`;

  return {
    title: category.name,
    description,
    alternates: { canonical: `/categorie/${slug}` },
    openGraph: {
      title: `${category.name} | Nahda Smart`,
      description,
      url: `/categorie/${slug}`,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoryData = await getPublicCategoryData(slug);

  if (!categoryData.category) {
    notFound();
  }

  const catalogueData = await getPublicCatalogueData({ categorySlug: slug });

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
          categorySlug={slug}
          products={catalogueData.products}
          categories={catalogueData.categories}
          filterGroups={catalogueData.filterGroups}
        />
      </Suspense>
    </ShopLayout>
  );
}
