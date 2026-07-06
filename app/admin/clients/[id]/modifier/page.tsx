import { notFound } from "next/navigation";
import { updateCustomerAction } from "@/app/admin/clients/actions";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminBackLink,
  AdminFeedback,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { CustomerAdminForm } from "@/components/admin/customer-admin-form";
import { requireRole } from "@/lib/auth/admin-auth";
import { getSingleQuery } from "@/lib/admin/pagination";
import { getAdminClientFormData } from "@/lib/services/admin-clients";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireRole(["MANAGER", "SELLER", "ACCOUNTANT"]);
  const { id } = await params;
  const query = await searchParams;
  const customer = await getAdminClientFormData(id);

  if (!customer) notFound();

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminBackLink href={`/admin/clients/${id}`} />
        <AdminPageHeader
          eyebrow="CRM"
          title="Modifier client"
          description="Mettez a jour les coordonnees, le statut relationnel et les notes internes du client."
          breadcrumbs={[
            { label: "Clients", href: "/admin/clients" },
            { label: customer.name ?? "Client", href: `/admin/clients/${id}` },
            { label: "Modifier" },
          ]}
        />
        <AdminFeedback error={getSingleQuery(query.error)} />
        <CustomerAdminForm
          action={updateCustomerAction}
          customer={customer}
          submitLabel="Enregistrer"
        />
      </div>
    </AdminLayout>
  );
}
