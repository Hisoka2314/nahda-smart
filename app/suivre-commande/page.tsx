import type { Metadata } from "next";
import { OrderTrackingForm } from "@/components/checkout/order-tracking-form";
import { ShopLayout } from "@/components/layout/shop-layout";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Suivre ma commande | Nahda Smart",
  description: "Suivi des commandes Nahda Smart en attente de confirmation.",
};

export default function TrackOrderPage() {
  return (
    <ShopLayout>
      <Container className="py-8 md:py-10">
        <OrderTrackingForm />
      </Container>
    </ShopLayout>
  );
}
