import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminEmptyState,
  AdminFeedback,
  AdminField,
  AdminHiddenFields,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
  AdminStatusBadge,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTextInput,
  AdminTextarea,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import {
  addSupplierPaymentAction,
  cancelSupplierPurchaseAction,
  receiveSupplierPurchaseAction,
} from "@/app/admin/fournisseurs/actions";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { getSingleQuery } from "@/lib/admin/pagination";
import { getAdminSupplierPurchaseById } from "@/lib/services/admin-suppliers";

export const dynamic = "force-dynamic";

export default async function SupplierPurchaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const baseAdmin = await requireAdminSection("suppliers");
  const canManagePayment =
    baseAdmin.role === "SUPER_ADMIN" ||
    baseAdmin.role === "MANAGER" ||
    baseAdmin.role === "ACCOUNTANT";
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const purchase = await getAdminSupplierPurchaseById(id);

  if (!purchase) notFound();

  const returnTo = `/admin/achats-fournisseurs/${purchase.id}`;

  return (
    <AdminLayout admin={baseAdmin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Achat fournisseur"
          title={`${purchase.documentTypeLabel} ${purchase.reference}`}
          description={`${purchase.supplierName} - ${purchase.depotName}`}
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Achats fournisseurs", href: "/admin/achats-fournisseurs" },
            { label: purchase.reference },
          ]}
          action={
            <Link
              href={`/admin/fournisseurs/${purchase.supplierId}`}
              className="inline-flex h-10 items-center justify-center rounded-control border border-white/10 px-4 text-sm font-bold text-white hover:bg-white/[0.08]"
            >
              Voir fournisseur
            </Link>
          }
        />
        <AdminFeedback
          success={getSingleQuery(query.success)}
          error={getSingleQuery(query.error)}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <AdminStatCard label="Total achat" value={purchase.totalLabel} />
          <AdminStatCard label="Total paye" value={purchase.paidLabel} tone="success" />
          <AdminStatCard
            label="Reste a payer"
            value={purchase.remainingLabel}
            tone={purchase.remaining > 0 ? "warning" : "success"}
          />
          <AdminStatCard label="Statut" value={purchase.statusLabel} tone={purchase.statusTone} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <AdminPanel title="Informations achat">
            <div className="grid gap-3 text-sm text-white/68 sm:grid-cols-2">
              <p><span className="font-black text-white">Fournisseur :</span> {purchase.supplierName}</p>
              <p><span className="font-black text-white">Type :</span> {purchase.supplierTypeLabel}</p>
              <p><span className="font-black text-white">Depot :</span> {purchase.depotName}</p>
              <p><span className="font-black text-white">Date :</span> {purchase.date}</p>
              <p><span className="font-black text-white">Recu le :</span> {purchase.receivedAt || "-"}</p>
              <p><span className="font-black text-white">Cree par :</span> {purchase.createdBy}</p>
              <p><span className="font-black text-white">Transport :</span> {purchase.transportFeeLabel}</p>
              <p><span className="font-black text-white">Douane :</span> {purchase.customsFeeLabel}</p>
              <p><span className="font-black text-white">Autres frais :</span> {purchase.otherFeeLabel}</p>
              <p>
                <span className="font-black text-white">Statut :</span>{" "}
                <AdminStatusBadge tone={purchase.statusTone}>{purchase.statusLabel}</AdminStatusBadge>
              </p>
            </div>
            {purchase.notes ? (
              <p className="mt-4 rounded-control border border-white/10 bg-white/[0.04] p-3 text-sm text-white/66">
                {purchase.notes}
              </p>
            ) : null}
          </AdminPanel>

          <AdminPanel title="Actions achat">
            <div className="space-y-3">
              {purchase.status === "DRAFT" ? (
                <form action={receiveSupplierPurchaseAction}>
                  <AdminHiddenFields values={{ purchaseId: purchase.id, returnTo }} />
                  <Button type="submit" variant="primary" className="w-full">
                    <CheckCircle2 size={16} />
                    Valider comme recu
                  </Button>
                </form>
              ) : null}
              {purchase.status === "DRAFT" ? (
                <form action={cancelSupplierPurchaseAction}>
                  <AdminHiddenFields values={{ purchaseId: purchase.id, returnTo }} />
                  <Button type="submit" variant="lightOutline" className="w-full">
                    <XCircle size={16} />
                    Annuler brouillon
                  </Button>
                </form>
              ) : null}
              {purchase.status !== "CANCELLED" && purchase.remaining > 0 && canManagePayment ? (
                <form action={addSupplierPaymentAction} className="space-y-3">
                  <AdminHiddenFields values={{ purchaseId: purchase.id, returnTo }} />
                  <AdminField label="Paiement partiel">
                    <AdminTextInput name="amount" type="number" placeholder="Montant" required />
                  </AdminField>
                  <AdminField label="Methode">
                    <AdminTextInput name="method" placeholder="Espece, virement..." />
                  </AdminField>
                  <AdminField label="Note">
                    <AdminTextarea name="note" rows={3} />
                  </AdminField>
                  <Button type="submit" variant="primary" className="w-full">
                    Ajouter paiement
                  </Button>
                </form>
              ) : null}
            </div>
          </AdminPanel>
        </div>

        <AdminPanel title="Produits achetes">
          {purchase.items.length ? (
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <th className="px-3 py-3">Produit</th>
                  <th className="px-3 py-3">Quantite</th>
                  <th className="px-3 py-3">Prix achat</th>
                  <th className="px-3 py-3">Prix achat actuel</th>
                  <th className="px-3 py-3">Total ligne</th>
                </tr>
              </AdminTableHead>
              <tbody className="divide-y divide-white/10">
                {purchase.items.map((item) => (
                  <tr key={item.id}>
                    <AdminTableCell>
                      <Link
                        href={`/admin/produits/${item.productId}`}
                        className="font-black text-white hover:text-nahda-olive"
                      >
                        {item.productName}
                      </Link>
                      <p className="mt-1 text-xs text-white/42">{item.productSku}</p>
                    </AdminTableCell>
                    <AdminTableCell>{item.quantity}</AdminTableCell>
                    <AdminTableCell>{item.unitBuyPriceLabel}</AdminTableCell>
                    <AdminTableCell>{item.currentBuyPriceLabel}</AdminTableCell>
                    <AdminTableCell>{item.totalLabel}</AdminTableCell>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <AdminEmptyState title="Aucun produit" description="Aucune ligne achat trouvee." />
          )}
        </AdminPanel>

        <AdminPanel title="Paiements fournisseur">
          {purchase.payments.length ? (
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Montant</th>
                  <th className="px-3 py-3">Methode</th>
                  <th className="px-3 py-3">Admin</th>
                  <th className="px-3 py-3">Note</th>
                </tr>
              </AdminTableHead>
              <tbody className="divide-y divide-white/10">
                {purchase.payments.map((payment) => (
                  <tr key={payment.id}>
                    <AdminTableCell>{payment.createdAt}</AdminTableCell>
                    <AdminTableCell>{payment.amountLabel}</AdminTableCell>
                    <AdminTableCell>{payment.method}</AdminTableCell>
                    <AdminTableCell>{payment.createdBy}</AdminTableCell>
                    <AdminTableCell>{payment.note || "-"}</AdminTableCell>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <AdminEmptyState
              title="Aucun paiement detaille"
              description="Les paiements partiels seront listes ici."
            />
          )}
        </AdminPanel>
      </div>
    </AdminLayout>
  );
}
