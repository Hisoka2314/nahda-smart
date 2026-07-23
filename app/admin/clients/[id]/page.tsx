import { CustomerNoteType } from "@prisma/client";
import Link from "next/link";
import { FileText, Pencil, Plus, ShoppingCart } from "lucide-react";
import { notFound } from "next/navigation";
import { addCustomerNoteAction } from "@/app/admin/clients/actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminBackLink,
  AdminEmptyState,
  AdminFeedback,
  AdminField,
  AdminHiddenFields,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminStatusBadge,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTextarea,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { customerNoteTypeLabels } from "@/lib/admin/labels";
import { getSingleQuery } from "@/lib/admin/pagination";
import { getAdminClientById } from "@/lib/services/admin-clients";

export const dynamic = "force-dynamic";

export default async function AdminClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("customers");
  const { id } = await params;
  const query = await searchParams;
  const client = await getAdminClientById(id);

  if (!client) notFound();

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminBackLink href="/admin/clients" />
        <AdminPageHeader
          eyebrow="Fiche client"
          title={client.name}
          description={`${client.reference} · ${client.phone} · ${client.typeLabel}${client.organizationName ? ` · ${client.organizationName}` : ""}`}
          breadcrumbs={[
            { label: "Clients", href: "/admin/clients" },
            { label: client.name },
          ]}
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/clients/${client.id}/modifier`}>
                <Button variant="lightOutline" size="sm">
                  <Pencil size={16} />
                  Modifier
                </Button>
              </Link>
              <Link href={`/admin/clients/${client.id}/nouvelle-commande`}>
                <Button variant="primary" size="sm">
                  <ShoppingCart size={16} />
                  Creer une commande
                </Button>
              </Link>
            </div>
          }
        />

        <AdminFeedback
          success={getSingleQuery(query.success)}
          error={getSingleQuery(query.error)}
        />

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <AdminPanel title="Profil CRM">
              <div className="grid gap-4 md:grid-cols-3">
                <Info label="Code client" value={client.reference} />
                <Info label="Telephone" value={client.phone} />
                <Info label="Email" value={client.email ?? "-"} />
                <Info label="Ville" value={client.city ?? "-"} />
                <Info label="Type" value={client.typeLabel} />
                <Info label="Source" value={client.sourceLabel} />
                <Info label="Niveau" value={client.levelLabel} />
                <div>
                  <p className="text-xs font-black uppercase text-white/44">
                    Statut relationnel
                  </p>
                  <div className="mt-2">
                    <AdminStatusBadge tone={client.relationshipTone}>
                      {client.relationshipStatusLabel}
                    </AdminStatusBadge>
                  </div>
                </div>
                <Info
                  label="Organisation"
                  value={client.organizationName ?? "-"}
                />
                <Info label="Adresse" value={client.address ?? "-"} />
              </div>
              {client.tagLabels.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {client.tagLabels.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-[8px] border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-black text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {client.internalNotes ? (
                <div className="mt-5 rounded-control border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
                  <p className="font-black">Note interne globale</p>
                  <p className="mt-2 text-amber-50/80">{client.internalNotes}</p>
                </div>
              ) : null}
            </AdminPanel>

            <AdminPanel title="Historique commandes">
              {client.orders.length ? (
                <AdminTable>
                  <AdminTableHead>
                    <tr>
                      <th className="px-3 py-3">Commande</th>
                      <th className="px-3 py-3">Date</th>
                      <th className="px-3 py-3">Statut</th>
                      <th className="px-3 py-3">Total</th>
                    </tr>
                  </AdminTableHead>
                  <tbody className="divide-y divide-white/10">
                    {client.orders.map((order) => (
                      <tr key={order.id}>
                        <AdminTableCell>
                          <Link
                            href={`/admin/commandes/${order.id}`}
                            className="font-black text-white hover:text-nahda-olive"
                          >
                            {order.orderNumber}
                          </Link>
                        </AdminTableCell>
                        <AdminTableCell>{order.createdAt}</AdminTableCell>
                        <AdminTableCell>{order.statusLabel}</AdminTableCell>
                        <AdminTableCell>{order.totalLabel}</AdminTableCell>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>
              ) : (
                <AdminEmptyState
                  title="Aucune commande"
                  description="Creez une commande manuelle depuis cette fiche client."
                />
              )}
            </AdminPanel>

            <AdminPanel title="Produits achetes">
              {client.productsBought.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {client.productsBought.map((product) => (
                    <div
                      key={product.productId}
                      className="rounded-control border border-white/10 bg-white/[0.04] p-3"
                    >
                      <p className="font-black text-white">{product.name}</p>
                      <p className="mt-1 text-xs text-white/42">{product.sku}</p>
                      <p className="mt-3 text-sm text-white/64">
                        {product.quantity} unite(s) - {product.totalLabel}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <AdminEmptyState
                  title="Aucun produit achete"
                  description="Les produits apparaitront apres les commandes."
                />
              )}
            </AdminPanel>

            <AdminPanel title="Devis et messages">
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-sm font-black uppercase text-white/44">
                    Devis lies
                  </h3>
                  {client.quotes.length ? (
                    <div className="space-y-2">
                      {client.quotes.map((quote) => (
                        <div
                          key={quote.id}
                          className="rounded-control border border-white/10 bg-white/[0.04] p-3"
                        >
                          <p className="font-black text-white">
                            {quote.quoteNumber}
                          </p>
                          <p className="mt-1 text-xs text-white/48">
                            {quote.status} - {quote.createdAt}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/48">Aucun devis.</p>
                  )}
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-black uppercase text-white/44">
                    Messages contact
                  </h3>
                  {client.contactMessages.length ? (
                    <div className="space-y-2">
                      {client.contactMessages.map((message) => (
                        <div
                          key={message.id}
                          className="rounded-control border border-white/10 bg-white/[0.04] p-3"
                        >
                          <p className="font-black text-white">
                            {message.subject}
                          </p>
                          <p className="mt-1 text-xs text-white/48">
                            {message.status} - {message.createdAt}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/48">Aucun message.</p>
                  )}
                </div>
              </div>
            </AdminPanel>
          </div>

          <div className="space-y-6">
            <AdminPanel
              title="Ajouter une note"
              description="Notes privees admin uniquement, jamais visibles cote public."
            >
              <form action={addCustomerNoteAction} className="space-y-4">
                <AdminHiddenFields
                  values={{
                    customerId: client.id,
                    returnTo: `/admin/clients/${client.id}`,
                  }}
                />
                <AdminField label="Type note">
                  <AdminSelect name="type" defaultValue="INFORMATION">
                    {Object.values(CustomerNoteType).map((type) => (
                      <option key={type} value={type}>
                        {customerNoteTypeLabels[type]}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="Note interne">
                  <AdminTextarea
                    name="content"
                    rows={5}
                    required
                    placeholder="Contexte de suivi, paiement, livraison, litige..."
                  />
                </AdminField>
                <Button type="submit" variant="primary" className="w-full">
                  <Plus size={16} />
                  Ajouter la note
                </Button>
              </form>
            </AdminPanel>

            <AdminPanel title="Timeline notes">
              {client.notes.length ? (
                <div className="space-y-3">
                  {client.notes.map((note) => (
                    <article
                      key={note.id}
                      className="rounded-control border border-white/10 bg-white/[0.04] p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-[8px] border border-white/10 bg-white/[0.06] px-2 py-1 text-xs font-black text-nahda-olive">
                          {note.typeLabel}
                        </span>
                        <span className="text-xs text-white/38">
                          {note.createdAt}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-white/74">
                        {note.content}
                      </p>
                      {note.author ? (
                        <p className="mt-3 text-xs text-white/38">
                          Par {note.author}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <AdminEmptyState
                  title="Aucune note"
                  description="Ajoutez une premiere note de suivi pour ce client."
                />
              )}
            </AdminPanel>

            <Link
              href={`/admin/clients/${client.id}/nouvelle-commande`}
              className="flex items-center justify-center gap-2 rounded-card border border-nahda-olive/40 bg-nahda-olive px-4 py-4 text-sm font-black text-white shadow-[0_18px_44px_rgb(85_114_15_/_0.2)] hover:bg-nahda-olive-dark"
            >
              <FileText size={18} />
              Creer une commande manuelle
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-white/44">{label}</p>
      <p className="mt-2 font-bold text-white">{value}</p>
    </div>
  );
}
