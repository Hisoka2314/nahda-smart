import type { Metadata } from "next";
import { FavoritesPageClient } from "@/components/favorites/favorites-page-client";
import { ShopLayout } from "@/components/layout/shop-layout";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Favoris | Nahda Smart",
  description:
    "Retrouvez les produits Nahda Smart que vous avez ajoutés à vos favoris sur cet appareil.",
};

export default function FavoritesPage() {
  return (
    <ShopLayout>
      <Container className="py-8 md:py-10">
        <FavoritesPageClient />
      </Container>
    </ShopLayout>
  );
}
