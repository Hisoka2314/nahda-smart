import {
  ServiceTicketType,
  ServiceTicketUrgency,
} from "@prisma/client";
import Link from "next/link";
import {
  AdminField,
  AdminPanel,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import {
  serviceTicketTypeLabels,
  serviceTicketUrgencyLabels,
} from "@/lib/admin/labels";

type ServiceTicketFormData = {
  customers: Array<{
    id: string;
    name: string;
    phone: string | null;
    organizationName: string | null;
  }>;
  products: Array<{ id: string; name: string; sku: string }>;
  orders: Array<{ id: string; customerId: string; label: string }>;
  suppliers: Array<{ id: string; name: string }>;
};

export function ServiceTicketForm({
  action,
  data,
}: {
  action: (formData: FormData) => Promise<void>;
  data: ServiceTicketFormData;
}) {
  return (
    <form action={action} className="space-y-5">
      <AdminPanel
        title="Informations SAV"
        description="Creez un ticket prive pour suivre retour, reparation, echange ou garantie."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <AdminField label="Client CRM">
            <AdminSelect name="customerId">
              {data.customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                  {customer.organizationName ? ` - ${customer.organizationName}` : ""}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Commande liee">
            <AdminSelect name="orderId">
              <option value="">Aucune commande liee</option>
              {data.orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.label}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Produit concerne">
            <AdminSelect name="productId">
              <option value="">Aucun produit lie</option>
              {data.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.sku}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Fournisseur optionnel">
            <AdminSelect name="supplierId">
              <option value="">Aucun fournisseur lie</option>
              {data.suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Type SAV">
            <AdminSelect name="type" defaultValue="REPAIR">
              {Object.values(ServiceTicketType).map((type) => (
                <option key={type} value={type}>
                  {serviceTicketTypeLabels[type]}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Urgence">
            <AdminSelect name="urgency" defaultValue="MEDIUM">
              {Object.values(ServiceTicketUrgency).map((urgency) => (
                <option key={urgency} value={urgency}>
                  {serviceTicketUrgencyLabels[urgency]}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
        </div>
      </AdminPanel>

      <AdminPanel title="Probleme et notes">
        <div className="grid gap-4 lg:grid-cols-2">
          <AdminField label="Description probleme">
            <AdminTextarea
              name="problem"
              rows={7}
              required
              placeholder="Decrivez le probleme constate, les symptomes, les accessoires recus..."
            />
          </AdminField>
          <AdminField label="Notes internes">
            <AdminTextarea
              name="internalNotes"
              rows={7}
              placeholder="Diagnostic initial, consignes internes, promesse client..."
            />
          </AdminField>
        </div>
      </AdminPanel>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/admin/sav"
          className="inline-flex h-11 items-center justify-center rounded-control border border-white/10 px-4 text-sm font-bold text-white hover:bg-white/[0.08]"
        >
          Annuler
        </Link>
        <Button type="submit" variant="primary">
          Creer le ticket SAV
        </Button>
      </div>
    </form>
  );
}
