import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminFeedback,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { SupplierAdminForm } from "@/components/admin/supplier-admin-form";
import { updateSupplierAction } from "@/app/admin/fournisseurs/actions";
import { requireRole } from "@/lib/auth/admin-auth";
import { getSingleQuery } from "@/lib/admin/pagination";
import { getAdminSupplierById } from "@/lib/services/admin-suppliers";

export const dynamic = "force-dynamic";

export default async function EditSupplierPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireRole(["SUPER_ADMIN", "MANAGER"]);
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supplier = await getAdminSupplierById(id);

  if (!supplier) notFound();

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Fournisseurs"
          title={`Modifier ${supplier.name}`}
          description="Mettez a jour les informations internes fournisseur."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Fournisseurs", href: "/admin/fournisseurs" },
            { label: supplier.name, href: `/admin/fournisseurs/${supplier.id}` },
            { label: "Modifier" },
          ]}
        />
        <AdminFeedback error={getSingleQuery(query.error)} />
        <SupplierAdminForm
          action={updateSupplierAction}
          mode="edit"
          supplier={supplier}
        />
      </div>
    </AdminLayout>
  );
}
