import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  deliveryMethodLabels,
  paymentMethodLabels,
} from "@/lib/orders";
import { formatMad } from "@/lib/utils";
import type { CartItem } from "@/types/cart";
import type { DeliveryMethod, PaymentMethod } from "@/types/order";

type CheckoutSummaryProps = {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
};

export function CheckoutSummary({
  items,
  subtotal,
  deliveryFee,
  total,
  deliveryMethod,
  paymentMethod,
}: CheckoutSummaryProps) {
  return (
    <aside className="lg:sticky lg:top-[170px] lg:self-start">
      <div className="overflow-hidden rounded-card border border-border-soft bg-white shadow-premium">
        <div className="bg-nahda-ink px-5 py-5 text-white">
          <p className="text-lg font-black">Résumé commande</p>
          <p className="mt-1 text-sm text-white/70">
            Statut initial : En attente de confirmation.
          </p>
        </div>

        <div className="grid max-h-[430px] gap-3 overflow-y-auto p-4">
          {items.map((item) => (
            <div key={item.product.id} className="flex gap-3">
              <Link
                href={`/produit/${item.product.slug}`}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[10px] border border-border-soft bg-[#f7f9f4]"
              >
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-black leading-5 text-nahda-ink">
                  {item.product.name}
                </p>
                <p className="mt-1 text-xs font-bold text-neutral-500">
                  {item.quantity} × {formatMad(item.product.price)}
                </p>
              </div>
              <p className="text-sm font-black text-nahda-olive-dark">
                {formatMad(item.product.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-border-soft p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="olive">{deliveryMethodLabels[deliveryMethod]}</Badge>
            <Badge variant="olive">{paymentMethodLabels[paymentMethod]}</Badge>
          </div>

          <dl className="grid gap-3 text-sm font-bold text-neutral-600">
            <div className="flex justify-between gap-4">
              <dt>Sous-total</dt>
              <dd>{formatMad(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Frais livraison</dt>
              <dd>{deliveryFee > 0 ? formatMad(deliveryFee) : "Offert retrait"}</dd>
            </div>
            <div className="border-t border-border-soft pt-4">
              <div className="flex items-end justify-between gap-4">
                <dt className="text-base font-black text-nahda-ink">Total</dt>
                <dd className="text-3xl font-black text-nahda-olive-dark">
                  {formatMad(total)}
                </dd>
              </div>
            </div>
          </dl>

          <p className="mt-4 rounded-[10px] bg-nahda-olive-soft px-3 py-2 text-xs font-bold leading-5 text-nahda-olive-dark">
            Votre commande sera reçue sans paiement en ligne. L&apos;équipe Nahda
            Smart vous contactera pour confirmer les détails.
          </p>
        </div>
      </div>
    </aside>
  );
}
