import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/admin/print-button";
import {
  EnteteDocument,
  PiedDocument,
  dirhams,
  totauxAvecTva,
} from "@/components/admin/document-commercial";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { getAdminOrderById } from "@/lib/services/admin-orders";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminOrderInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSection("orders");
  const { id } = await params;
  const [order, settings] = await Promise.all([
    getAdminOrderById(id),
    getSiteSettings(),
  ]);

  if (!order) {
    notFound();
  }

  // Les prix du catalogue sont saisis toutes taxes comprises : la base et la
  // taxe se deduisent du total, jamais l'inverse.
  const totaux = totauxAvecTva(order.total, settings.vatRate);

  return (
    <main className="min-h-screen bg-white p-6 text-nahda-ink md:p-10 print:p-0">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
          <Link
            href={`/admin/commandes/${order.id}`}
            className="inline-flex items-center gap-2 text-sm font-black text-neutral-600 transition hover:text-nahda-olive"
          >
            <ArrowLeft size={16} />
            Retour à la commande
          </Link>
          <PrintButton />
        </div>

        <EnteteDocument
          settings={settings}
          titre="Facture"
          numero={order.orderNumber}
          date={order.createdAt}
        />

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase text-neutral-400">
              Facturé à
            </p>
            <p className="mt-1 font-black">{order.customerName}</p>
            {order.organizationName ? (
              <p className="text-sm text-neutral-600">{order.organizationName}</p>
            ) : null}
            <p className="text-sm text-neutral-600">{order.customerPhone}</p>
            {order.customerEmail ? (
              <p className="text-sm text-neutral-600">{order.customerEmail}</p>
            ) : null}
            {order.customerAddress || order.customerCity ? (
              <p className="text-sm text-neutral-600">
                {[order.customerAddress, order.customerCity]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            ) : null}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-black uppercase text-neutral-400">
              Détails
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              Livraison : {order.deliveryMethodLabel}
            </p>
            <p className="text-sm text-neutral-600">
              Paiement : {order.paymentMethodLabel}
            </p>
            <p className="text-sm text-neutral-600">
              Statut : {order.statusLabel}
            </p>
          </div>
        </section>

        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-nahda-ink text-left text-xs font-black uppercase">
              <th className="py-2 pr-3">Produit</th>
              <th className="py-2 pr-3 text-center">Qté</th>
              <th className="py-2 pr-3 text-right">Prix unitaire</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-neutral-200">
                <td className="py-3 pr-3">
                  <p className="font-bold">{item.productName}</p>
                  <p className="text-xs text-neutral-500">{item.brandName}</p>
                </td>
                <td className="py-3 pr-3 text-center">{item.quantity}</td>
                <td className="py-3 pr-3 text-right">{item.unitPriceLabel}</td>
                <td className="py-3 text-right font-bold">
                  {item.totalPriceLabel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto max-w-xs text-sm">
          <div className="flex justify-between py-1">
            <span className="text-neutral-600">Sous-total</span>
            <span className="font-bold">{order.subtotalLabel}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-neutral-600">Livraison</span>
            <span className="font-bold">{order.deliveryFeeLabel}</span>
          </div>

          {/* Le detail de la taxe n'apparait que si le magasin est assujetti.
              A taux zero, l'afficher laisserait croire a une TVA nulle plutot
              qu'a son absence. */}
          {totaux.taux > 0 ? (
            <>
              <div className="mt-2 flex justify-between border-t border-neutral-300 py-1 pt-2">
                <span className="text-neutral-600">Total HT</span>
                <span className="font-bold">{dirhams(totaux.ht)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-600">TVA {totaux.taux} %</span>
                <span className="font-bold">{dirhams(totaux.tva)}</span>
              </div>
            </>
          ) : null}

          <div className="mt-2 flex justify-between border-t-2 border-nahda-ink py-2 text-base">
            <span className="font-black">
              {totaux.taux > 0 ? "Total TTC" : "Total"}
            </span>
            <span className="font-black">{order.totalLabel}</span>
          </div>
        </div>

        <PiedDocument settings={settings} />
      </div>
    </main>
  );
}
