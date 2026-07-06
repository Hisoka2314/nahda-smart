import Link from "next/link";
import {
  AlertTriangle,
  Database,
  FileText,
  MessageSquare,
  ShieldAlert,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
  AdminStatusBadge,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
} from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth/admin-auth";
import {
  getOrderStatusTone,
  orderStatusLabels,
} from "@/lib/admin/labels";
import { getAdminDashboardData } from "@/lib/services/admin-dashboard";
import { getLeadFollowUps } from "@/lib/services/admin-contacts";
import {
  canViewFinancialAnalytics,
  getAdminKpiDashboard,
  logFinanceAccess,
} from "@/lib/services/admin-analytics";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const includeFinancials = canViewFinancialAnalytics(admin.role);
  const [dashboard, kpi, leadFollowUps] = await Promise.all([
    getAdminDashboardData(),
    getAdminKpiDashboard({
      range: "month",
      includeFinancials,
    }),
    getLeadFollowUps(),
    includeFinancials
      ? logFinanceAccess({ adminId: admin.id, page: "dashboard-kpi", range: "month" })
      : Promise.resolve(),
  ]);

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Nahda Smart Admin"
          title="Tableau de bord"
          description="Vue d'ensemble operationnelle et KPI ERP: commandes, revenus, marge estimee, SAV, stock et fournisseurs."
          action={
            <AdminStatusBadge tone={dashboard.dbConnected ? "success" : "danger"}>
              <Database size={14} className="mr-1" />
              DB connectee
            </AdminStatusBadge>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            label="CA total"
            value={kpi.stats.totalRevenueLabel}
            helper={kpi.rangeLabel}
            icon={<TrendingUp size={20} />}
            tone="success"
          />
          <AdminStatCard
            label="CA aujourd hui"
            value={kpi.stats.todayRevenueLabel}
            helper="Commandes actives du jour"
            icon={<TrendingUp size={20} />}
            tone="success"
          />
          <AdminStatCard
            label="Commandes aujourd'hui"
            value={kpi.stats.ordersToday}
            helper="Commandes creees depuis minuit"
            icon={<ShoppingCart size={20} />}
            tone="info"
          />
          <AdminStatCard
            label="Commandes en attente"
            value={kpi.stats.pendingOrders}
            helper="A confirmer par l'equipe"
            icon={<AlertTriangle size={20} />}
            tone="warning"
          />
          <AdminStatCard
            label="Devis nouveaux"
            value={kpi.stats.newQuotes}
            helper="Demandes a traiter"
            icon={<FileText size={20} />}
            tone="warning"
          />
          <AdminStatCard
            label="Contacts nouveaux"
            value={kpi.stats.newContacts}
            helper="Messages non lus"
            icon={<MessageSquare size={20} />}
            tone="info"
          />
          <AdminStatCard
            label="Marge estimee"
            value={kpi.stats.estimatedMarginLabel}
            helper="Visible finance seulement"
            icon={<Database size={20} />}
            tone={kpi.stats.estimatedMargin === null ? "muted" : "success"}
          />
          <AdminStatCard
            label="Tickets SAV ouverts"
            value={kpi.stats.openServiceTickets}
            helper="Hors clotures/refuses"
            icon={<ShieldAlert size={20} />}
            tone="warning"
          />
          <AdminStatCard
            label="Fournisseurs actifs"
            value={kpi.stats.activeSuppliers}
            helper="Base achats"
            icon={<Truck size={20} />}
            tone="info"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <AdminPanel
            title="Commandes recentes"
            action={
              <Link
                href="/admin/commandes"
                className="text-sm font-bold text-nahda-olive hover:text-white"
              >
                Voir tout
              </Link>
            }
          >
            {dashboard.recentOrders.length ? (
              <AdminTable>
                <AdminTableHead>
                  <tr>
                    <th className="px-3 py-3">Commande</th>
                    <th className="px-3 py-3">Client</th>
                    <th className="px-3 py-3">Total</th>
                    <th className="px-3 py-3">Statut</th>
                  </tr>
                </AdminTableHead>
                <tbody className="divide-y divide-white/10">
                  {dashboard.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <AdminTableCell>
                        <Link
                          href={`/admin/commandes/${order.id}`}
                          className="font-black text-white hover:text-nahda-olive"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="mt-1 text-xs text-white/42">
                          {order.createdAt}
                        </p>
                      </AdminTableCell>
                      <AdminTableCell>{order.customerName}</AdminTableCell>
                      <AdminTableCell>{order.totalLabel}</AdminTableCell>
                      <AdminTableCell>
                        <AdminStatusBadge tone={getOrderStatusTone(order.status)}>
                          {orderStatusLabels[order.status]}
                        </AdminStatusBadge>
                      </AdminTableCell>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            ) : (
              <AdminEmptyState
                title="Aucune commande recente"
                description="Les commandes du site apparaitront ici des qu'elles seront creees."
              />
            )}
          </AdminPanel>

          <AdminPanel
            title="Devis recents"
            action={
              <Link
                href="/admin/devis"
                className="text-sm font-bold text-nahda-olive hover:text-white"
              >
                Voir tout
              </Link>
            }
          >
            <div className="space-y-3">
              {dashboard.recentQuotes.length ? (
                dashboard.recentQuotes.map((quote) => (
                  <Link
                    href={`/admin/devis/${quote.id}`}
                    key={quote.id}
                    className="block rounded-control border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.07]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-black text-white">
                        {quote.quoteNumber}
                      </span>
                      <span className="text-xs text-white/44">
                        {quote.createdAt}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-white/62">
                      {quote.customerName} - {quote.status}
                    </p>
                  </Link>
                ))
              ) : (
                <AdminEmptyState
                  title="Aucun devis recent"
                  description="Les demandes de devis seront listees ici."
                />
              )}
            </div>
          </AdminPanel>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <AdminPanel title="Top produits commandes">
            {dashboard.topProducts.length ? (
              <div className="space-y-3">
                {dashboard.topProducts.map((product) => (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between gap-4 rounded-control border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div>
                      <p className="font-bold text-white">{product.name}</p>
                      <p className="mt-1 text-xs text-white/44">
                        Quantite vendue : {product.quantity}
                      </p>
                    </div>
                    <span className="font-black text-nahda-olive">
                      {product.revenueLabel}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <AdminEmptyState
                title="Pas encore de top produits"
                description="Les ventes consolidees apparaitront avec les commandes."
              />
            )}
          </AdminPanel>

          <AdminPanel
            title="Rappels leads du jour"
            action={
              <Link
                href="/admin/contacts"
                className="text-xs font-black text-nahda-olive hover:underline"
              >
                Voir les leads
              </Link>
            }
          >
            {leadFollowUps.newLeadsCount > 0 ? (
              <p className="mb-3 rounded-control border border-nahda-olive/25 bg-nahda-olive/[0.1] px-3 py-2 text-sm font-bold text-[#c8dd8f]">
                {leadFollowUps.newLeadsCount} nouveau
                {leadFollowUps.newLeadsCount > 1 ? "x" : ""} lead
                {leadFollowUps.newLeadsCount > 1 ? "s" : ""} à traiter
              </p>
            ) : null}
            {leadFollowUps.callbacks.length ? (
              <div className="space-y-3">
                {leadFollowUps.callbacks.map((lead) => (
                  <div
                    key={lead.id}
                    className={`rounded-control border p-4 ${
                      lead.overdue
                        ? "border-red-400/25 bg-red-400/[0.06]"
                        : "border-amber-400/20 bg-amber-400/[0.06]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-white">{lead.name}</p>
                        <a
                          href={`tel:${lead.phone}`}
                          className="mt-1 block text-xs font-bold text-nahda-olive hover:underline"
                        >
                          {lead.phone}
                        </a>
                        <p className="mt-1 text-xs text-white/46">{lead.subject}</p>
                      </div>
                      <AdminStatusBadge tone={lead.overdue ? "danger" : "warning"}>
                        {lead.overdue ? "En retard" : lead.callbackAt}
                      </AdminStatusBadge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AdminEmptyState
                title="Aucun rappel planifié aujourd'hui"
                description="Les leads à rappeler (échéance du jour ou dépassée) apparaîtront ici."
              />
            )}
          </AdminPanel>

          <AdminPanel title="Alertes stock faible">
            {dashboard.lowStockAlerts.length ? (
              <div className="space-y-3">
                {dashboard.lowStockAlerts.map((stock) => (
                  <div
                    key={stock.id}
                    className="rounded-control border border-amber-400/20 bg-amber-400/[0.06] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-white">{stock.productName}</p>
                        <p className="mt-1 text-xs text-white/46">
                          {stock.sku} - {stock.depotName}
                        </p>
                      </div>
                      <AdminStatusBadge tone="warning">
                        {stock.quantity}/{stock.threshold}
                      </AdminStatusBadge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AdminEmptyState
                title="Aucune alerte critique"
                description="Les seuils bas de stock seront signales ici."
              />
            )}
          </AdminPanel>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <AdminPanel
            title="Produits avec le plus de SAV"
            action={
              <Link
                href="/admin/analytics/produits"
                className="text-sm font-bold text-nahda-olive hover:text-white"
              >
                Analytics produits
              </Link>
            }
          >
            {kpi.topSavProducts.length ? (
              <div className="space-y-3">
                {kpi.topSavProducts.map((product) => (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between gap-4 rounded-control border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div>
                      <p className="font-bold text-white">{product.name}</p>
                      <p className="mt-1 text-xs text-white/44">
                        {product.category} - {product.sku}
                      </p>
                    </div>
                    <AdminStatusBadge tone="warning">
                      {product.tickets} SAV
                    </AdminStatusBadge>
                  </div>
                ))}
              </div>
            ) : (
              <AdminEmptyState
                title="Aucun SAV produit"
                description="Les tickets SAV lies aux produits apparaitront ici."
              />
            )}
          </AdminPanel>

          <AdminPanel
            title="Raccourcis analytics"
            description="Acces rapide aux vues finance, produits, clients, stock et SAV."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { href: "/admin/finance", label: "Finance", icon: TrendingUp },
                { href: "/admin/analytics/produits", label: "Produits", icon: ShoppingCart },
                { href: "/admin/analytics/clients", label: "Clients", icon: Users },
                { href: "/admin/analytics/stock", label: "Stock", icon: Database },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
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
