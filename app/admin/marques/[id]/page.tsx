import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminBackLink,
  AdminFeedback,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import {
  BrandForm,
  BrandLogoPanel,
} from "@/components/admin/category-brand-forms";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { getAdminBrandById } from "@/lib/services/admin-brands";
import { getSingleQuery } from "@/lib/admin/pagination";

export const dynamic = "force-dynamic";

export default async function BrandDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("brands");
  const { id } = await params;
  const query = await searchParams;
  const brand = await getAdminBrandById(id);

  if (!brand) notFound();

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminBackLink href="/admin/marques" />
        <AdminPageHeader
          eyebrow="Catalogue"
          title={brand.name}
          description={`${brand._count.products} produits lies a cette marque.`}
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Marques", href: "/admin/marques" },
            { label: brand.name },
          ]}
        />
        <AdminFeedback
          success={getSingleQuery(query.success)}
          error={getSingleQuery(query.error)}
        />
        <BrandForm brand={brand} />
        <BrandLogoPanel brand={brand} />
      </div>
    </AdminLayout>
  );
}
