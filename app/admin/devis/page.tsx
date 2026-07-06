import Link from "next/link";
import { QuoteStatus } from "@prisma/client";
import { Check, Eye } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
  AdminSearchBox,
  AdminSelect,
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
import { getAdminQuotes } from "@/lib/services/admin-quotes";
import { updateQuoteStatusAction } from "@/app/admin/devis/actions";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("quotes");
  const params = await searchParams;
  const filters = {
    q: getSingle(params.q),
    status: getQuoteStatus(params.status),
  };
  const quotes = await getAdminQuotes(filters);

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="B2B et projets"
          title="Demandes de devis"
          description="Suivez les demandes societes, ecoles, administrations et projets techniques."
        />

        <AdminPanel title="Filtres">
          <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <AdminSearchBox
              placeholder="Numero, client, telephone, besoin..."
              defaultValue={filters.q}
            />
            <AdminSelect name="status" defaultValue={filters.status}>
              <option value="">Tous statuts</option>
              {Object.values(QuoteStatus).map((status) => (
                <option key={status} value={status}>
                  {quoteStatusLabels[status]}
                </option>
              ))}
            </AdminSelect>
            <Button type="submit" variant="lightOutline" size="sm">
              Filtrer
            </Button>
          </form>
        </AdminPanel>

        <AdminPanel title={`${quotes.length} demandes`}>
          {quotes.length ? (
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <th className="px-3 py-3">Devis</th>
                  <th className="px-3 py-3">Client</th>
                  <th className="px-3 py-3">Besoin</th>
                  <th className="px-3 py-3">Urgence</th>
                  <th className="px-3 py-3">Budget</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </AdminTableHead>
              <tbody className="divide-y divide-white/10">
                {quotes.map((quote) => (
                  <tr key={quote.id}>
                    <AdminTableCell>
                      <Link
                        href={`/admin/devis/${quote.id}`}
                        className="font-black text-white hover:text-nahda-olive"
                      >
                        {quote.quoteNumber}
                      </Link>
                      <p className="mt-1 text-xs text-white/42">
                        {quote.createdAt}
                      </p>
                    </AdminTableCell>
                    <AdminTableCell>
                      <p className="font-bold text-white">{quote.customerName}</p>
                      <p className="mt-1 text-xs text-white/44">
                        {quote.customerPhone}
                        {quote.customerTypeLabel
                          ? ` - ${quote.customerTypeLabel}`
                          : ""}
                      </p>
                      {quote.organizationName ? (
                        <p className="mt-1 text-xs text-white/40">
                          {quote.organizationName}
                        </p>
                      ) : null}
                    </AdminTableCell>
                    <AdminTableCell>{quote.needType ?? "-"}</AdminTableCell>
                    <AdminTableCell>{quote.urgency ?? "-"}</AdminTableCell>
                    <AdminTableCell>{quote.budgetLabel ?? "-"}</AdminTableCell>
                    <AdminTableCell>
                      <AdminStatusBadge tone={getQuoteStatusTone(quote.status)}>
                        {quote.statusLabel}
                      </AdminStatusBadge>
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/devis/${quote.id}`}
                          title="Voir le devis"
                          aria-label="Voir le devis"
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-control border border-white/10 text-white/78 hover:bg-white/[0.08]"
                        >
                          <Eye size={14} />
                        </Link>
                        <form action={updateQuoteStatusAction} className="flex items-center gap-1.5">
                          <input type="hidden" name="quoteId" value={quote.id} />
                          <input
                            type="hidden"
                            name="returnTo"
                            value="/admin/devis"
                          />
                          <select
                            name="status"
                            defaultValue={quote.status}
                            className="h-8 rounded-control border border-white/10 bg-[#0c1718] px-1.5 text-xs font-bold text-white outline-none"
                          >
                            {Object.values(QuoteStatus).map((status) => (
                              <option key={status} value={status}>
                                {quoteStatusLabels[status]}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            title="Appliquer le statut"
                            aria-label="Appliquer le statut"
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-control border border-white/10 text-white/78 hover:bg-white/[0.08]"
                          >
                            <Check size={14} />
                          </button>
                        </form>
                      </div>
                    </AdminTableCell>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <AdminEmptyState
              title="Aucune demande trouvee"
              description="Les demandes de devis apparaissent ici apres soumission."
            />
          )}
        </AdminPanel>
      </div>
    </AdminLayout>
  );
}

function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getQuoteStatus(value: string | string[] | undefined) {
  const single = getSingle(value);
  return single && Object.values(QuoteStatus).includes(single as QuoteStatus)
    ? (single as QuoteStatus)
    : undefined;
}
