import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CataloguePageClient } from "@/components/catalogue/catalogue-page-client";
import { ShopLayout } from "@/components/layout/shop-layout";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { catalogueCategories, getCategoryBySlug } from "@/data/catalogue";
import {
  getPublicCatalogueData,
  getPublicCategoryData,
} from "@/lib/services/public-catalogue";

export function generateStaticParams() {
  return catalogueCategories.map((category) => ({
    slug: category.slug,
  }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoryData = await getPublicCategoryData(slug);

  if (!categoryData.category && !getCategoryBySlug(slug)) {
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
