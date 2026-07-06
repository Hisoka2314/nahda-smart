import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Home,
  MessageCircle,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buildOrderWhatsappUrl } from "@/lib/orders";
import { formatMad } from "@/lib/utils";
import type { PublicOrderDTO } from "@/types/public-dtos";

type OrderSuccessProps = {
  order?: PublicOrderDTO | null;
};

export function OrderSuccess({ order }: OrderSuccessProps) {
  if (!order) {
    return (
      <EmptyState
        title="Commande introuvable"
        description="Cette commande n'est pas disponible ou n'a pas encore été synchronisée. Vous pouvez revenir au catalogue ou essayer le suivi commande."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/catalogue"
              className="focus-ring inline-flex h-11 items-center justify-center rounded-control bg-nahda-olive px-4 text-sm font-black text-white transition hover:bg-nahda-olive-dark"
            >
              Continuer mes achats
            </Link>
            <Link
              href="/suivre-commande"
              className="focus-ring inline-flex h-11 items-center justify-center rounded-control border border-nahda-olive/[0.45] bg-white px-4 text-sm font-black text-nahda-olive-dark transition hover:bg-nahda-olive-soft"
            >
              Suivre une commande
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="overflow-hidden rounded-card border border-border-soft bg-white shadow-premium">
        <div className="bg-nahda-ink px-6 py-8 text-white md:px-8">
          <span className="grid h-14 w-14 place-items-center rounded-[14px] bg-nahda-olive text-white shadow-[0_18px_40px_rgb(85_114_15_/_0.35)]">
            <CheckCircle2 size={30} />
          </span>
          <h1 className="mt-5 text-3xl font-black md:text-4xl">
            Commande reçue
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-white/75">
            Votre commande a été reçue. Notre équipe vous contactera rapidement
            pour confirmer les détails.
          </p>
        </div>

        <div className="grid gap-6 p-5 md:p-8">
          <div className="grid gap-3 rounded-card border border-nahda-olive/[0.22] bg-nahda-olive-soft p-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase text-nahda-olive-dark">
                Numéro commande
              </p>
              <p className="mt-1 text-2xl font-black text-nahda-ink">
                {order.orderNumber}
              </p>
            </div>
            <div>
              <p className="text-xs font-black uppercase text-nahda-olive-dark">
                Statut
              </p>
              <Badge variant="success" className="mt-2">
                {order.statusLabel}
              </Badge>
            </div>
          </div>

          <div className="rounded-card border border-border-soft p-5">
            <h2 className="font-black text-nahda-ink">Résumé rapide</h2>
            <dl className="mt-4 grid gap-3 text-sm font-bold text-neutral-600 sm:grid-cols-2">
              <SummaryItem label="Client" value={order.customer.name} />
              <SummaryItem
                label="Type client"
                value={order.customer.typeLabel}
              />
              <SummaryItem label="Ville" value={order.customer.city} />
              <SummaryItem
                label="Organisation"
                value={order.customer.organizationName}
              />
              <SummaryItem label="Livraison" value={order.deliveryMethodLabel} />
              <SummaryItem label="Paiement" value={order.paymentMethodLabel} />
            </dl>
          </div>

          <div className="grid gap-3">
            {order.items.map((item) => (
              <div
                key={`${item.productSlug}-${item.quantity}`}
                className="flex gap-3 rounded-card border border-border-soft bg-white p-3"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[10px] border border-border-soft bg-[#f7f9f4]">
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-black text-nahda-ink">
                    {item.productName}
                  </p>
                  <p className="mt-1 text-xs font-bold text-neutral-500">
                    {item.quantity} × {formatMad(item.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-black text-nahda-olive-dark">
                  {formatMad(item.totalPrice)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-control bg-nahda-olive px-4 text-sm font-black text-white transition hover:bg-nahda-olive-dark"
            >
              <Home size={17} />
              Retour accueil
            </Link>
            <Link
              href="/catalogue"
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-control border border-nahda-olive/[0.45] bg-white px-4 text-sm font-black text-nahda-olive-dark transition hover:bg-nahda-olive-soft"
            >
              <ShoppingBag size={17} />
              Continuer mes achats
            </Link>
            <a
              href={buildOrderWhatsappUrl(order.orderNumber)}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-control border border-[#25d366]/40 bg-white px-4 text-sm font-black text-[#1a7f3c] transition hover:bg-[#eefbf3]"
            >
              <MessageCircle size={17} />
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      <aside className="lg:sticky lg:top-[170px] lg:self-start">
        <div className="rounded-card border border-border-soft bg-white p-5 shadow-premium">
          <span className="grid h-12 w-12 place-items-center rounded-[12px] bg-nahda-olive-soft text-nahda-olive">
            <PackageCheck size={24} />
          </span>
          <h2 className="mt-4 text-xl font-black text-nahda-ink">
            Notre équipe prend le relais
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-neutral-600">
            Notre équipe vous contactera rapidement par téléphone ou WhatsApp.
          </p>
          <dl className="mt-5 grid gap-3 text-sm font-bold text-neutral-600">
            <div className="flex justify-between gap-4">
              <dt>Sous-total</dt>
              <dd>{formatMad(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Livraison</dt>
              <dd>{order.deliveryFee > 0 ? formatMad(order.deliveryFee) : "Retrait"}</dd>
            </div>
            <div className="border-t border-border-soft pt-4">
              <div className="flex items-end justify-between gap-4">
                <dt className="font-black text-nahda-ink">Total</dt>
                <dd className="text-2xl font-black text-nahda-olive-dark">
                  {formatMad(order.total)}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase text-neutral-400">{label}</dt>
      <dd className="mt-1 text-nahda-ink">{value || "Non renseigné"}</dd>
    </div>
  );
}
