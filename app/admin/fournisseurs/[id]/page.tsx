import { SupplierNoteType } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus, ReceiptText } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminEmptyState,
  AdminFeedback,
  AdminField,
  AdminHiddenFields,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminStatCard,
  AdminStatusBadge,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTextarea,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { addSupplierNoteAction } from "@/app/admin/fournisseurs/actions";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { getSingleQuery } from "@/lib/admin/pagination";
import { supplierNoteTypeLabels } from "@/lib/admin/labels";
import { getAdminSupplierById } from "@/lib/services/admin-suppliers";

export const dynamic = "force-dynamic";

export default async function SupplierDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("suppliers");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supplier = await getAdminSupplierById(id);

  if (!supplier) notFound();

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Fiche fournisseur"
          title={supplier.name}
          description={`${supplier.reference} · ${supplier.typeLabel} · ${supplier.city}`}
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Fournisseurs", href: "/admin/fournisseurs" },
            { label: supplier.name },
          ]}
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/fournisseurs/${supplier.id}/achat`}>
                <Button variant="primary" size="sm">
                  <ReceiptText size={16} />
                  Nouvel achat
                </Button>
              </Link>
              <Link href={`/admin/fournisseurs/${supplier.id}/modifier`}>
                <Button variant="lightOutline" size="sm">
                  <Pencil size={16} />
                  Modifier
                </Button>
              </Link>
            </div>
          }
        />
        <AdminFeedback
          success={getSingleQuery(query.success)}
          error={getSingleQuery(query.error)}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <AdminStatCard label="Total achats" value={supplier.totalPurchasesLabel} />
          <AdminStatCard label="Total paye" value={supplier.totalPaidLabel} tone="success" />
          <AdminStatCard
            label="Reste a payer"
            value={supplier.remainingLabel}
            tone={supplier.remaining > 0 ? "warning" : "success"}
          />
          <AdminStatCard label="Achats" value={supplier.purchaseCount} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <AdminPanel title="Informations fournisseur">
            <div className="space-y-3 text-sm text-white/68">
              <p><span className="font-black text-white">Code fournisseur :</span> {supplier.reference}</p>
              <p><span className="font-black text-white">Telephone :</span> {supplier.phone}</p>
              <p><span className="font-black text-white">Email :</span> {supplier.email || "-"}</p>
              <p><span className="font-black text-white">Adresse :</span> {supplier.address || "-"}</p>
              <p><span className="font-black text-white">Statut :</span>{" "}
                <AdminStatusBadge tone={supplier.isActive ? "success" : "muted"}>
                  {supplier.isActive ? "Actif" : "Inactif"}
                </AdminStatusBadge>
              </p>
              {supplier.tagLabels.length ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {supplier.tagLabels.map((tag) => (
                    <AdminStatusBadge key={tag} tone="info">{tag}</AdminStatusBadge>
                  ))}
                </div>
              ) : null}
              {supplier.notes ? (
                <p className="rounded-control border border-white/10 bg-white/[0.04] p-3">
                  {supplier.notes}
                </p>
              ) : null}
            </div>
          </AdminPanel>

          <AdminPanel title="Ajouter une note privee">
            <form action={addSupplierNoteAction} className="space-y-3">
              <AdminHiddenFields
                values={{
                  supplierId: supplier.id,
                  returnTo: `/admin/fournisseurs/${supplier.id}`,
                }}
              />
              <AdminField label="Type note">
                <AdminSelect name="type" defaultValue="INFORMATION">
                  {Object.values(SupplierNoteType).map((type) => (
                    <option key={type} value={type}>
                      {supplierNoteTypeLabels[type]}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>
              <AdminField label="Note interne">
                <AdminTextarea name="content" rows={4} required />
              </AdminField>
              <Button type="submit" variant="primary" size="sm">
                <Plus size={16} />
                Ajouter note
              </Button>
            </form>
          </AdminPanel>
        </div>

        <AdminPanel title="Historique achats">
          {supplier.purchases.length ? (
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Reference</th>
                  <th className="px-3 py-3">Depot</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">Total</th>
                  <th className="px-3 py-3">Reste</th>
                  <th className="px-3 py-3">Action</th>
                </tr>
              </AdminTableHead>
              <tbody className="divide-y divide-white/10">
                {supplier.purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <AdminTableCell>{purchase.date}</AdminTableCell>
                    <AdminTableCell>{purchase.reference}</AdminTableCell>
                    <AdminTableCell>{purchase.depotName}</AdminTableCell>
                    <AdminTableCell>
                      <AdminStatusBadge tone={purchase.statusTone}>
                        {purchase.statusLabel}
                      </AdminStatusBadge>
                    </AdminTableCell>
                    <AdminTableCell>{purchase.totalLabel}</AdminTableCell>
                    <AdminTableCell>{purchase.remainingLabel}</AdminTableCell>
                    <AdminTableCell>
                      <Link
                        href={`/admin/achats-fournisseurs/${purchase.id}`}
                        className="text-sm font-bold text-nahda-olive hover:text-white"
                      >
                        Detail
                      </Link>
                    </AdminTableCell>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <AdminEmptyState
              title="Aucun achat"
              description="Creez un premier achat fournisseur pour alimenter l'historique."
            />
          )}
        </AdminPanel>

        <div className="grid gap-6 xl:grid-cols-2">
          <AdminPanel title="Produits achetes">
            {supplier.productsBought.length ? (
              <AdminTable>
                <AdminTableHead>
                  <tr>
                    <th className="px-3 py-3">Produit</th>
                    <th className="px-3 py-3">Qte</th>
                    <th className="px-3 py-3">Dernier prix</th>
                    <th className="px-3 py-3">Total</th>
                  </tr>
                </AdminTableHead>
                <tbody className="divide-y divide-white/10">
                  {supplier.productsBought.map((product) => (
                    <tr key={product.id}>
                      <AdminTableCell>
                        <Link
                          href={`/admin/produits/${product.id}`}
                          className="font-bold text-white hover:text-nahda-olive"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1 text-xs text-white/42">{product.sku}</p>
                      </AdminTableCell>
                      <AdminTableCell>{product.quantity}</AdminTableCell>
                      <AdminTableCell>{product.lastUnitBuyPriceLabel}</AdminTableCell>
                      <AdminTableCell>{product.totalLabel}</AdminTableCell>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            ) : (
              <AdminEmptyState title="Aucun produit" description="Aucun produit achete chez ce fournisseur." />
            )}
          </AdminPanel>

          <AdminPanel title="Notes fournisseur">
            {supplier.supplierNotes.length ? (
              <div className="space-y-3">
                {supplier.supplierNotes.map((note) => (
                  <article
                    key={note.id}
                    className="rounded-control border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <AdminStatusBadge tone="info">{note.typeLabel}</AdminStatusBadge>
                      <span className="text-xs text-white/38">{note.createdAt}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white/70">{note.content}</p>
                    <p className="mt-2 text-xs text-white/38">Par {note.author}</p>
                  </article>
                ))}
              </div>
            ) : (
              <AdminEmptyState title="Aucune note" description="Les notes privees fournisseur apparaitront ici." />
            )}
          </AdminPanel>
        </div>
      </div>
    </AdminLayout>
  );
}
