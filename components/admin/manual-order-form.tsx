import { DeliveryMethod, OrderStatus, PaymentMethod } from "@prisma/client";
import Link from "next/link";
import {
  deliveryMethodLabels,
  orderStatusLabels,
  paymentMethodLabels,
} from "@/lib/admin/labels";
import type {
  ManualOrderDepotOption,
  ManualOrderProductOption,
} from "@/lib/services/admin-clients";
import {
  AdminField,
  AdminHiddenFields,
  AdminPanel,
  AdminSelect,
  AdminTextInput,
  AdminTextarea,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";

type ManualOrderFormProps = {
  action: (formData: FormData) => Promise<void>;
  customerId: string;
  products: ManualOrderProductOption[];
  depots: ManualOrderDepotOption[];
  canEditPrice: boolean;
};

export function ManualOrderForm({
  action,
  customerId,
  products,
  depots,
  canEditPrice,
}: ManualOrderFormProps) {
  return (
    <form action={action} className="space-y-5">
      <AdminHiddenFields values={{ customerId }} />

      <AdminPanel
        title="Parametres commande"
        description="Commande hors ligne creee depuis telephone, WhatsApp ou boutique."
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <AdminField label="Depot de reservation">
            <AdminSelect name="depotId" defaultValue={depots[0]?.id}>
              {depots.map((depot) => (
                <option key={depot.id} value={depot.id}>
                  {depot.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Livraison">
            <AdminSelect name="deliveryMethod" defaultValue="PICKUP_IN_STORE">
              {Object.values(DeliveryMethod).map((method) => (
                <option key={method} value={method}>
                  {deliveryMethodLabels[method]}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Paiement">
            <AdminSelect name="paymentMethod" defaultValue="PAY_ON_SITE">
              {Object.values(PaymentMethod).map((method) => (
                <option key={method} value={method}>
                  {paymentMethodLabels[method]}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Statut initial">
            <AdminSelect name="status" defaultValue="PENDING_CONFIRMATION">
              {(["PENDING_CONFIRMATION", "CONFIRMED"] as const).map((status) => (
                <option key={status} value={status}>
                  {orderStatusLabels[status as OrderStatus]}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Produits"
        description="Choisissez les produits par nom ou SKU. Laissez le prix vide pour utiliser le prix catalogue."
      >
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-control border border-white/10 bg-white/[0.035] p-3 lg:grid-cols-[minmax(0,1.8fr)_110px_130px_120px]"
            >
              <AdminField label={`Produit ${index + 1}`}>
                <select
                  name={`items.${index}.productId`}
                  defaultValue=""
                  className="h-11 rounded-control border border-white/10 bg-[#0c1718] px-3 text-sm font-semibold text-white outline-none focus:border-nahda-olive/70"
                >
                  <option value="">Choisir un produit</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.sku} - {product.name} - {product.priceLabel} -
                      stock {product.stockTotal}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="Quantite">
                <AdminTextInput
                  name={`items.${index}.quantity`}
                  type="number"
                  defaultValue={index === 0 ? 1 : undefined}
                  placeholder="1"
                />
              </AdminField>
              <AdminField
                label="Prix unitaire"
                hint={
                  canEditPrice
                    ? "Optionnel, prix catalogue si vide."
                    : "Prix catalogue impose."
                }
              >
                <AdminTextInput
                  name={`items.${index}.unitPrice`}
                  type="number"
                  placeholder="Auto"
                  defaultValue={undefined}
                  disabled={!canEditPrice}
                />
                {!canEditPrice ? (
                  <input
                    type="hidden"
                    name={`items.${index}.unitPrice`}
                    value="0"
                  />
                ) : null}
              </AdminField>
              <AdminField label="Remise">
                <AdminTextInput
                  name={`items.${index}.discount`}
                  type="number"
                  placeholder="0"
                  disabled={!canEditPrice}
                />
                {!canEditPrice ? (
                  <input
                    type="hidden"
                    name={`items.${index}.discount`}
                    value="0"
                  />
                ) : null}
              </AdminField>
            </div>
          ))}
        </div>
      </AdminPanel>

      <AdminPanel title="Notes">
        <div className="grid gap-4 lg:grid-cols-2">
          <AdminField label="Note client">
            <AdminTextarea
              name="customerNote"
              rows={4}
              placeholder="Note visible dans le contexte commande admin, pas publique."
            />
          </AdminField>
          <AdminField label="Note interne">
            <AdminTextarea
              name="internalNote"
              rows={4}
              placeholder="Contexte interne equipe Nahda Smart."
            />
          </AdminField>
        </div>
      </AdminPanel>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          href={`/admin/clients/${customerId}`}
          className="inline-flex h-11 items-center justify-center rounded-control border border-white/10 px-4 text-sm font-bold text-white hover:bg-white/[0.08]"
        >
          Annuler
        </Link>
        <Button type="submit" variant="primary">
          Creer la commande
        </Button>
      </div>
    </form>
  );
}
