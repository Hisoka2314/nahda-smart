import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminBackLink,
  AdminFeedback,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { CategoryForm } from "@/components/admin/category-brand-forms";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import {
  getAdminCategoryById,
  getAdminCategoryOptions,
} from "@/lib/services/admin-categories";
import { getSingleQuery } from "@/lib/admin/pagination";

export const dynamic = "force-dynamic";

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("categories");
  const { id } = await params;
  const query = await searchParams;
  const category = await getAdminCategoryById(id);

  if (!category) notFound();

  const parents = await getAdminCategoryOptions(category.id);

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminBackLink href="/admin/categories" />
        <AdminPageHeader
          eyebrow="Catalogue"
          title={category.name}
          description={`${category._count.products} produits - ${category._count.filterGroups} groupes filtres`}
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Categories", href: "/admin/categories" },
            { label: category.name },
          ]}
        />
        <AdminFeedback
          success={getSingleQuery(query.success)}
          error={getSingleQuery(query.error)}
        />
        <CategoryForm category={category} parents={parents} />
      </div>
    </AdminLayout>
  );
}
