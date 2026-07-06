import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminEmptyState,
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
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { getAdminFiltersIndexPage } from "@/lib/services/admin-filters";
import { getAdminPagination, getSingleQuery } from "@/lib/admin/pagination";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminFiltersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("filters");
  const params = await searchParams;
  const pagination = getAdminPagination({
    page: getSingleQuery(params.page),
    perPage: getSingleQuery(params.perPage),
  });
  const filters = {
    q: getSingleQuery(params.q),
    status: getStatus(params.status),
  };
  const categoriesPage = await getAdminFiltersIndexPage(filters, pagination);
  const categories = categoriesPage.items;

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Catalogue"
          title="Filtres dynamiques"
          description="Choisissez une categorie pour gerer ses groupes, attributs et options de filtrage."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Filtres" },
          ]}
        />
        <AdminPanel title="Choisir une categorie">
          <AdminFilterBar columns="lg:grid-cols-[1.5fr_1fr_160px_auto_auto]">
            <AdminSearchBox placeholder="Categorie ou slug..." defaultValue={filters.q} />
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
              href="/admin/filtres"
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
                  <th className="px-3 py-3">Categorie</th>
                  <th className="px-3 py-3">Slug</th>
                  <th className="px-3 py-3">Groupes</th>
                  <th className="px-3 py-3">Attributs</th>
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
                        href={`/admin/filtres/${category.id}`}
                        className="inline-flex items-center gap-2 font-black text-white hover:text-nahda-olive"
                      >
                        <SlidersHorizontal size={16} />
                        {category.name}
                      </Link>
                    </AdminTableCell>
                    <AdminTableCell>{category.slug}</AdminTableCell>
                    <AdminTableCell>{category.groupCount}</AdminTableCell>
                    <AdminTableCell>{category.attributeCount}</AdminTableCell>
                    <AdminTableCell>{category.productCount}</AdminTableCell>
                    <AdminTableCell>
                      <AdminStatusBadge tone={category.isActive ? "success" : "muted"}>
                        {category.isActive ? "Active" : "Inactive"}
                      </AdminStatusBadge>
                    </AdminTableCell>
                    <AdminTableCell>
                      <Link
                        href={`/admin/filtres/${category.id}`}
                        className="text-sm font-bold text-nahda-olive hover:text-white"
                      >
                        Gerer
                      </Link>
                    </AdminTableCell>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
            <AdminPagination
              basePath="/admin/filtres"
              searchParams={params}
              page={categoriesPage.page}
              perPage={categoriesPage.perPage}
              total={categoriesPage.total}
              totalPages={categoriesPage.totalPages}
            />
            </>
          ) : (
            <AdminEmptyState
              title="Aucune categorie"
              description="Creez d'abord des categories catalogue."
            />
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
