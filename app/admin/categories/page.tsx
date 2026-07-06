import Link from "next/link";
import { FolderPlus } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminEmptyState,
  AdminFeedback,
  AdminFilterBar,
  AdminPageHeader,
  AdminPagination,
  AdminPanel,
  AdminSearchBox,
  AdminSelect,
  AdminStatusBadge,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { getAdminCategoriesPage } from "@/lib/services/admin-categories";
import { getAdminPagination, getSingleQuery } from "@/lib/admin/pagination";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("categories");
  const params = await searchParams;
  const pagination = getAdminPagination({
    page: getSingleQuery(params.page),
    perPage: getSingleQuery(params.perPage),
  });
  const filters = {
    q: getSingleQuery(params.q),
    status: getStatus(params.status),
  };
  const categoriesPage = await getAdminCategoriesPage(filters, pagination);
  const categories = categoriesPage.items;
  const canWrite = admin.role === "SUPER_ADMIN" || admin.role === "MANAGER";

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Catalogue"
          title="Categories"
          description="Organisez l'arborescence, les bannieres et l'ordre d'affichage."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Categories" },
          ]}
          action={
            canWrite ? (
              <Link href="/admin/categories/nouveau">
                <Button>
                  <FolderPlus size={16} />
                  Nouvelle categorie
                </Button>
              </Link>
            ) : null
          }
        />
        <AdminFeedback
          success={getSingleQuery(params.success)}
          error={getSingleQuery(params.error)}
        />
        <AdminPanel title="Recherche categories">
          <AdminFilterBar columns="lg:grid-cols-[1.4fr_1fr_160px_auto_auto]">
            <AdminSearchBox placeholder="Nom, slug, parent..." defaultValue={filters.q} />
            <AdminSelect name="status" defaultValue={filters.status}>
              <option value="">Tous statuts</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </AdminSelect>
            <AdminSelect name="perPage" defaultValue={String(categoriesPage.perPage)}>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </AdminSelect>
            <Button type="submit" variant="lightOutline" size="sm">Filtrer</Button>
            <Link
              href="/admin/categories"
              className="inline-flex h-9 items-center justify-center rounded-control border border-white/10 px-3 text-sm font-bold text-white/68 hover:bg-white/[0.08]"
            >
              Reset
            </Link>
          </AdminFilterBar>
        </AdminPanel>
        <AdminPanel title={`${categoriesPage.total} categories`}>
          {categories.length ? (
            <>
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <th className="px-3 py-3">Nom</th>
                  <th className="px-3 py-3">Slug</th>
                  <th className="px-3 py-3">Parent</th>
                  <th className="px-3 py-3">Ordre</th>
                  <th className="px-3 py-3">Produits</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </AdminTableHead>
              <tbody className="divide-y divide-white/10">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <AdminTableCell>
                      <Link
                        href={`/admin/categories/${category.id}`}
                        className="font-black text-white hover:text-nahda-olive"
                      >
                        {category.name}
                      </Link>
                    </AdminTableCell>
                    <AdminTableCell>{category.slug}</AdminTableCell>
                    <AdminTableCell>{category.parentName ?? "-"}</AdminTableCell>
                    <AdminTableCell>{category.order}</AdminTableCell>
                    <AdminTableCell>{category.productCount}</AdminTableCell>
                    <AdminTableCell>
                      <AdminStatusBadge tone={category.isActive ? "success" : "muted"}>
                        {category.isActive ? "Active" : "Inactive"}
                      </AdminStatusBadge>
                    </AdminTableCell>
                    <AdminTableCell>
                      <Link
                        href={`/admin/categories/${category.id}`}
                        className="text-sm font-bold text-nahda-olive hover:text-white"
                      >
                        Editer
                      </Link>
                    </AdminTableCell>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
            <AdminPagination
              basePath="/admin/categories"
              searchParams={params}
              page={categoriesPage.page}
              perPage={categoriesPage.perPage}
              total={categoriesPage.total}
              totalPages={categoriesPage.totalPages}
            />
            </>
          ) : (
            <AdminEmptyState title="Aucune categorie" description="Creez une premiere categorie." />
          )}
        </AdminPanel>
      </div>
    </AdminLayout>
  );
}

function getStatus(
  value: string | string[] | undefined,
): "active" | "inactive" | undefined {
  const single = getSingleQuery(value);
  return single === "active" || single === "inactive" ? single : undefined;
}
