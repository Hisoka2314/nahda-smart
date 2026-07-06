import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";
import { BrandForm } from "@/components/admin/category-brand-forms";
import { requireRole } from "@/lib/auth/admin-auth";

export const dynamic = "force-dynamic";

export default async function NewBrandPage() {
  const admin = await requireRole(["MANAGER"]);

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminBackLink href="/admin/marques" />
        <AdminPageHeader
          eyebrow="Catalogue"
          title="Nouvelle marque"
          description="Creez la marque, puis ajoutez le logo officiel si vous disposez d'un asset autorise."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Marques", href: "/admin/marques" },
            { label: "Nouvelle marque" },
          ]}
        />
        <BrandForm />
      </div>
    </AdminLayout>
  );
}
