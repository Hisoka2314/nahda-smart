import type { Metadata } from "next";
import { OrderSuccess } from "@/components/checkout/order-success";
import { ShopLayout } from "@/components/layout/shop-layout";
import { Container } from "@/components/ui/container";
import { getPublicOrderByNumber } from "@/lib/services/orders";

export const metadata: Metadata = {
  title: "Commande reçue | Nahda Smart",
  description:
    "Confirmation de commande Nahda Smart avec statut en attente de confirmation.",
};

type ConfirmedOrderPageProps = {
  searchParams: Promise<{
    order?: string;
    orderNumber?: string;
  }>;
};

export default async function ConfirmedOrderPage({
  searchParams,
}: ConfirmedOrderPageProps) {
  const { order, orderNumber } = await searchParams;
  const number = orderNumber ?? order;
  const confirmedOrder = number ? await getPublicOrderByNumber(number) : null;

  return (
    <ShopLayout>
      <Container className="py-8 md:py-10">
        <OrderSuccess order={confirmedOrder} />
      </Container>
    </ShopLayout>
  );
}
