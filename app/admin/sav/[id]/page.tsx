import {
  ServiceTicketNoteType,
  ServiceTicketStatus,
} from "@prisma/client";
import type { ReactNode } from "react";
import Link from "next/link";
import { ClipboardList, PackageCheck, ShieldCheck, Wrench } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminEmptyState,
  AdminFeedback,
  AdminField,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminStatusBadge,
  AdminTextInput,
  AdminTextarea,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import {
  addServiceTicketNoteAction,
  resolveServiceTicketAction,
  updateServiceTicketStatusAction,
} from "@/app/admin/sav/actions";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import {
  serviceTicketNoteTypeLabels,
  serviceTicketStatusLabels,
} from "@/lib/admin/labels";
import { getSingleQuery } from "@/lib/admin/pagination";
import {
  getAdminServiceTicketById,
  getAdminServiceTicketFormData,
} from "@/lib/services/admin-sav";

export const dynamic = "force-dynamic";

export default async function ServiceTicketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("sav");
  const { id } = await params;
  const query = await searchParams;
  const [ticket, formData] = await Promise.all([
    getAdminServiceTicketById(id),
    getAdminServiceTicketFormData(),
  ]);

  if (!ticket) {
    return (
      <AdminLayout admin={admin}>
        <AdminEmptyState
          title="Ticket SAV introuvable"
          description="Le ticket demande n'existe pas ou a ete supprime."
        />
      </AdminLayout>
    );
  }

  const returnTo = `/admin/sav/${ticket.id}`;
  const canManageStatus = ["SUPER_ADMIN", "MANAGER"].includes(admin.role);
  const canAddNote = [
    "SUPER_ADMIN",
    "MANAGER",
    "SELLER",
    "STOCK_MANAGER",
  ].includes(admin.role);
  const canResolveStock = ["SUPER_ADMIN", "MANAGER", "STOCK_MANAGER"].includes(
    admin.role,
  );

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="SAV"
          title={ticket.ticketNumber}
          description="Dossier prive: suivi client, diagnostic, notes internes, resolution et mouvements stock."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "SAV", href: "/admin/sav" },
            { label: ticket.ticketNumber },
          ]}
          action={
            <Link
              href="/admin/sav"
              className="inline-flex h-10 items-center justify-center rounded-control border border-white/10 px-4 text-sm font-bold text-white hover:bg-white/[0.08]"
            >
              Retour SAV
            </Link>
          }
        />

        <AdminFeedback
          success={getSingleQuery(query.success)}
          error={getSingleQuery(query.error)}
        />

        <div className="grid gap-4 xl:grid-cols-4">
          <SummaryCard
            icon={<ShieldCheck size={20} />}
            label="Statut"
            value={ticket.statusLabel}
            badge={<AdminStatusBadge tone={ticket.statusTone}>{ticket.statusLabel}</AdminStatusBadge>}
          />
          <SummaryCard
            icon={<ClipboardList size={20} />}
            label="Type"
            value={ticket.typeLabel}
            helper={`Urgence: ${ticket.urgency === "HIGH" ? "haute" : ticket.urgency === "MEDIUM" ? "moyenne" : "faible"}`}
            badge={<AdminStatusBadge tone={ticket.urgencyTone}>{ticket.urgencyLabel}</AdminStatusBadge>}
          />
          <SummaryCard
            icon={<PackageCheck size={20} />}
            label="Produit"
            value={ticket.product?.name ?? "Non lie"}
            helper={ticket.product?.sku}
          />
          <SummaryCard
            icon={<Wrench size={20} />}
            label="Cree par"
            value={ticket.createdBy}
            helper={ticket.createdAt}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <AdminPanel title="Infos dossier">
              <div className="grid gap-4 lg:grid-cols-2">
                <InfoBlock label="Client" value={ticket.customer.name}>
                  <p>{ticket.customer.phone}</p>
                  {ticket.customer.email ? <p>{ticket.customer.email}</p> : null}
                  {ticket.customer.organizationName ? (
                    <p>{ticket.customer.organizationName}</p>
                  ) : null}
                </InfoBlock>
                <InfoBlock label="Commande" value={ticket.order?.orderNumber ?? "-"}>
                  {ticket.order ? (
                    <>
                      <p>Total: {ticket.order.total} DH</p>
                      <Link
                        href={`/admin/commandes/${ticket.order.id}`}
                        className="font-bold text-nahda-olive hover:text-white"
                      >
                        Voir commande
                      </Link>
                    </>
                  ) : null}
                </InfoBlock>
                <InfoBlock label="Produit" value={ticket.product?.name ?? "-"}>
                  {ticket.product ? (
                    <>
                      <p>SKU: {ticket.product.sku}</p>
                      <Link
                        href={`/admin/produits/${ticket.product.id}`}
                        className="font-bold text-nahda-olive hover:text-white"
                      >
                        Voir produit
                      </Link>
                    </>
                  ) : null}
                </InfoBlock>
                <InfoBlock label="Fournisseur" value={ticket.supplier?.name ?? "-"}>
                  {ticket.supplier ? (
                    <Link
                      href={`/admin/fournisseurs/${ticket.supplier.id}`}
                      className="font-bold text-nahda-olive hover:text-white"
                    >
                      Voir fournisseur
                    </Link>
                  ) : null}
                </InfoBlock>
              </div>
            </AdminPanel>

            <AdminPanel title="Probleme signale">
              <p className="whitespace-pre-wrap text-sm leading-7 text-white/70">
                {ticket.problem}
              </p>
              {ticket.internalNotes ? (
                <div className="mt-4 rounded-control border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-black uppercase text-white/42">
                    Notes internes initiales
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/70">
                    {ticket.internalNotes}
                  </p>
                </div>
              ) : null}
            </AdminPanel>

            <AdminPanel title="Timeline statuts">
              {ticket.statusHistory.length ? (
                <div className="space-y-3">
                  {ticket.statusHistory.map((history) => (
                    <div
                      key={history.id}
                      className="rounded-control border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <AdminStatusBadge tone={history.tone}>
                          {history.statusLabel}
                        </AdminStatusBadge>
                        <span className="text-xs font-bold text-white/40">
                          {history.createdAt}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-white/58">
                        Par {history.changedBy}
                      </p>
                      {history.note ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-white/70">
                          {history.note}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <AdminEmptyState
                  title="Aucun historique"
                  description="Les changements de statut apparaitront ici."
                />
              )}
            </AdminPanel>
          </div>

          <div className="space-y-6">
            {canManageStatus ? (
              <AdminPanel title="Changer statut">
                <form action={updateServiceTicketStatusAction} className="space-y-4">
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <AdminField label="Nouveau statut">
                    <AdminSelect name="status" defaultValue={ticket.status}>
                      {Object.values(ServiceTicketStatus).map((status) => (
                        <option key={status} value={status}>
                          {serviceTicketStatusLabels[status]}
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                  <AdminField label="Note changement">
                    <AdminTextarea name="note" rows={3} />
                  </AdminField>
                  <Button type="submit" variant="primary" className="w-full">
                    Mettre a jour
                  </Button>
                </form>
              </AdminPanel>
            ) : null}

            {canResolveStock ? (
          <AdminPanel
            title="Actions resolution"
            description="Reparer, remplacer ou cloturer. Les actions stock utilisent une transaction Prisma."
          >
                <div className="space-y-4">
                  {ticket.product ? (
                    <>
                    <ResolutionForm
                      action="REPAIR"
                      title="Marquer repare"
                      ticketId={ticket.id}
                      returnTo={returnTo}
                      depots={formData.depots}
                      showReturnToStock
                    />
                    <ResolutionForm
                      action="REPLACE"
                      title="Remplacer client"
                      ticketId={ticket.id}
                      returnTo={returnTo}
                      depots={formData.depots}
                    />
                    </>
                  ) : (
                    <AdminEmptyState
                      title="Produit non lie"
                      description="Liez un produit au ticket pour effectuer une reparation ou un remplacement avec stock."
                    />
                  )}
                  {canManageStatus ? (
                    <ResolutionForm
                      action="CLOSE"
                      title="Cloturer"
                      ticketId={ticket.id}
                      returnTo={returnTo}
                      depots={formData.depots}
                      compact
                    />
                  ) : null}
                </div>
              </AdminPanel>
            ) : null}

            <AdminPanel title="Notes SAV privees">
              {canAddNote ? (
                <form action={addServiceTicketNoteAction} className="mb-5 space-y-3">
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <AdminField label="Type note">
                    <AdminSelect name="type" defaultValue="INTERNAL">
                      {Object.values(ServiceTicketNoteType).map((type) => (
                        <option key={type} value={type}>
                          {serviceTicketNoteTypeLabels[type]}
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                  <AdminField label="Note interne">
                    <AdminTextarea name="content" rows={4} required />
                  </AdminField>
                  <Button type="submit" variant="lightOutline" className="w-full">
                    Ajouter note
                  </Button>
                </form>
              ) : null}

              {ticket.notes.length ? (
                <div className="space-y-3">
                  {ticket.notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-control border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <AdminStatusBadge tone="muted">
                          {note.typeLabel}
                        </AdminStatusBadge>
                        <span className="text-xs text-white/40">
                          {note.createdAt}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-white/42">Par {note.author}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/72">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <AdminEmptyState
                  title="Aucune note"
                  description="Les notes SAV privees apparaitront ici."
                />
              )}
            </AdminPanel>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  helper,
  badge,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper?: string;
  badge?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-white/10 bg-white/[0.045] p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-control border border-nahda-olive/25 bg-nahda-olive/10 p-3 text-nahda-olive">
          {icon}
        </span>
        {badge}
      </div>
      <p className="mt-4 text-xs font-black uppercase text-white/42">{label}</p>
      <p className="mt-2 line-clamp-2 text-lg font-black text-white">{value}</p>
      {helper ? <p className="mt-1 text-xs text-white/44">{helper}</p> : null}
    </div>
  );
}

function InfoBlock({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-control border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase text-white/42">{label}</p>
      <p className="mt-2 font-black text-white">{value}</p>
      {children ? (
        <div className="mt-2 space-y-1 text-sm text-white/58">{children}</div>
      ) : null}
    </div>
  );
}

function ResolutionForm({
  action,
  title,
  ticketId,
  returnTo,
  depots,
  showReturnToStock,
  compact,
}: {
  action: "REPAIR" | "REPLACE" | "CLOSE";
  title: string;
  ticketId: string;
  returnTo: string;
  depots: Array<{ id: string; name: string }>;
  showReturnToStock?: boolean;
  compact?: boolean;
}) {
  return (
    <form
      action={resolveServiceTicketAction}
      className="rounded-control border border-white/10 bg-white/[0.04] p-4"
    >
      <input type="hidden" name="ticketId" value={ticketId} />
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <p className="font-black text-white">{title}</p>
      {!compact ? (
        <div className="mt-3 grid gap-3">
          <AdminField label="Depot">
            <AdminSelect name="depotId">
              {depots.map((depot) => (
                <option key={depot.id} value={depot.id}>
                  {depot.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Quantite">
            <AdminTextInput name="quantity" type="number" defaultValue={1} />
          </AdminField>
          {showReturnToStock ? (
            <label className="flex items-center gap-2 text-sm font-bold text-white/70">
              <input
                name="returnToStock"
                type="checkbox"
                className="h-4 w-4 accent-nahda-olive"
              />
              Retourner le produit repare au stock
            </label>
          ) : null}
        </div>
      ) : null}
      <AdminField label="Note resolution">
        <AdminTextarea name="note" rows={compact ? 3 : 2} />
      </AdminField>
      <Button
        type="submit"
        variant={action === "REPLACE" ? "primary" : "lightOutline"}
        className="mt-3 w-full"
      >
        Valider
      </Button>
    </form>
  );
}
