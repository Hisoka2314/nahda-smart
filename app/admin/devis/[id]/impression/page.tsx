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
import { getAdminQuoteById } from "@/lib/services/admin-quotes";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Devis imprimable.
//
// Le back-office savait creer et suivre un devis, mais pas le sortir : il
// fallait le recopier a la main pour l'envoyer au client. La page reprend
// l'en-tete et le pied de la facture, donc les memes mentions legales.

export default async function AdminQuotePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSection("quotes");
  const { id } = await params;
  const [quote, settings] = await Promise.all([
    getAdminQuoteById(id),
    getSiteSettings(),
  ]);

  if (!quote) {
    notFound();
  }

  // Un devis peut n'etre encore que la demande d'un client, sans prix. Le
  // total n'existe alors pas, et il n'y a pas de TVA a detailler.
  const totaux = quote.total ? totauxAvecTva(quote.total, settings.vatRate) : null;
  const chiffre = quote.items.some((item) => item.totalPriceLabel);

  return (
    <main className="min-h-screen bg-white p-6 text-nahda-ink md:p-10 print:p-0">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
          <Link
            href={`/admin/devis/${quote.id}`}
            className="inline-flex items-center gap-2 text-sm font-black text-neutral-600 transition hover:text-nahda-olive"
          >
            <ArrowLeft size={16} />
            Retour au devis
          </Link>
          <PrintButton />
        </div>

        <EnteteDocument
          settings={settings}
          titre="Devis"
          numero={quote.quoteNumber}
          date={quote.createdAt}
          mentionSecondaire="Valable 30 jours"
        />

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase text-neutral-400">
              Destinataire
            </p>
            <p className="mt-1 font-black">{quote.customerName}</p>
            {quote.organizationName ? (
              <p className="text-sm text-neutral-600">{quote.organizationName}</p>
            ) : null}
            <p className="text-sm text-neutral-600">{quote.customerPhone}</p>
            {quote.customerEmail ? (
              <p className="text-sm text-neutral-600">{quote.customerEmail}</p>
            ) : null}
            {quote.customerAddress || quote.customerCity ? (
              <p className="text-sm text-neutral-600">
                {[quote.customerAddress, quote.customerCity]
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
              Statut : {quote.statusLabel}
            </p>
            {quote.customerTypeLabel ? (
              <p className="text-sm text-neutral-600">
                Client : {quote.customerTypeLabel}
              </p>
            ) : null}
            {quote.needType ? (
              <p className="text-sm text-neutral-600">Besoin : {quote.needType}</p>
            ) : null}
          </div>
        </section>

        {quote.message ? (
          <section className="mt-6 rounded-[10px] border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-black uppercase text-neutral-400">
              Demande du client
            </p>
            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-neutral-700">
              {quote.message}
            </p>
          </section>
        ) : null}

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
            {quote.items.map((item) => (
              <tr key={item.id} className="border-b border-neutral-200">
                <td className="py-3 pr-3 font-bold">{item.productName}</td>
                <td className="py-3 pr-3 text-center">{item.quantity}</td>
                <td className="py-3 pr-3 text-right">
                  {item.unitPriceLabel ?? "À chiffrer"}
                </td>
                <td className="py-3 text-right font-bold">
                  {item.totalPriceLabel ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totaux ? (
          <div className="mt-6 ml-auto max-w-xs text-sm">
            {totaux.taux > 0 ? (
              <>
                <div className="flex justify-between py-1">
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
              <span className="font-black">{quote.totalLabel}</span>
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-neutral-500">
            Ce devis n&apos;est pas encore chiffré.
            {chiffre ? "" : " Les prix restent à établir."}
          </p>
        )}

        <section className="mt-8 rounded-[10px] border border-neutral-200 p-4 text-xs leading-6 text-neutral-600">
          <p className="font-black uppercase text-neutral-500">Conditions</p>
          <p>Devis valable 30 jours à compter de sa date d&apos;émission.</p>
          <p>Prix exprimés en dirhams, sous réserve de disponibilité du stock.</p>
          <p>Bon pour accord : signature et cachet du client.</p>
        </section>

        <div className="mt-8 flex justify-between gap-6 text-xs text-neutral-500">
          <div className="w-1/2">
            <p className="font-black uppercase">Signature du client</p>
            <div className="mt-10 border-t border-neutral-300" />
          </div>
          <div className="w-1/2 text-right">
            <p className="font-black uppercase">
              {settings.legalName || settings.companyName}
            </p>
            <div className="mt-10 border-t border-neutral-300" />
          </div>
        </div>

        <PiedDocument settings={settings} />
      </div>
    </main>
  );
}
