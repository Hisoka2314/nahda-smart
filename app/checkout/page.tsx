import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { ShopLayout } from "@/components/layout/shop-layout";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Checkout hors ligne | Nahda Smart",
  description:
    "Tunnel de commande hors ligne Nahda Smart avec paiement à la livraison ou retrait magasin.",
};

export default function CheckoutPage() {
  return (
    <ShopLayout>
      <Container className="py-8 md:py-10">
        <CheckoutForm />
      </Container>
    </ShopLayout>
  );
}
