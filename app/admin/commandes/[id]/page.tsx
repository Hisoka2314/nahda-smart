import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import { OrderStatus } from "@prisma/client";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminBackLink,
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import {
  getOrderStatusTone,
  orderStatusLabels,
} from "@/lib/admin/labels";
import { getAdminOrderById } from "@/lib/services/admin-orders";
import {
  updateOrderInternalNoteAction,
  updateOrderStatusAction,
} from "@/app/admin/commandes/actions";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdminSection("orders");
  const { id } = await params;
  const order = await getAdminOrderById(id);

  if (!order) notFound();

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminBackLink href="/admin/commandes" />
        <AdminPageHeader
          eyebrow="Detail commande"
          title={order.orderNumber}
          description={`${order.customerName} - ${order.createdAt}`}
          action={
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/commandes/${order.id}/facture`}
                className="inline-flex h-9 items-center gap-1.5 rounded-control bg-nahda-olive px-3 text-xs font-bold text-white hover:bg-nahda-olive-dark"
              >
                <FileText size={14} />
                Facture
              </Link>
              <AdminStatusBadge tone={getOrderStatusTone(order.status)}>
                {order.statusLabel}
              </AdminStatusBadge>
            </div>
          }
        />

        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <AdminPanel title="Produits commandes">
              {order.items.length ? (
                <AdminTable>
                  <AdminTableHead>
                    <tr>
                      <th className="px-3 py-3">Produit</th>
                      <th className="px-3 py-3">Quantite</th>
                      <th className="px-3 py-3">Prix</th>
                      <th className="px-3 py-3">Total</th>
                    </tr>
                  </AdminTableHead>
                  <tbody className="divide-y divide-white/10">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <AdminTableCell>
                          <Link
                            href={`/produit/${item.productSlug}`}
                            className="font-bold text-white hover:text-nahda-olive"
                          >
                            {item.productName}
                          </Link>
                          <p className="mt-1 text-xs text-white/42">
                            {item.brandName}
                          </p>
                        </AdminTableCell>
                        <AdminTableCell>{item.quantity}</AdminTableCell>
                        <AdminTableCell>{item.unitPriceLabel}</AdminTableCell>
                        <AdminTableCell>{item.totalPriceLabel}</AdminTableCell>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>
              ) : (
                <AdminEmptyState
                  title="Aucun article"
                  description="Cette commande ne contient aucun article."
                />
              )}
            </AdminPanel>

            <AdminPanel title="Historique statuts">
              {order.statusHistory.length ? (
                <div className="space-y-3">
                  {order.statusHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-control border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <AdminStatusBadge tone={getOrderStatusTone(entry.status)}>
                          {entry.statusLabel}
                        </AdminStatusBadge>
                        <span className="text-xs text-white/42">
                          {entry.createdAt}
                        </span>
                      </div>
                      {entry.note ? (
                        <p className="mt-3 text-sm text-white/62">{entry.note}</p>
                      ) : null}
                      {entry.changedBy ? (
                        <p className="mt-2 text-xs text-white/38">
                          Par {entry.changedBy}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <AdminEmptyState
                  title="Aucun historique"
                  description="Les changements de statut seront ajoutes ici."
                />
              )}
            </AdminPanel>
          </div>

          <aside className="space-y-5">
            <AdminPanel title="Actions">
              <form action={updateOrderStatusAction} className="space-y-3">
                <input type="hidden" name="orderId" value={order.id} />
                <input
                  type="hidden"
                  name="returnTo"
                  value={`/admin/commandes/${order.id}`}
                />
                <label className="block text-xs font-black uppercase text-white/44">
                  Statut
                </label>
                <select
                  name="status"
                  defaultValue={order.status}
                  className="h-11 w-full rounded-control border border-white/10 bg-[#0c1718] px-3 text-sm font-bold text-white outline-none"
                >
                  {Object.values(OrderStatus).map((status) => (
                    <option key={status} value={status}>
                      {orderStatusLabels[status]}
                    </option>
                  ))}
                </select>
                <textarea
                  name="note"
                  placeholder="Note historique optionnelle"
                  className="min-h-[92px] w-full rounded-control border border-white/10 bg-white/[0.05] p-3 text-sm text-white outline-none placeholder:text-white/34"
                />
                <Button type="submit" className="w-full">
                  Mettre a jour
                </Button>
              </form>
            </AdminPanel>

            <AdminPanel title="Client">
              <div className="space-y-3 text-sm text-white/66">
                <p>
                  <span className="font-black text-white">{order.customerName}</span>
                </p>
                <p>{order.customerPhone}</p>
                {order.customerEmail ? <p>{order.customerEmail}</p> : null}
                <p>{order.customerTypeLabel}</p>
                {order.organizationName ? <p>{order.organizationName}</p> : null}
                {order.customerCity ? <p>{order.customerCity}</p> : null}
                {order.customerAddress ? <p>{order.customerAddress}</p> : null}
              </div>
            </AdminPanel>

            <AdminPanel title="Resume">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-white/48">Sous-total</dt>
                  <dd className="font-bold text-white">{order.subtotalLabel}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/48">Livraison</dt>
                  <dd className="font-bold text-white">{order.deliveryFeeLabel}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-white/10 pt-3">
                  <dt className="text-white/64">Total</dt>
                  <dd className="text-lg font-black text-nahda-olive">
                    {order.totalLabel}
                  </dd>
                </div>
                <div className="pt-2 text-white/58">
                  <p>{order.deliveryMethodLabel}</p>
                  <p>{order.paymentMethodLabel}</p>
                </div>
              </dl>
            </AdminPanel>

            <AdminPanel title="Notes">
              {order.customerNote ? (
                <div className="mb-4 rounded-control border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-xs font-black uppercase text-white/42">
                    Note client
                  </p>
                  <p className="mt-2 text-sm text-white/66">
                    {order.customerNote}
                  </p>
                </div>
              ) : null}
              <form action={updateOrderInternalNoteAction} className="space-y-3">
                <input type="hidden" name="orderId" value={order.id} />
                <input
                  type="hidden"
                  name="returnTo"
                  value={`/admin/commandes/${order.id}`}
                />
                <textarea
                  name="internalNote"
                  defaultValue={order.internalNote}
                  placeholder="Note interne non visible par le client"
                  className="min-h-[130px] w-full rounded-control border border-white/10 bg-white/[0.05] p-3 text-sm text-white outline-none placeholder:text-white/34"
                />
                <Button type="submit" variant="lightOutline" className="w-full">
                  Enregistrer la note
                </Button>
              </form>
            </AdminPanel>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
