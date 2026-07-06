import Link from "next/link";
import { Building2, ShoppingCart, Users } from "lucide-react";
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
  customerLevelLabels,
  customerRelationshipStatusLabels,
  customerTypeLabels,
  getCustomerRelationshipTone,
} from "@/lib/admin/labels";
import { getAdminPagination, getSingleQuery } from "@/lib/admin/pagination";
import {
  getTopClientsByRevenue,
  logFinanceAccess,
  type AnalyticsRange,
} from "@/lib/services/admin-analytics";

export const dynamic = "force-dynamic";

export default async function AdminClientAnalyticsPage({
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
  await logFinanceAccess({ adminId: admin.id, page: "analytics-clients", range });
  const clients = await getTopClientsByRevenue({ range, pagination });

  const revenue = clients.items.reduce((sum, client) => sum + client.revenue, 0);
  const orderCount = clients.items.reduce((sum, client) => sum + client.orderCount, 0);
  const b2bCount = clients.items.filter((client) => client.type !== "INDIVIDUAL").length;
  const vipCount = clients.items.filter(
    (client) => client.level === "VIP" || client.relationshipStatus === "VIP",
  ).length;

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Analytics clients"
          title="CRM intelligence"
          description="Top clients, segmentation B2B/B2C, panier moyen et clients frequents."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Analytics", href: "/admin/analytics" },
            { label: "Clients" },
          ]}
        />

        <AdminPanel title="Filtres">
          <AdminFilterBar columns="sm:grid-cols-[220px_160px_auto]">
            <RangeSelect defaultValue={range} />
            <AdminSelect name="perPage" defaultValue={String(clients.perPage)}>
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
            label="Revenu page"
            value={`${Math.round(revenue).toLocaleString("fr-MA")} DH`}
            helper="Clients affiches"
            icon={<ShoppingCart size={20} />}
            tone="success"
          />
          <AdminStatCard
            label="Panier moyen"
            value={`${Math.round(orderCount ? revenue / orderCount : 0).toLocaleString("fr-MA")} DH`}
            helper={`${orderCount} commandes`}
            icon={<ShoppingCart size={20} />}
            tone="info"
          />
          <AdminStatCard
            label="Clients VIP"
            value={vipCount}
            helper="VIP ou relation VIP"
            icon={<Users size={20} />}
            tone="success"
          />
          <AdminStatCard
            label="Clients B2B"
            value={b2bCount}
            helper={`${clients.items.length - b2bCount} B2C`}
            icon={<Building2 size={20} />}
            tone="info"
          />
        </div>

        <AdminPanel title={`${clients.total} clients actifs`}>
          {clients.items.length ? (
            <>
              <AdminTable>
                <AdminTableHead>
                  <tr>
                    <th className="px-3 py-3">Client</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Relation</th>
                    <th className="px-3 py-3">Commandes</th>
                    <th className="px-3 py-3">Articles</th>
                    <th className="px-3 py-3">Revenu</th>
                    <th className="px-3 py-3">Panier moyen</th>
                    <th className="px-3 py-3">Dernier achat</th>
                  </tr>
                </AdminTableHead>
                <tbody className="divide-y divide-white/10">
                  {clients.items.map((client) => (
                    <tr key={client.id}>
                      <AdminTableCell>
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="font-black text-white hover:text-nahda-olive"
                        >
                          {client.name}
                        </Link>
                        <p className="mt-1 text-xs text-white/44">
                          {client.phone} - {client.city}
                        </p>
                      </AdminTableCell>
                      <AdminTableCell>{customerTypeLabels[client.type]}</AdminTableCell>
                      <AdminTableCell>
                        <div className="flex flex-col gap-2">
                          <AdminStatusBadge
                            tone={getCustomerRelationshipTone(client.relationshipStatus)}
                          >
                            {customerRelationshipStatusLabels[client.relationshipStatus]}
                          </AdminStatusBadge>
                          <span className="text-xs text-white/44">
                            {customerLevelLabels[client.level]}
                          </span>
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>{client.orderCount}</AdminTableCell>
                      <AdminTableCell>{client.itemCount}</AdminTableCell>
                      <AdminTableCell>{client.revenueLabel}</AdminTableCell>
                      <AdminTableCell>{client.averageOrderLabel}</AdminTableCell>
                      <AdminTableCell>{client.lastOrderLabel}</AdminTableCell>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
              <AdminPagination
                basePath="/admin/analytics/clients"
                searchParams={params}
                page={clients.page}
                perPage={clients.perPage}
                total={clients.total}
                totalPages={clients.totalPages}
              />
            </>
          ) : (
            <AdminEmptyState
              title="Aucun client actif"
              description="Les clients avec commandes apparaitront dans cette vue."
            />
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
