import { SupplierPurchaseStatus } from "@prisma/client";
import Link from "next/link";
import { Eye, Plus } from "lucide-react";
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
  supplierPurchaseStatusLabels,
} from "@/lib/admin/labels";
import { getAdminPagination, getSingleQuery } from "@/lib/admin/pagination";
import { getAdminSupplierPurchasesPage } from "@/lib/services/admin-suppliers";

export const dynamic = "force-dynamic";

export default async function AdminSupplierPurchasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("suppliers");
  const params = await searchParams;
  const pagination = getAdminPagination({
    page: getSingleQuery(params.page),
    perPage: getSingleQuery(params.perPage),
  });
  const filters = {
    q: getSingleQuery(params.q),
    status: getPurchaseStatus(params.status),
  };
  const purchases = await getAdminSupplierPurchasesPage(filters, pagination);

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Achats"
          title="Achats fournisseurs"
          description="Suivez les factures, paiements, restes a payer et entrees stock."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Achats fournisseurs" },
          ]}
          action={
            <Link href="/admin/fournisseurs">
              <Button variant="primary" size="sm">
                <Plus size={16} />
                Choisir fournisseur
              </Button>
            </Link>
          }
        />
        <AdminFeedback
          success={getSingleQuery(params.success)}
          error={getSingleQuery(params.error)}
        />

        <AdminPanel title="Filtres achats">
          <AdminFilterBar columns="lg:grid-cols-[1.8fr_1fr_160px_auto]">
            <AdminSearchBox
              placeholder="Reference, fournisseur, produit, SKU..."
              defaultValue={filters.q}
            />
            <AdminSelect name="status" defaultValue={filters.status}>
              <option value="">Tous statuts</option>
              {Object.values(SupplierPurchaseStatus).map((status) => (
                <option key={status} value={status}>
                  {supplierPurchaseStatusLabels[status]}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect name="perPage" defaultValue={String(purchases.perPage)}>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </AdminSelect>
            <Button type="submit" variant="lightOutline" size="sm">
              Filtrer
            </Button>
          </AdminFilterBar>
        </AdminPanel>

        <AdminPanel title={`${purchases.total} achats`}>
          {purchases.items.length ? (
            <>
              <AdminTable>
                <AdminTableHead>
                  <tr>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Fournisseur</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Reference</th>
                    <th className="px-3 py-3">Depot</th>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-3 py-3">Articles</th>
                    <th className="px-3 py-3">Total</th>
                    <th className="px-3 py-3">Reste</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </AdminTableHead>
                <tbody className="divide-y divide-white/10">
                  {purchases.items.map((purchase) => (
                    <tr key={purchase.id}>
                      <AdminTableCell>{purchase.date}</AdminTableCell>
                      <AdminTableCell>
                        <Link
                          href={`/admin/fournisseurs/${purchase.supplierId}`}
                          className="font-black text-white hover:text-nahda-olive"
                        >
                          {purchase.supplierName}
                        </Link>
                        <p className="mt-1 text-xs text-white/44">
                          {purchase.supplierTypeLabel}
                        </p>
                      </AdminTableCell>
                      <AdminTableCell>{purchase.documentTypeLabel}</AdminTableCell>
                      <AdminTableCell>{purchase.reference}</AdminTableCell>
                      <AdminTableCell>{purchase.depotName}</AdminTableCell>
                      <AdminTableCell>
                        <AdminStatusBadge tone={purchase.statusTone}>
                          {purchase.statusLabel}
                        </AdminStatusBadge>
                      </AdminTableCell>
                      <AdminTableCell>
                        {purchase.itemCount} lignes / {purchase.quantityTotal} pcs
                      </AdminTableCell>
                      <AdminTableCell>{purchase.totalLabel}</AdminTableCell>
                      <AdminTableCell>
                        <AdminStatusBadge tone={purchase.remaining > 0 ? "warning" : "success"}>
                          {purchase.remainingLabel}
                        </AdminStatusBadge>
                      </AdminTableCell>
                      <AdminTableCell>
                        <Link
                          href={`/admin/achats-fournisseurs/${purchase.id}`}
                          className="inline-flex h-9 items-center gap-1 rounded-control border border-white/10 px-3 text-xs font-bold text-white hover:bg-white/[0.08]"
                        >
                          <Eye size={14} />
                          Detail
                        </Link>
                      </AdminTableCell>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
              <AdminPagination
                basePath="/admin/achats-fournisseurs"
                searchParams={params}
                page={purchases.page}
                perPage={purchases.perPage}
                total={purchases.total}
                totalPages={purchases.totalPages}
              />
            </>
          ) : (
            <AdminEmptyState
              title="Aucun achat fournisseur"
              description="Creez un achat depuis la fiche d'un fournisseur."
            />
          )}
        </AdminPanel>
      </div>
    </AdminLayout>
  );
}

function getPurchaseStatus(value: string | string[] | undefined) {
  const single = getSingleQuery(value);
  return single &&
    Object.values(SupplierPurchaseStatus).includes(single as SupplierPurchaseStatus)
    ? (single as SupplierPurchaseStatus)
    : undefined;
}
