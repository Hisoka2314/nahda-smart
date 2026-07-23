import Link from "next/link";
import {
  CustomerType,
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
} from "@prisma/client";
import { Check, Eye } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
  AdminSearchBox,
  AdminSelect,
  AdminStatusBadge,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { AdminConfirmSubmit } from "@/components/admin/admin-confirm-submit";
import { AdminExportActions } from "@/components/admin/admin-export-actions";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import {
  customerTypeLabels,
  deliveryMethodLabels,
  getOrderStatusTone,
  orderStatusLabels,
  paymentMethodLabels,
} from "@/lib/admin/labels";
import { getAdminOrders } from "@/lib/services/admin-orders";
import {
  cancelStaleOrdersAction,
  updateOrderStatusAction,
} from "@/app/admin/commandes/actions";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("orders");
  const params = await searchParams;
  const filters = {
    q: getSingle(params.q),
    status: getOrderStatus(params.status),
    customerType: getCustomerType(params.customerType),
    payment: getPaymentMethod(params.payment),
    delivery: getDeliveryMethod(params.delivery),
    date: getDateFilter(params.date),
  };
  const orders = await getAdminOrders(filters);

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Gestion commerciale"
          title="Commandes"
          description="Suivez les commandes hors ligne, confirmez les statuts et gardez l'historique admin propre."
          action={<AdminExportActions dataset="commandes" />}
        />

        {["SUPER_ADMIN", "MANAGER"].includes(admin.role) ? (
          <form action={cancelStaleOrdersAction} className="flex justify-end">
            <AdminConfirmSubmit
              title="Annuler les commandes en attente ?"
              description="Toutes les commandes non confirmées depuis plus de 48 heures seront annulées et leur stock réservé sera libéré. Cette opération ne peut pas être annulée automatiquement."
              confirmLabel="Annuler et libérer le stock"
              trigger={
                <span className="focus-ring inline-flex h-9 items-center justify-center rounded-control border border-red-300/35 bg-red-500/[0.08] px-3 text-sm font-bold text-red-100 hover:bg-red-500/15">
                  Annuler les commandes non confirmées &gt; 48h
                </span>
              }
            />
          </form>
        ) : null}

        <AdminPanel title="Filtres">
          <form className="grid gap-3 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))_auto]">
            <AdminSearchBox
              placeholder="Numero, telephone, client..."
              defaultValue={filters.q}
            />
            <AdminSelect name="status" defaultValue={filters.status}>
              <option value="">Tous statuts</option>
              {Object.values(OrderStatus).map((status) => (
                <option key={status} value={status}>
                  {orderStatusLabels[status]}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect name="customerType" defaultValue={filters.customerType}>
              <option value="">Tous clients</option>
              {Object.values(CustomerType).map((type) => (
                <option key={type} value={type}>
                  {customerTypeLabels[type]}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect name="payment" defaultValue={filters.payment}>
              <option value="">Paiement</option>
              {Object.values(PaymentMethod).map((method) => (
                <option key={method} value={method}>
                  {paymentMethodLabels[method]}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect name="delivery" defaultValue={filters.delivery}>
              <option value="">Livraison</option>
              {Object.values(DeliveryMethod).map((method) => (
                <option key={method} value={method}>
                  {deliveryMethodLabels[method]}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect name="date" defaultValue={filters.date}>
              <option value="">Toutes dates</option>
              <option value="today">Aujourd&apos;hui</option>
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
            </AdminSelect>
            <Button type="submit" variant="lightOutline" size="sm">
              Filtrer
            </Button>
          </form>
        </AdminPanel>

        <AdminPanel title={`${orders.length} commandes`}>
          {orders.length ? (
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <th className="px-3 py-3">Commande</th>
                  <th className="px-3 py-3">Client</th>
                  <th className="px-3 py-3">Total</th>
                  <th className="px-3 py-3">Livraison</th>
                  <th className="px-3 py-3">Paiement</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </AdminTableHead>
              <tbody className="divide-y divide-white/10">
                {orders.map((order) => (
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
                    <AdminTableCell>
                      <p className="font-bold text-white">{order.customerName}</p>
                      <p className="mt-1 text-xs text-white/44">
                        {order.customerPhone} - {order.customerTypeLabel}
                      </p>
                    </AdminTableCell>
                    <AdminTableCell>{order.totalLabel}</AdminTableCell>
                    <AdminTableCell>{order.deliveryMethodLabel}</AdminTableCell>
                    <AdminTableCell>{order.paymentMethodLabel}</AdminTableCell>
                    <AdminTableCell>
                      <AdminStatusBadge tone={getOrderStatusTone(order.status)}>
                        {order.statusLabel}
                      </AdminStatusBadge>
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/commandes/${order.id}`}
                          title="Voir la commande"
                          aria-label="Voir la commande"
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-control border border-white/10 text-white/78 hover:bg-white/[0.08]"
                        >
                          <Eye size={14} />
                        </Link>
                        <form action={updateOrderStatusAction} className="flex items-center gap-1.5">
                          <input type="hidden" name="orderId" value={order.id} />
                          <input
                            type="hidden"
                            name="returnTo"
                            value="/admin/commandes"
                          />
                          <select
                            name="status"
                            defaultValue={order.status}
                            className="h-8 rounded-control border border-white/10 bg-[#0c1718] px-1.5 text-xs font-bold text-white outline-none"
                          >
                            {Object.values(OrderStatus).map((status) => (
                              <option key={status} value={status}>
                                {orderStatusLabels[status]}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            title="Appliquer le statut"
                            aria-label="Appliquer le statut"
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-control border border-white/10 text-white/78 hover:bg-white/[0.08]"
                          >
                            <Check size={14} />
                          </button>
                        </form>
                      </div>
                    </AdminTableCell>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <AdminEmptyState
              title="Aucune commande trouvee"
              description="Essayez de modifier les filtres ou attendez les prochaines commandes du site."
            />
          )}
        </AdminPanel>
      </div>
    </AdminLayout>
  );
}

function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getOrderStatus(value: string | string[] | undefined) {
  const single = getSingle(value);
  return single && Object.values(OrderStatus).includes(single as OrderStatus)
    ? (single as OrderStatus)
    : undefined;
}

function getCustomerType(value: string | string[] | undefined) {
  const single = getSingle(value);
  return single && Object.values(CustomerType).includes(single as CustomerType)
    ? (single as CustomerType)
    : undefined;
}

function getPaymentMethod(value: string | string[] | undefined) {
  const single = getSingle(value);
  return single && Object.values(PaymentMethod).includes(single as PaymentMethod)
    ? (single as PaymentMethod)
    : undefined;
}

function getDeliveryMethod(value: string | string[] | undefined) {
  const single = getSingle(value);
  return single && Object.values(DeliveryMethod).includes(single as DeliveryMethod)
    ? (single as DeliveryMethod)
    : undefined;
}

function getDateFilter(value: string | string[] | undefined) {
  const single = getSingle(value);
  return single === "today" || single === "7d" || single === "30d"
    ? (single as "today" | "7d" | "30d")
    : undefined;
}
