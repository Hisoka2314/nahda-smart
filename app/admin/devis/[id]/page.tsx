import { notFound } from "next/navigation";
import { QuoteStatus } from "@prisma/client";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminBackLink,
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import {
  getQuoteStatusTone,
  quoteStatusLabels,
} from "@/lib/admin/labels";
import { getAdminQuoteById } from "@/lib/services/admin-quotes";
import { updateQuoteStatusAction } from "@/app/admin/devis/actions";

export const dynamic = "force-dynamic";

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdminSection("quotes");
  const { id } = await params;
  const quote = await getAdminQuoteById(id);

  if (!quote) notFound();

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminBackLink href="/admin/devis" />
        <AdminPageHeader
          eyebrow="Detail devis"
          title={quote.quoteNumber}
          description={`${quote.customerName} - ${quote.createdAt}`}
          action={
            <AdminStatusBadge tone={getQuoteStatusTone(quote.status)}>
              {quote.statusLabel}
            </AdminStatusBadge>
          }
        />

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <AdminPanel title="Demande">
              <div className="grid gap-4 md:grid-cols-2">
                <Info label="Client" value={quote.customerName} />
                <Info label="Telephone" value={quote.customerPhone} />
                <Info label="Type" value={quote.customerTypeLabel ?? "-"} />
                <Info label="Organisation" value={quote.organizationName ?? "-"} />
                <Info label="Besoin" value={quote.needType ?? "-"} />
                <Info label="Urgence" value={quote.urgency ?? "-"} />
                <Info label="Budget" value={quote.budgetLabel ?? "-"} />
                <Info label="Total estime" value={quote.totalLabel ?? "-"} />
              </div>
              {quote.message ? (
                <div className="mt-5 rounded-control border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-black uppercase text-white/42">
                    Message
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/68">
                    {quote.message}
                  </p>
                </div>
              ) : null}
            </AdminPanel>

            <AdminPanel title="Produits souhaites">
              {quote.items.length ? (
                <AdminTable>
                  <AdminTableHead>
                    <tr>
                      <th className="px-3 py-3">Produit</th>
                      <th className="px-3 py-3">Quantite</th>
                      <th className="px-3 py-3">Prix</th>
                      <th className="px-3 py-3">Total</th>
                    </tr>
                  </AdminTableHead>
                  <tbody className="divide-y divide-white/10">
                    {quote.items.map((item) => (
                      <tr key={item.id}>
                        <AdminTableCell>
                          <span className="font-bold text-white">
                            {item.productName}
                          </span>
                        </AdminTableCell>
                        <AdminTableCell>{item.quantity}</AdminTableCell>
                        <AdminTableCell>{item.unitPriceLabel ?? "-"}</AdminTableCell>
                        <AdminTableCell>{item.totalPriceLabel ?? "-"}</AdminTableCell>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>
              ) : (
                <AdminEmptyState
                  title="Aucun produit precise"
                  description="Le besoin devra etre qualifie par l'equipe commerciale."
                />
              )}
            </AdminPanel>
          </div>

          <aside className="space-y-5">
            <AdminPanel title="Actions">
              <form action={updateQuoteStatusAction} className="space-y-3">
                <input type="hidden" name="quoteId" value={quote.id} />
                <input
                  type="hidden"
                  name="returnTo"
                  value={`/admin/devis/${quote.id}`}
                />
                <label className="block text-xs font-black uppercase text-white/44">
                  Statut
                </label>
                <select
                  name="status"
                  defaultValue={quote.status}
                  className="h-11 w-full rounded-control border border-white/10 bg-[#0c1718] px-3 text-sm font-bold text-white outline-none"
                >
                  {Object.values(QuoteStatus).map((status) => (
                    <option key={status} value={status}>
                      {quoteStatusLabels[status]}
                    </option>
                  ))}
                </select>
                <Button type="submit" className="w-full">
                  Mettre a jour
                </Button>
              </form>
              <button
                type="button"
                disabled
                className="mt-3 h-11 w-full rounded-control border border-white/10 bg-white/[0.04] text-sm font-bold text-white/35"
              >
                Transformer en commande (bientot)
              </button>
            </AdminPanel>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase text-white/42">{label}</p>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  );
}
