import { ServiceTicketStatus, ServiceTicketUrgency } from "@prisma/client";
import Link from "next/link";
import { Eye, Plus, Wrench } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminEmptyState,
  AdminFeedback,
  AdminFilterBar,
  AdminPageHeader,
  AdminPagination,
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
  serviceTicketStatusLabels,
  serviceTicketUrgencyLabels,
} from "@/lib/admin/labels";
import { getAdminPagination, getSingleQuery } from "@/lib/admin/pagination";
import { getAdminServiceTicketsPage } from "@/lib/services/admin-sav";

export const dynamic = "force-dynamic";

export default async function AdminSavPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("sav");
  const params = await searchParams;
  const pagination = getAdminPagination({
    page: getSingleQuery(params.page),
    perPage: getSingleQuery(params.perPage),
  });
  const filters = {
    q: getSingleQuery(params.q),
    status: getStatus(params.status),
    urgency: getUrgency(params.urgency),
    date: getDateFilter(params.date),
  };
  const tickets = await getAdminServiceTicketsPage(filters, pagination);

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="SAV"
          title="SAV, garanties et retours"
          description="Suivez les retours, reparations, echanges, garanties fournisseur et demandes de support technique."
          action={
            <Link href="/admin/sav/nouveau">
              <Button variant="primary" size="sm">
                <Plus size={16} />
                Nouveau ticket
              </Button>
            </Link>
          }
          breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "SAV" }]}
        />

        <AdminFeedback
          success={getSingleQuery(params.success)}
          error={getSingleQuery(params.error)}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-card border border-white/10 bg-white/[0.045] p-5">
            <p className="text-xs font-black uppercase text-white/42">
              Tickets filtres
            </p>
            <p className="mt-2 text-3xl font-black text-white">{tickets.total}</p>
          </div>
          <div className="rounded-card border border-amber-400/20 bg-amber-400/10 p-5">
            <p className="text-xs font-black uppercase text-amber-200">
              Priorite
            </p>
            <p className="mt-2 text-sm font-bold text-white/70">
              Urgence, statut et client restent suivis cote admin uniquement.
            </p>
          </div>
          <div className="rounded-card border border-nahda-olive/25 bg-nahda-olive/10 p-5">
            <Wrench className="text-nahda-olive" size={22} />
            <p className="mt-3 text-sm font-bold text-white/70">
              Les actions reparation/remplacement creent des mouvements stock.
            </p>
          </div>
        </div>

        <AdminPanel title="Filtres SAV">
          <AdminFilterBar columns="lg:grid-cols-[1.4fr_1fr_1fr_1fr_150px_auto_auto]">
            <AdminSearchBox
              placeholder="Ticket, client, telephone, produit, SKU..."
              defaultValue={filters.q}
            />
            <AdminSelect name="status" defaultValue={filters.status}>
              <option value="">Tous statuts</option>
              {Object.values(ServiceTicketStatus).map((status) => (
                <option key={status} value={status}>
                  {serviceTicketStatusLabels[status]}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect name="urgency" defaultValue={filters.urgency}>
              <option value="">Toutes urgences</option>
              {Object.values(ServiceTicketUrgency).map((urgency) => (
                <option key={urgency} value={urgency}>
                  {serviceTicketUrgencyLabels[urgency]}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect name="date" defaultValue={filters.date}>
              <option value="">Toutes dates</option>
              <option value="today">Aujourd hui</option>
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
            </AdminSelect>
            <AdminSelect name="perPage" defaultValue={String(tickets.perPage)}>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </AdminSelect>
            <Button type="submit" variant="lightOutline">
              Filtrer
            </Button>
            <Link
              href="/admin/sav"
              className="inline-flex h-11 items-center justify-center rounded-control border border-white/10 px-3 text-sm font-bold text-white/68 hover:bg-white/[0.08]"
            >
              Reset
            </Link>
          </AdminFilterBar>
        </AdminPanel>

        <AdminPanel title={`${tickets.total} tickets SAV`}>
          {tickets.items.length ? (
            <>
              <AdminTable>
                <AdminTableHead>
                  <tr>
                    <th className="px-3 py-3">Ticket</th>
                    <th className="px-3 py-3">Client</th>
                    <th className="px-3 py-3">Produit</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Urgence</th>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </AdminTableHead>
                <tbody className="divide-y divide-white/10">
                  {tickets.items.map((ticket) => (
                    <tr key={ticket.id}>
                      <AdminTableCell>
                        <Link
                          href={`/admin/sav/${ticket.id}`}
                          className="font-black text-white hover:text-nahda-olive"
                        >
                          {ticket.ticketNumber}
                        </Link>
                        <p className="mt-1 text-xs text-white/42">
                          {ticket.orderNumber}
                        </p>
                      </AdminTableCell>
                      <AdminTableCell>
                        <p className="font-bold text-white">{ticket.customerName}</p>
                        <p className="mt-1 text-xs text-white/42">
                          {ticket.customerPhone}
                        </p>
                      </AdminTableCell>
                      <AdminTableCell>
                        <p>{ticket.productName}</p>
                        {ticket.productSku ? (
                          <p className="mt-1 text-xs text-white/42">
                            {ticket.productSku}
                          </p>
                        ) : null}
                      </AdminTableCell>
                      <AdminTableCell>{ticket.typeLabel}</AdminTableCell>
                      <AdminTableCell>
                        <AdminStatusBadge tone={ticket.urgencyTone}>
                          {ticket.urgencyLabel}
                        </AdminStatusBadge>
                      </AdminTableCell>
                      <AdminTableCell>
                        <AdminStatusBadge tone={ticket.statusTone}>
                          {ticket.statusLabel}
                        </AdminStatusBadge>
                      </AdminTableCell>
                      <AdminTableCell>{ticket.createdAt}</AdminTableCell>
                      <AdminTableCell>
                        <Link
                          href={`/admin/sav/${ticket.id}`}
                          className="inline-flex h-9 items-center gap-1 rounded-control border border-white/10 px-3 text-xs font-bold text-white hover:bg-white/[0.08]"
                        >
                          <Eye size={14} />
                          Voir
                        </Link>
                      </AdminTableCell>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
              <AdminPagination
                basePath="/admin/sav"
                searchParams={params}
                page={tickets.page}
                perPage={tickets.perPage}
                total={tickets.total}
                totalPages={tickets.totalPages}
              />
            </>
          ) : (
            <AdminEmptyState
              title="Aucun ticket SAV"
              description="Creez un ticket pour suivre une reparation, un retour ou une garantie fournisseur."
            />
          )}
        </AdminPanel>
      </div>
    </AdminLayout>
  );
}

function getStatus(value: string | string[] | undefined) {
  const single = getSingleQuery(value);
  return single &&
    Object.values(ServiceTicketStatus).includes(single as ServiceTicketStatus)
    ? (single as ServiceTicketStatus)
    : undefined;
}

function getUrgency(value: string | string[] | undefined) {
  const single = getSingleQuery(value);
  return single &&
    Object.values(ServiceTicketUrgency).includes(single as ServiceTicketUrgency)
    ? (single as ServiceTicketUrgency)
    : undefined;
}

function getDateFilter(
  value: string | string[] | undefined,
): "today" | "7d" | "30d" | undefined {
  const single = getSingleQuery(value);
  return single === "today" || single === "7d" || single === "30d"
    ? single
    : undefined;
}
