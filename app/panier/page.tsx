import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/cart-page-client";
import { ShopLayout } from "@/components/layout/shop-layout";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Panier | Nahda Smart",
  description: "Panier Nahda Smart avec confirmation de commande par notre équipe.",
};

export default function CartPage() {
  return (
    <ShopLayout>
      <Container className="py-8 md:py-10">
        <CartPageClient />
      </Container>
    </ShopLayout>
  );
}
