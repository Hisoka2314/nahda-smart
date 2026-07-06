import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminFeedback,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { SupplierAdminForm } from "@/components/admin/supplier-admin-form";
import { requireRole } from "@/lib/auth/admin-auth";
import { getSingleQuery } from "@/lib/admin/pagination";
import { createSupplierAction } from "@/app/admin/fournisseurs/actions";

export const dynamic = "force-dynamic";

export default async function NewSupplierPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const params = await searchParams;

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Fournisseurs"
          title="Nouveau fournisseur"
          description="Creez un fournisseur interne pour les achats et entrees stock."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Fournisseurs", href: "/admin/fournisseurs" },
            { label: "Nouveau" },
          ]}
        />
        <AdminFeedback error={getSingleQuery(params.error)} />
        <SupplierAdminForm action={createSupplierAction} mode="create" />
      </div>
    </AdminLayout>
  );
}
