import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminFeedback,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { SupplierPurchaseForm } from "@/components/admin/supplier-purchase-form";
import { createSupplierPurchaseAction } from "@/app/admin/fournisseurs/actions";
import { requireRole } from "@/lib/auth/admin-auth";
import { getSingleQuery } from "@/lib/admin/pagination";
import {
  getAdminSupplierById,
  getAdminSupplierPurchaseFormData,
} from "@/lib/services/admin-suppliers";

export const dynamic = "force-dynamic";

export default async function SupplierPurchaseCreatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireRole(["SUPER_ADMIN", "MANAGER", "STOCK_MANAGER"]);
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [supplier, formData] = await Promise.all([
    getAdminSupplierById(id),
    getAdminSupplierPurchaseFormData(id),
  ]);

  if (!supplier) notFound();

  const canUpdateProductPrice =
    admin.role === "SUPER_ADMIN" ||
    admin.role === "MANAGER" ||
    admin.role === "ACCOUNTANT";

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Achat fournisseur"
          title={`Nouvel achat - ${supplier.name}`}
          description="Enregistrez une facture fournisseur et alimentez le stock si l'achat est recu."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Fournisseurs", href: "/admin/fournisseurs" },
            { label: supplier.name, href: `/admin/fournisseurs/${supplier.id}` },
            { label: "Achat" },
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
