import Link from "next/link";
import { ShieldAlert, ShoppingCart, TrendingUp } from "lucide-react";
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
import { requireAdminSection } from "@/lib/auth/admin-auth";
import {
  canViewFinancialAnalytics,
  getSavAnalytics,
  getTopProductsByRevenue,
  logFinanceAccess,
  type AnalyticsRange,
} from "@/lib/services/admin-analytics";
import { getAdminPagination, getSingleQuery } from "@/lib/admin/pagination";

export const dynamic = "force-dynamic";

export default async function AdminProductAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("reports");
  const params = await searchParams;
  const range = getRange(params.range);
  const pagination = getAdminPagination({
    page: getSingleQuery(params.page),
    perPage: getSingleQuery(params.perPage),
  });
  await logFinanceAccess({ adminId: admin.id, page: "analytics-produits", range });
  const [products, sav] = await Promise.all([
    getTopProductsByRevenue({ range, pagination }),
    getSavAnalytics({ range }),
  ]);
  const includeFinancials = canViewFinancialAnalytics(admin.role);
  const totalRevenue = products.items.reduce((sum, product) => sum + product.revenue, 0);
  const totalSold = products.items.reduce((sum, product) => sum + product.quantity, 0);

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Analytics produits"
          title="Performance produits"
          description="Top produits vendus, revenu, rotation stock, SAV et demande."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Analytics", href: "/admin/analytics" },
            { label: "Produits" },
          ]}
        />

        <AdminPanel title="Filtres">
          <AdminFilterBar columns="sm:grid-cols-[220px_160px_auto]">
            <RangeSelect defaultValue={range} />
            <AdminSelect name="perPage" defaultValue={String(products.perPage)}>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </AdminSelect>
            <Button type="submit" variant="lightOutline">
              Appliquer
            </Button>
          </AdminFilterBar>
        </AdminPanel>

        <div className="grid gap-4 md:grid-cols-3">
          <AdminStatCard
            label="Revenu page"
            value={`${Math.round(totalRevenue).toLocaleString("fr-MA")} DH`}
            helper="Somme des lignes affichees"
            icon={<TrendingUp size={20} />}
            tone="success"
          />
          <AdminStatCard
            label="Quantites vendues"
            value={totalSold}
            helper="Produits affiches"
            icon={<ShoppingCart size={20} />}
            tone="info"
          />
          <AdminStatCard
            label="SAV periode"
            value={sav.total}
            helper={`${sav.open} ouverts`}
            icon={<ShieldAlert size={20} />}
            tone="warning"
          />
        </div>

        <AdminPanel title={`${products.total} produits vendus`}>
          {products.items.length ? (
            <>
              <AdminTable>
                <AdminTableHead>
                  <tr>
                    <th className="px-3 py-3">Produit</th>
                    <th className="px-3 py-3">Categorie</th>
                    <th className="px-3 py-3">Quantite</th>
                    <th className="px-3 py-3">Revenu</th>
                    <th className="px-3 py-3">Marge estimee</th>
                    <th className="px-3 py-3">Rotation</th>
                    <th className="px-3 py-3">SAV</th>
                  </tr>
                </AdminTableHead>
                <tbody className="divide-y divide-white/10">
                  {products.items.map((product) => (
                    <tr key={product.productId}>
                      <AdminTableCell>
                        <Link
                          href={`/admin/produits/${product.productId}`}
                          className="font-black text-white hover:text-nahda-olive"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1 text-xs text-white/44">{product.sku}</p>
                      </AdminTableCell>
                      <AdminTableCell>{product.category}</AdminTableCell>
                      <AdminTableCell>{product.quantity}</AdminTableCell>
                      <AdminTableCell>{product.revenueLabel}</AdminTableCell>
                      <AdminTableCell>
                        {includeFinancials ? product.estimatedMarginLabel : "Masquee"}
                      </AdminTableCell>
                      <AdminTableCell>{product.rotationLabel}</AdminTableCell>
                      <AdminTableCell>
                        <AdminStatusBadge tone={product.savCount ? "warning" : "muted"}>
                          {product.savCount}
                        </AdminStatusBadge>
                      </AdminTableCell>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
              <AdminPagination
                basePath="/admin/analytics/produits"
                searchParams={params}
                page={products.page}
                perPage={products.perPage}
                total={products.total}
                totalPages={products.totalPages}
              />
            </>
          ) : (
            <AdminEmptyState title="Aucune vente produit" description="Aucun produit vendu sur cette periode." />
          )}
        </AdminPanel>

        <AdminPanel title="Produits les plus problematiques SAV">
          {sav.productRows.length ? (
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <th className="px-3 py-3">Produit</th>
                  <th className="px-3 py-3">Categorie</th>
                  <th className="px-3 py-3">Tickets</th>
                  <th className="px-3 py-3">Taux SAV</th>
                </tr>
              </AdminTableHead>
              <tbody className="divide-y divide-white/10">
                {sav.productRows.slice(0, 10).map((product) => (
                  <tr key={product.productId}>
                    <AdminTableCell>
                      <p className="font-black text-white">{product.name}</p>
                      <p className="mt-1 text-xs text-white/44">{product.sku}</p>
                    </AdminTableCell>
                    <AdminTableCell>{product.category}</AdminTableCell>
                    <AdminTableCell>{product.tickets}</AdminTableCell>
                    <AdminTableCell>{product.rateLabel}</AdminTableCell>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <AdminEmptyState title="Aucun SAV produit" description="Aucun ticket SAV lie a un produit sur cette periode." />
          )}
        </AdminPanel>
      </div>
    </AdminLayout>
  );
}

function RangeSelect({ defaultValue }: { defaultValue: AnalyticsRange }) {
  return (
    <AdminSelect name="range" defaultValue={defaultValue}>
      <option value="today">Aujourd hui</option>
      <option value="7d">7 derniers jours</option>
      <option value="30d">30 derniers jours</option>
      <option value="month">Mois en cours</option>
      <option value="all">Toutes periodes</option>
    </AdminSelect>
  );
}

function getRange(value: string | string[] | undefined): AnalyticsRange {
  const single = getSingleQuery(value);
  return single === "today" ||
    single === "7d" ||
    single === "30d" ||
    single === "month" ||
    single === "all"
    ? single
    : "month";
}
