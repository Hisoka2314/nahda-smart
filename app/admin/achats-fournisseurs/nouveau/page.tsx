import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminFeedback,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { SupplierPurchaseForm } from "@/components/admin/supplier-purchase-form";
import { createSupplierPurchaseAction } from "@/app/admin/fournisseurs/actions";
import { requireRole } from "@/lib/auth/admin-auth";
import { getSingleQuery } from "@/lib/admin/pagination";
import { getAdminSupplierPurchaseFormData } from "@/lib/services/admin-suppliers";

export const dynamic = "force-dynamic";

export default async function NewSupplierPurchasePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireRole(["SUPER_ADMIN", "MANAGER", "STOCK_MANAGER"]);
  const query = await searchParams;
  const formData = await getAdminSupplierPurchaseFormData();
  const canUpdateProductPrice =
    admin.role === "SUPER_ADMIN" ||
    admin.role === "MANAGER" ||
    admin.role === "ACCOUNTANT";

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Achat fournisseur"
          title="Nouvel achat"
          description="Choisissez le fournisseur, ajoutez jusqu'à 12 produits et enregistrez la réception."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            {
              label: "Achats fournisseurs",
              href: "/admin/achats-fournisseurs",
            },
            { label: "Nouvel achat" },
          ]}
        />
        <AdminFeedback error={getSingleQuery(query.error)} />
        <SupplierPurchaseForm
          action={createSupplierPurchaseAction}
          data={formData}
          canUpdateProductPrice={canUpdateProductPrice}
        />
      </div>
    </AdminLayout>
  );
}
