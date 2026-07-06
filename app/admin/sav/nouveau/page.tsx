import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminFeedback,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { ServiceTicketForm } from "@/components/admin/service-ticket-form";
import { createServiceTicketAction } from "@/app/admin/sav/actions";
import { requireRole } from "@/lib/auth/admin-auth";
import { getSingleQuery } from "@/lib/admin/pagination";
import { getAdminServiceTicketFormData } from "@/lib/services/admin-sav";

export const dynamic = "force-dynamic";

export default async function NewServiceTicketPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireRole(["SUPER_ADMIN", "MANAGER", "SELLER"]);
  const params = await searchParams;
  const data = await getAdminServiceTicketFormData();

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="SAV"
          title="Nouveau ticket SAV"
          description="Creez un dossier SAV prive pour retour, garantie, reparation ou support technique."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "SAV", href: "/admin/sav" },
            { label: "Nouveau" },
          ]}
        />
        <AdminFeedback error={getSingleQuery(params.error)} />
        <ServiceTicketForm action={createServiceTicketAction} data={data} />
      </div>
    </AdminLayout>
  );
}
