import Link from "next/link";
import { Boxes, Gauge, PackageSearch, Warehouse } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminEmptyState,
  AdminFilterBar,
  AdminPageHeader,
  AdminPagination,
  AdminPanel,
  AdminSelect,
  AdminStatCard,
  AdminStatusBadge,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/admin-auth";
import {
  canViewFinancialAnalytics,
  getStockIntelligence,
  logFinanceAccess,
} from "@/lib/services/admin-analytics";
import { getAdminPagination, getSingleQuery } from "@/lib/admin/pagination";

export const dynamic = "force-dynamic";

export default async function AdminStockAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireRole([
    "SUPER_ADMIN",
    "MANAGER",
    "ACCOUNTANT",
    "STOCK_MANAGER",
  ]);
  const params = await searchParams;
  const pagination = getAdminPagination({
    page: getSingleQuery(params.page),
    perPage: getSingleQuery(params.perPage),
  });
  const includeFinancials = canViewFinancialAnalytics(admin.role);
  await logFinanceAccess({ adminId: admin.id, page: "analytics-stock" });
  const stock = await getStockIntelligence({ pagination });

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Analytics stock"
          title="Stock intelligence"
          description="Stock faible, rotation, stock mort et repartition par depot."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Analytics", href: "/admin/analytics" },
            { label: "Stock" },
          ]}
        />

        <AdminPanel title="Affichage">
          <AdminFilterBar columns="sm:grid-cols-[160px_auto]">
            <AdminSelect name="perPage" defaultValue={String(stock.rows.perPage)}>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </AdminSelect>
            <Button type="submit" variant="lightOutline">
              Appliquer
            </Button>
          </AdminFilterBar>
        </AdminPanel>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            label="Stock faible"
            value={stock.lowCount}
            helper="Lignes sous seuil"
            icon={<PackageSearch size={20} />}
            tone="warning"
          />
          <AdminStatCard
            label="Stock mort"
            value={stock.deadCount}
            helper="Sans mouvement"
            icon={<Boxes size={20} />}
            tone="warning"
          />
          <AdminStatCard
            label="Rotation rapide"
            value={stock.fastRotation}
            helper="Demande >= stock"
            icon={<Gauge size={20} />}
            tone="success"
          />
          <AdminStatCard
            label="Rotation lente"
            value={stock.slowRotation}
            helper="Demande faible"
            icon={<Gauge size={20} />}
            tone="muted"
          />
        </div>

        <AdminPanel title="Stock par depot">
          {stock.stockByDepot.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {stock.stockByDepot.map((depot) => (
                <div key={depot.depotName} className="rounded-control border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-white">{depot.depotName}</p>
                      <p className="mt-2 text-sm text-white/52">
                        {depot.quantity} unites - {depot.low} lignes faibles
                      </p>
                      {includeFinancials ? (
                        <p className="mt-2 text-sm font-black text-nahda-olive">
                          {depot.valueLabel}
                        </p>
                      ) : null}
                    </div>
                    <Warehouse size={20} className="text-nahda-olive" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState title="Aucun depot" description="Les stocks par depot apparaitront ici." />
          )}
        </AdminPanel>

        <AdminPanel title={`${stock.rows.total} lignes analysees`}>
          {stock.rows.items.length ? (
            <>
              <AdminTable>
                <AdminTableHead>
                  <tr>
                    <th className="px-3 py-3">Produit</th>
                    <th className="px-3 py-3">Depot</th>
                    <th className="px-3 py-3">Stock</th>
                    <th className="px-3 py-3">Demande</th>
                    <th className="px-3 py-3">Mouvements</th>
                    <th className="px-3 py-3">Rotation</th>
                    <th className="px-3 py-3">Valorisation</th>
                  </tr>
                </AdminTableHead>
                <tbody className="divide-y divide-white/10">
                  {stock.rows.items.map((row) => (
                    <tr key={row.id}>
                      <AdminTableCell>
                        <Link
                          href={`/admin/produits/${row.productId}`}
                          className="font-black text-white hover:text-nahda-olive"
                        >
                          {row.productName}
                        </Link>
                        <p className="mt-1 text-xs text-white/44">
                          {row.sku} - {row.brand} - {row.category}
                        </p>
                      </AdminTableCell>
                      <AdminTableCell>{row.depotName}</AdminTableCell>
                      <AdminTableCell>
                        <AdminStatusBadge tone={row.isLow ? "warning" : "success"}>
                          {row.quantity} / seuil {row.threshold}
                        </AdminStatusBadge>
                      </AdminTableCell>
                      <AdminTableCell>{row.demand}</AdminTableCell>
                      <AdminTableCell>
                        <p>{row.movementCount}</p>
                        <p className="mt-1 text-xs text-white/42">
                          cumul {row.movementQuantity}
                        </p>
                      </AdminTableCell>
                      <AdminTableCell>
                        <AdminStatusBadge
                          tone={row.rotation >= 1 ? "success" : row.rotation > 0 ? "info" : "muted"}
                        >
                          {row.rotation.toFixed(2)}
                        </AdminStatusBadge>
                      </AdminTableCell>
                      <AdminTableCell>
                        {includeFinancials ? row.stockValueLabel : "Masquee"}
                      </AdminTableCell>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
              <AdminPagination
                basePath="/admin/analytics/stock"
                searchParams={params}
                page={stock.rows.page}
                perPage={stock.rows.perPage}
                total={stock.rows.total}
                totalPages={stock.rows.totalPages}
              />
            </>
          ) : (
            <AdminEmptyState title="Aucune ligne stock" description="Les analyses stock apparaitront ici." />
          )}
        </AdminPanel>
      </div>
    </AdminLayout>
  );
}
