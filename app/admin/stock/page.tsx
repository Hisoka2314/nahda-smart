import Link from "next/link";
import { StockMovementType } from "@prisma/client";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminEmptyState,
  AdminFeedback,
  AdminField,
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
  AdminTextInput,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { stockMovementTypeLabels } from "@/lib/admin/labels";
import { getAdminDepots } from "@/lib/services/admin-depots";
import {
  getAdminStockMovements,
  getAdminStockRowsPage,
} from "@/lib/services/admin-stock";
import { getAdminProducts } from "@/lib/services/admin-products";
import { createStockMovementAction } from "@/app/admin/stock/actions";
import { getAdminPagination, getSingleQuery } from "@/lib/admin/pagination";

export const dynamic = "force-dynamic";

export default async function AdminStockPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("stock");
  const params = await searchParams;
  const pagination = getAdminPagination({
    page: getSingleQuery(params.page),
    perPage: getSingleQuery(params.perPage),
  });
  const filters = {
    q: getSingleQuery(params.q),
    depotId: getSingleQuery(params.depotId),
    stock: getStockFilter(params.stock),
  };
  const [rowsPage, movements, depots, products] = await Promise.all([
    getAdminStockRowsPage(filters, pagination),
    getAdminStockMovements(),
    getAdminDepots(),
    getAdminProducts({}),
  ]);
  const rows = rowsPage.items;

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Inventaire"
          title="Stock"
          description="Pilotez le stock par depot uniquement via des mouvements historises."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Stock" },
          ]}
        />
        <AdminFeedback
          success={getSingleQuery(params.success)}
          error={getSingleQuery(params.error)}
        />

        <AdminPanel title="Filtres stock">
          <AdminFilterBar columns="lg:grid-cols-[1.4fr_1fr_1fr_160px_auto_auto]">
            <AdminSearchBox placeholder="Produit, SKU, marque..." defaultValue={filters.q} />
            <AdminSelect name="depotId" defaultValue={filters.depotId}>
              <option value="">Tous depots</option>
              {depots.map((depot) => (
                <option key={depot.id} value={depot.id}>
                  {depot.name}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect name="stock" defaultValue={filters.stock}>
              <option value="">Tous niveaux</option>
              <option value="low">Stock faible</option>
              <option value="out">Rupture</option>
            </AdminSelect>
            <AdminSelect name="perPage" defaultValue={String(rowsPage.perPage)}>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </AdminSelect>
            <Button type="submit" variant="lightOutline">Filtrer</Button>
            <Link
              href="/admin/stock"
              className="inline-flex h-11 items-center justify-center rounded-control border border-white/10 px-3 text-sm font-bold text-white/68 hover:bg-white/[0.08]"
            >
              Reset
            </Link>
          </AdminFilterBar>
        </AdminPanel>

        <AdminPanel
          title="Creer un mouvement"
          description="Les sorties et transferts sont refuses si le stock devient negatif."
        >
          <form action={createStockMovementAction} className="grid gap-3 lg:grid-cols-4">
            <input type="hidden" name="returnTo" value="/admin/stock" />
            <AdminField label="Produit">
              <AdminSelect name="productId">
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.sku}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Depot">
              <AdminSelect name="depotId">
                {depots.map((depot) => (
                  <option key={depot.id} value={depot.id}>
                    {depot.name}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Depot destination">
              <AdminSelect name="targetDepotId">
                <option value="">Seulement transfert</option>
                {depots.map((depot) => (
                  <option key={depot.id} value={depot.id}>
                    {depot.name}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Type">
              <AdminSelect name="type">
                {Object.values(StockMovementType)
                  .filter((type) => !["RESERVED", "RELEASED"].includes(type))
                  .map((type) => (
                    <option key={type} value={type}>
                      {stockMovementTypeLabels[type]}
                    </option>
                  ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Quantite (± pour Ajustement)">
              <AdminTextInput name="quantity" type="number" required />
            </AdminField>
            <AdminField label="Seuil">
              <AdminTextInput name="lowStockThreshold" type="number" defaultValue={3} />
            </AdminField>
            <AdminField label="Reference">
              <AdminTextInput name="reference" />
            </AdminField>
            <AdminField label="Raison">
              <AdminTextInput name="reason" />
            </AdminField>
            <Button type="submit" className="lg:col-span-4">Enregistrer mouvement</Button>
          </form>
        </AdminPanel>

        <AdminPanel title={`${rowsPage.total} lignes stock`}>
          {rows.length ? (
            <>
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <th className="px-3 py-3">Produit</th>
                  <th className="px-3 py-3">Depot</th>
                  <th className="px-3 py-3">Quantite</th>
                  <th className="px-3 py-3">Seuil</th>
                  <th className="px-3 py-3">CMUP</th>
                  <th className="px-3 py-3">Action</th>
                </tr>
              </AdminTableHead>
              <tbody className="divide-y divide-white/10">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <AdminTableCell>
                      <Link
                        href={`/admin/produits/${row.productId}`}
                        className="font-black text-white hover:text-nahda-olive"
                      >
                        {row.productName}
                      </Link>
                      <p className="mt-1 text-xs text-white/42">{row.productSku} - {row.brandName}</p>
                    </AdminTableCell>
                    <AdminTableCell>{row.depotName}</AdminTableCell>
                    <AdminTableCell>
                      <AdminStatusBadge tone={row.tone}>{row.quantity}</AdminStatusBadge>
                    </AdminTableCell>
                    <AdminTableCell>{row.lowStockThreshold}</AdminTableCell>
                    <AdminTableCell>{row.averageCostLabel}</AdminTableCell>
                    <AdminTableCell>
                      <Link
                        href={`/admin/produits/${row.productId}`}
                        className="text-sm font-bold text-nahda-olive hover:text-white"
                      >
                        Detail
                      </Link>
                    </AdminTableCell>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
            <AdminPagination
              basePath="/admin/stock"
              searchParams={params}
              page={rowsPage.page}
              perPage={rowsPage.perPage}
              total={rowsPage.total}
              totalPages={rowsPage.totalPages}
            />
            </>
          ) : (
            <AdminEmptyState title="Aucun stock" description="Creez un mouvement pour alimenter le stock." />
          )}
        </AdminPanel>

        <AdminPanel title="Derniers mouvements">
          {movements.length ? (
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Produit</th>
                  <th className="px-3 py-3">Depot</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Quantite</th>
                  <th className="px-3 py-3">Raison</th>
                </tr>
              </AdminTableHead>
              <tbody className="divide-y divide-white/10">
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <AdminTableCell>{movement.createdAt}</AdminTableCell>
                    <AdminTableCell>{movement.productName}</AdminTableCell>
                    <AdminTableCell>{movement.depotName}</AdminTableCell>
                    <AdminTableCell>{movement.typeLabel}</AdminTableCell>
                    <AdminTableCell>{movement.quantity}</AdminTableCell>
                    <AdminTableCell>{movement.reason || "-"}</AdminTableCell>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <AdminEmptyState title="Aucun mouvement" description="Les mouvements apparaitront ici." />
          )}
        </AdminPanel>
      </div>
    </AdminLayout>
  );
}

function getStockFilter(value: string | string[] | undefined): "low" | "out" | undefined {
  const single = getSingleQuery(value);
  return single === "low" || single === "out" ? single : undefined;
}
