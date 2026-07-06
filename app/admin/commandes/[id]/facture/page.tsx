import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/admin/print-button";
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

        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-nahda-ink pb-6">
          <div>
            <h1 className="text-2xl font-black">{settings.companyName}</h1>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              {settings.addressPrimary}
              <br />
              Tél : {settings.phone}
              <br />
              {settings.email}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black uppercase">Facture</p>
            <p className="mt-2 text-sm font-bold text-neutral-600">
              N° {order.orderNumber}
            </p>
            <p className="text-sm text-neutral-500">{order.createdAt}</p>
          </div>
        </header>

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
          <div className="mt-2 flex justify-between border-t-2 border-nahda-ink py-2 text-base">
            <span className="font-black">Total</span>
            <span className="font-black">{order.totalLabel}</span>
          </div>
        </div>

        <footer className="mt-10 border-t border-neutral-200 pt-4 text-center text-xs text-neutral-500">
          {settings.companyName} — {settings.addressPrimary} — {settings.phone} —{" "}
          {settings.email}
        </footer>
      </div>
    </main>
  );
}
