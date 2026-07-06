import Link from "next/link";
import { AlertTriangle, ReceiptText, ShieldAlert, TrendingUp } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminEmptyState,
  AdminFilterBar,
  AdminPageHeader,
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
import { getSingleQuery } from "@/lib/admin/pagination";
import {
  canViewFinancialAnalytics,
  getFinanceOverview,
  logFinanceAccess,
  type AnalyticsRange,
} from "@/lib/services/admin-analytics";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("revenues");
  const params = await searchParams;
  const range = getRange(params.range);
  const includeFinancials = canViewFinancialAnalytics(admin.role);
  await logFinanceAccess({ adminId: admin.id, page: "finance", range });
  const finance = await getFinanceOverview({ range, includeFinancials });

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Finance"
          title="Finance light ERP"
          description="Revenus, marge estimee, achats fournisseurs, commandes annulees et impact SAV. Donnees strictement admin."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Finance" },
          ]}
        />

        <AdminPanel title="Periode">
          <AdminFilterBar columns="sm:grid-cols-[220px_auto]">
            <RangeSelect defaultValue={range} />
            <Button type="submit" variant="lightOutline">
              Appliquer
            </Button>
          </AdminFilterBar>
        </AdminPanel>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            label="CA"
            value={finance.cards.revenue}
            helper={finance.rangeLabel}
            icon={<TrendingUp size={20} />}
            tone="success"
          />
          <AdminStatCard
            label="CA aujourd hui"
            value={finance.cards.revenueToday}
            helper="Commandes actives"
            icon={<TrendingUp size={20} />}
            tone="success"
          />
          <AdminStatCard
            label="Marge estimee"
            value={finance.cards.estimatedMargin}
            helper={`Taux: ${finance.cards.estimatedMarginRate}`}
            icon={<ReceiptText size={20} />}
            tone={includeFinancials ? "success" : "muted"}
          />
          <AdminStatCard
            label="Panier moyen"
            value={finance.cards.averageOrder}
            helper="Revenu / commandes"
            icon={<ReceiptText size={20} />}
            tone="info"
          />
          <AdminStatCard
            label="Achats fournisseurs"
            value={finance.cards.supplierTotal}
            helper={`Paye: ${finance.cards.supplierPaid}`}
            icon={<ReceiptText size={20} />}
            tone={includeFinancials ? "info" : "muted"}
          />
          <AdminStatCard
            label="Reste fournisseur"
            value={finance.cards.supplierRemaining}
            helper="Dette fournisseur estimee"
            icon={<AlertTriangle size={20} />}
            tone={includeFinancials ? "warning" : "muted"}
          />
          <AdminStatCard
            label="Commandes annulees"
            value={finance.cards.cancelledOrders}
            helper="Annulees ou retournees"
            icon={<AlertTriangle size={20} />}
            tone="warning"
          />
          <AdminStatCard
            label="Impact SAV"
            value={finance.cards.savImpact}
            helper={`${finance.cards.openTickets} tickets ouverts`}
            icon={<ShieldAlert size={20} />}
            tone="warning"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <AdminPanel title="Repartition statuts commandes">
            {finance.statusBreakdown.length ? (
              <AdminTable>
                <AdminTableHead>
                  <tr>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-3 py-3">Commandes</th>
                  </tr>
                </AdminTableHead>
                <tbody className="divide-y divide-white/10">
                  {finance.statusBreakdown.map((status) => (
                    <tr key={status.status}>
                      <AdminTableCell>{status.label}</AdminTableCell>
                      <AdminTableCell>
                        <AdminStatusBadge tone="muted">{status.count}</AdminStatusBadge>
                      </AdminTableCell>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            ) : (
              <AdminEmptyState title="Aucune commande" description="Aucune commande sur cette periode." />
            )}
          </AdminPanel>

          <AdminPanel
            title="Top clients par revenu"
            action={
              <Link href="/admin/analytics/clients" className="text-sm font-bold text-nahda-olive hover:text-white">
                Detail clients
              </Link>
            }
          >
            <div className="space-y-3">
              {finance.topClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between gap-4 rounded-control border border-white/10 bg-white/[0.04] p-4">
                  <div>
                    <p className="font-black text-white">{client.name}</p>
                    <p className="mt-1 text-xs text-white/44">{client.orderCount} commandes</p>
                  </div>
                  <span className="font-black text-nahda-olive">
                    {client.revenueLabel}
                  </span>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>

        <AdminPanel
          title="Top produits par revenu"
          action={
            <Link href="/admin/analytics/produits" className="text-sm font-bold text-nahda-olive hover:text-white">
              Detail produits
            </Link>
          }
        >
          {finance.topProducts.length ? (
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <th className="px-3 py-3">Produit</th>
                  <th className="px-3 py-3">Quantite</th>
                  <th className="px-3 py-3">Revenu</th>
                  <th className="px-3 py-3">Marge estimee</th>
                  <th className="px-3 py-3">SAV</th>
                </tr>
              </AdminTableHead>
              <tbody className="divide-y divide-white/10">
                {finance.topProducts.map((product) => (
                  <tr key={product.productId}>
                    <AdminTableCell>
                      <p className="font-black text-white">{product.name}</p>
                      <p className="mt-1 text-xs text-white/44">{product.sku}</p>
                    </AdminTableCell>
                    <AdminTableCell>{product.quantity}</AdminTableCell>
                    <AdminTableCell>{product.revenueLabel}</AdminTableCell>
                    <AdminTableCell>
                      {includeFinancials ? product.estimatedMarginLabel : "Masquee"}
                    </AdminTableCell>
                    <AdminTableCell>{product.savCount}</AdminTableCell>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <AdminEmptyState title="Aucun produit" description="Les revenus produits apparaitront ici." />
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
