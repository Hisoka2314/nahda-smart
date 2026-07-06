import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";
import { CategoryForm } from "@/components/admin/category-brand-forms";
import { requireRole } from "@/lib/auth/admin-auth";
import { getAdminCategoryOptions } from "@/lib/services/admin-categories";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  const admin = await requireRole(["MANAGER"]);
  const parents = await getAdminCategoryOptions();

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminBackLink href="/admin/categories" />
        <AdminPageHeader
          eyebrow="Catalogue"
          title="Nouvelle categorie"
          description="Creez une categorie active ou preparez-la en brouillon via le statut inactif."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Categories", href: "/admin/categories" },
            { label: "Nouvelle categorie" },
          ]}
        />
        <CategoryForm parents={parents} />
      </div>
    </AdminLayout>
  );
}
