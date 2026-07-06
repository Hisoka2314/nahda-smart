import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminBackLink,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { ProductAdminForm } from "@/components/admin/product-admin-form";
import { requireRole } from "@/lib/auth/admin-auth";
import { getAdminProductFormOptions } from "@/lib/services/admin-products";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const admin = await requireRole(["MANAGER"]);
  const options = await getAdminProductFormOptions();

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminBackLink href="/admin/produits" />
        <AdminPageHeader
          eyebrow="Catalogue"
          title="Nouveau produit"
          description="Creez un produit brouillon, puis ajoutez ses images, attributs et mouvements de stock depuis sa fiche."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Produits", href: "/admin/produits" },
            { label: "Nouveau produit" },
          ]}
        />
        <ProductAdminForm
          brands={options.brands}
          categories={options.categories}
          depots={options.depots}
        />
      </div>
    </AdminLayout>
  );
}
