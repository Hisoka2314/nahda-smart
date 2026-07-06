import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminFeedback,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { CustomerAdminForm } from "@/components/admin/customer-admin-form";
import { createCustomerAction } from "@/app/admin/clients/actions";
import { requireRole } from "@/lib/auth/admin-auth";
import { getSingleQuery } from "@/lib/admin/pagination";

export const dynamic = "force-dynamic";

export default async function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireRole(["MANAGER", "SELLER"]);
  const params = await searchParams;

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="CRM"
          title="Nouveau client"
          description="Creez une fiche client exploitable pour les commandes telephone, WhatsApp ou boutique."
          breadcrumbs={[
            { label: "Clients", href: "/admin/clients" },
            { label: "Nouveau" },
          ]}
        />
        <AdminFeedback error={getSingleQuery(params.error)} />
        <CustomerAdminForm
          action={createCustomerAction}
          submitLabel="Creer le client"
        />
      </div>
    </AdminLayout>
  );
}
