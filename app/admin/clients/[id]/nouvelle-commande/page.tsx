import { notFound } from "next/navigation";
import { createManualOrderAction } from "@/app/admin/clients/actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminBackLink,
  AdminEmptyState,
  AdminFeedback,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from "@/components/admin/admin-ui";
import { ManualOrderForm } from "@/components/admin/manual-order-form";
import { requireRole } from "@/lib/auth/admin-auth";
import { getSingleQuery } from "@/lib/admin/pagination";
import {
  getAdminClientById,
  getManualOrderOptions,
} from "@/lib/services/admin-clients";

export const dynamic = "force-dynamic";

export default async function NewManualOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireRole(["MANAGER", "SELLER"]);
  const { id } = await params;
  const query = await searchParams;
  const [client, options] = await Promise.all([
    getAdminClientById(id),
    getManualOrderOptions(),
  ]);

  if (!client) notFound();

  const canEditPrice =
    admin.role === "SUPER_ADMIN" ||
    admin.role === "MANAGER" ||
    admin.role === "ACCOUNTANT";

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminBackLink href={`/admin/clients/${id}`} />
        <AdminPageHeader
          eyebrow="Commande manuelle"
          title={`Nouvelle commande - ${client.name}`}
          description="Creation rapide pour commande par telephone, WhatsApp ou boutique. Aucun paiement en ligne n'est actif."
          breadcrumbs={[
            { label: "Clients", href: "/admin/clients" },
            { label: client.name, href: `/admin/clients/${id}` },
            { label: "Nouvelle commande" },
          ]}
        />
        <AdminFeedback error={getSingleQuery(query.error)} />

        <AdminPanel title="Client selectionne">
          <div className="grid gap-4 md:grid-cols-4">
            <Info label="Nom" value={client.name} />
            <Info label="Telephone" value={client.phone} />
            <Info label="Type" value={client.typeLabel} />
            <div>
              <p className="text-xs font-black uppercase text-white/44">
                Statut relationnel
              </p>
              <div className="mt-2">
                <AdminStatusBadge tone={client.relationshipTone}>
                  {client.relationshipStatusLabel}
                </AdminStatusBadge>
              </div>
            </div>
          </div>
        </AdminPanel>

        {options.products.length && options.depots.length ? (
          <ManualOrderForm
            action={createManualOrderAction}
            customerId={client.id}
            products={options.products}
            depots={options.depots}
            canEditPrice={canEditPrice}
          />
        ) : (
          <AdminEmptyState
            title="Catalogue ou depot indisponible"
            description="Ajoutez au moins un produit et un depot actif avant de creer une commande manuelle."
          />
        )}
      </div>
    </AdminLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-white/44">{label}</p>
      <p className="mt-2 font-bold text-white">{value}</p>
    </div>
  );
}
