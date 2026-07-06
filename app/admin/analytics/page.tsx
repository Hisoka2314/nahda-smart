import Link from "next/link";
import { Boxes, ShieldAlert, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminEmptyState,
  AdminFilterBar,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminStatCard,
  AdminStatusBadge,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { getSingleQuery } from "@/lib/admin/pagination";
import {
  getAnalyticsOverview,
  logFinanceAccess,
  type AnalyticsRange,
} from "@/lib/services/admin-analytics";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("reports");
  const params = await searchParams;
  const range = getRange(params.range);
  await logFinanceAccess({ adminId: admin.id, page: "analytics", range });
  const analytics = await getAnalyticsOverview({ range });

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Analytics"
          title="Analytics Nahda Smart"
          description="Lecture ERP des ventes, clients, stock et SAV. Les calculs restent cote serveur."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Analytics" },
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
            value={analytics.finance.cards.revenue}
            helper={analytics.finance.rangeLabel}
            icon={<TrendingUp size={20} />}
            tone="success"
          />
          <AdminStatCard
            label="Panier moyen"
            value={analytics.finance.cards.averageOrder}
            helper="Commandes actives"
            icon={<ShoppingCart size={20} />}
            tone="info"
          />
          <AdminStatCard
            label="Tickets SAV ouverts"
            value={analytics.sav.open}
            helper={`${analytics.sav.closed} clotures`}
            icon={<ShieldAlert size={20} />}
            tone="warning"
          />
          <AdminStatCard
            label="Stock faible"
            value={analytics.stock.lowCount}
            helper={`${analytics.stock.deadCount} lignes sans mouvement`}
            icon={<Boxes size={20} />}
            tone="warning"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <AdminPanel
            title="Top produits"
            action={<AdminTextLink href="/admin/analytics/produits" label="Voir produits" />}
          >
            {analytics.topProducts.length ? (
              <div className="space-y-3">
                {analytics.topProducts.map((product) => (
                  <div key={product.productId} className="rounded-control border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-black text-white">{product.name}</p>
                        <p className="mt-1 text-xs text-white/44">
                          {product.sku} - {product.category}
                        </p>
                      </div>
                      <span className="font-black text-nahda-olive">
                        {product.revenueLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AdminEmptyState title="Aucune vente" description="Les produits vendus apparaitront ici." />
            )}
          </AdminPanel>

          <AdminPanel
            title="Top clients"
            action={<AdminTextLink href="/admin/analytics/clients" label="Voir clients" />}
          >
            {analytics.topClients.length ? (
              <div className="space-y-3">
                {analytics.topClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between gap-4 rounded-control border border-white/10 bg-white/[0.04] p-4">
                    <div>
                      <p className="font-black text-white">{client.name}</p>
                      <p className="mt-1 text-xs text-white/44">
                        {client.phone} - {client.city}
                      </p>
                    </div>
                    <span className="font-black text-nahda-olive">
                      {client.revenueLabel}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <AdminEmptyState title="Aucun client" description="Les clients actifs apparaitront ici." />
            )}
          </AdminPanel>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <AdminPanel
            title="SAV analytics"
            action={<AdminTextLink href="/admin/sav" label="Tickets SAV" />}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniMetric label="Total" value={analytics.sav.total} />
              <MiniMetric label="Ouverts" value={analytics.sav.open} />
              <MiniMetric label="Resolution moyenne" value={analytics.sav.averageResolutionLabel} />
            </div>
            <div className="mt-4 space-y-2">
              {analytics.sav.byStatus.map((status) => (
                <div key={status.status} className="flex items-center justify-between rounded-control border border-white/10 bg-white/[0.035] px-4 py-3 text-sm">
                  <span className="text-white/70">{status.label}</span>
                  <AdminStatusBadge tone="muted">{status.count}</AdminStatusBadge>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel
            title="Navigation analytics"
            description="Vues detaillees par axe metier."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { href: "/admin/finance", label: "Finance", icon: TrendingUp },
                { href: "/admin/analytics/produits", label: "Produits", icon: ShoppingCart },
                { href: "/admin/analytics/clients", label: "Clients", icon: Users },
                { href: "/admin/analytics/stock", label: "Stock", icon: Boxes },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={`${item.href}?range=${range}`}
                  className="flex items-center gap-3 rounded-control border border-white/10 bg-white/[0.04] p-4 text-sm font-black text-white hover:bg-white/[0.08]"
                >
                  <item.icon size={18} className="text-nahda-olive" />
                  {item.label}
                </Link>
              ))}
            </div>
          </AdminPanel>
        </div>
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

function AdminTextLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-sm font-bold text-nahda-olive hover:text-white">
      {label}
    </Link>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-control border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase text-white/42">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
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
