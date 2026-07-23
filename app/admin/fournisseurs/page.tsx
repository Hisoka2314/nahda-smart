import { SupplierType } from "@prisma/client";
import Link from "next/link";
import { Eye, Pencil, Plus, ReceiptText } from "lucide-react";
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
import { AdminExportActions } from "@/components/admin/admin-export-actions";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { supplierTypeLabels } from "@/lib/admin/labels";
import { getAdminPagination, getSingleQuery } from "@/lib/admin/pagination";
import { getAdminSuppliersPage } from "@/lib/services/admin-suppliers";

export const dynamic = "force-dynamic";

export default async function AdminSuppliersPage({
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
    type: getSupplierType(params.type),
    city: getSingleQuery(params.city),
    debt: getSingleQuery(params.debt) === "with-debt" ? "with-debt" as const : undefined,
    status: getSupplierStatus(params.status),
  };
  const suppliers = await getAdminSuppliersPage(filters, pagination);

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Achats & fournisseurs"
          title="Fournisseurs"
          description="Suivez les importateurs, grossistes, revendeurs et achats avec dette fournisseur."
          breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Fournisseurs" }]}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <AdminExportActions dataset="fournisseurs" />
              <Link href="/admin/fournisseurs/nouveau">
                <Button variant="primary" size="sm">
                  <Plus size={16} />
                  Nouveau fournisseur
                </Button>
              </Link>
            </div>
          }
        />

        <AdminFeedback
          success={getSingleQuery(params.success)}
          error={getSingleQuery(params.error)}
        />

        <AdminPanel title="Filtres fournisseurs">
          <AdminFilterBar columns="xl:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))_auto]">
            <AdminSearchBox
              placeholder="Code fournisseur, nom, telephone..."
              defaultValue={filters.q}
            />
            <AdminSelect name="type" defaultValue={filters.type}>
              <option value="">Tous types</option>
              {Object.values(SupplierType).map((type) => (
                <option key={type} value={type}>
                  {supplierTypeLabels[type]}
                </option>
              ))}
            </AdminSelect>
            <AdminTextCity defaultValue={filters.city} />
            <AdminSelect name="debt" defaultValue={filters.debt}>
              <option value="">Tous soldes</option>
              <option value="with-debt">Avec reste a payer</option>
            </AdminSelect>
            <AdminSelect name="status" defaultValue={filters.status}>
              <option value="">Tous statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </AdminSelect>
            <Button type="submit" variant="lightOutline" size="sm">
              Filtrer
            </Button>
          </AdminFilterBar>
        </AdminPanel>

        <AdminPanel title={`${suppliers.total} fournisseurs`}>
          {suppliers.items.length ? (
            <>
              <AdminTable>
                <AdminTableHead>
                  <tr>
                    <th className="px-3 py-3">Fournisseur</th>
                    <th className="px-3 py-3">Type / ville</th>
                    <th className="px-3 py-3">Achats</th>
                    <th className="px-3 py-3">Total achats</th>
                    <th className="px-3 py-3">Paye</th>
                    <th className="px-3 py-3">Reste</th>
                    <th className="px-3 py-3">Dernier achat</th>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </AdminTableHead>
                <tbody className="divide-y divide-white/10">
                  {suppliers.items.map((supplier) => (
                    <tr key={supplier.id}>
                      <AdminTableCell>
                        <Link
                          href={`/admin/fournisseurs/${supplier.id}`}
                          className="font-black text-white hover:text-nahda-olive"
                        >
                          {supplier.name}
                        </Link>
                        <p className="mt-1 text-xs text-white/44">
                          <span className="font-black text-nahda-olive">
                            {supplier.reference}
                          </span>{" "}
                          · {supplier.phone}
                        </p>
                        {supplier.email ? (
                          <p className="mt-1 text-xs text-white/38">
                            {supplier.email}
                          </p>
                        ) : null}
                      </AdminTableCell>
                      <AdminTableCell>
                        <p>{supplier.typeLabel}</p>
                        <p className="mt-1 text-xs text-white/44">{supplier.city}</p>
                      </AdminTableCell>
                      <AdminTableCell>{supplier.purchaseCount}</AdminTableCell>
                      <AdminTableCell>{supplier.totalPurchasesLabel}</AdminTableCell>
                      <AdminTableCell>{supplier.totalPaidLabel}</AdminTableCell>
                      <AdminTableCell>
                        <AdminStatusBadge tone={supplier.remaining > 0 ? "warning" : "success"}>
                          {supplier.remainingLabel}
                        </AdminStatusBadge>
                      </AdminTableCell>
                      <AdminTableCell>{supplier.lastPurchaseAt}</AdminTableCell>
                      <AdminTableCell>
                        <AdminStatusBadge tone={supplier.isActive ? "success" : "muted"}>
                          {supplier.isActive ? "Actif" : "Inactif"}
                        </AdminStatusBadge>
                      </AdminTableCell>
                      <AdminTableCell>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Link className="inline-flex h-9 items-center gap-1 rounded-control border border-white/10 px-3 text-xs font-bold text-white hover:bg-white/[0.08]" href={`/admin/fournisseurs/${supplier.id}`}>
                            <Eye size={14} /> Voir
                          </Link>
                          <Link className="inline-flex h-9 items-center gap-1 rounded-control border border-white/10 px-3 text-xs font-bold text-white hover:bg-white/[0.08]" href={`/admin/fournisseurs/${supplier.id}/modifier`}>
                            <Pencil size={14} /> Modifier
                          </Link>
                          <Link className="inline-flex h-9 items-center gap-1 rounded-control bg-nahda-olive px-3 text-xs font-bold text-white hover:bg-nahda-olive-dark" href={`/admin/fournisseurs/${supplier.id}/achat`}>
                            <ReceiptText size={14} /> Achat
                          </Link>
                        </div>
                      </AdminTableCell>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
              <AdminPagination
                basePath="/admin/fournisseurs"
                searchParams={params}
                page={suppliers.page}
                perPage={suppliers.perPage}
                total={suppliers.total}
                totalPages={suppliers.totalPages}
              />
            </>
          ) : (
            <AdminEmptyState
              title="Aucun fournisseur trouve"
              description="Ajoutez un fournisseur ou ajustez les filtres."
            />
          )}
        </AdminPanel>
      </div>
    </AdminLayout>
  );
}

function AdminTextCity({ defaultValue }: { defaultValue?: string }) {
  return (
    <input
      name="city"
      defaultValue={defaultValue}
      placeholder="Ville"
      className="h-10 rounded-control border border-white/10 bg-[#0c1718] px-3 text-sm font-semibold text-white outline-none placeholder:text-white/34 focus:border-nahda-olive/70"
    />
  );
}

function getSupplierType(value: string | string[] | undefined) {
  const single = getSingleQuery(value);
  return single && Object.values(SupplierType).includes(single as SupplierType)
    ? (single as SupplierType)
    : undefined;
}

function getSupplierStatus(value: string | string[] | undefined): "active" | "inactive" | undefined {
  const single = getSingleQuery(value);
  return single === "active" || single === "inactive" ? single : undefined;
}
