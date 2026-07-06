import Link from "next/link";
import { BadgePlus } from "lucide-react";
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
import { getAdminBrandsPage } from "@/lib/services/admin-brands";
import { getAdminPagination, getSingleQuery } from "@/lib/admin/pagination";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("brands");
  const params = await searchParams;
  const pagination = getAdminPagination({
    page: getSingleQuery(params.page),
    perPage: getSingleQuery(params.perPage),
  });
  const filters = {
    q: getSingleQuery(params.q),
    status: getStatus(params.status),
    logo: getLogoFilter(params.logo),
  };
  const brandsPage = await getAdminBrandsPage(filters, pagination);
  const brands = brandsPage.items;
  const canWrite = admin.role === "SUPER_ADMIN" || admin.role === "MANAGER";

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Catalogue"
          title="Marques"
          description="Gerez les marques et les logos officiels ajoutes manuellement. Aucun faux logo n'est genere."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Marques" },
          ]}
          action={
            canWrite ? (
              <Link href="/admin/marques/nouveau">
                <Button>
                  <BadgePlus size={16} />
                  Nouvelle marque
                </Button>
              </Link>
            ) : null
          }
        />
        <AdminFeedback
          success={getSingleQuery(params.success)}
          error={getSingleQuery(params.error)}
        />
        <AdminPanel title="Recherche marques">
          <AdminFilterBar columns="lg:grid-cols-[1.4fr_1fr_1fr_160px_auto_auto]">
            <AdminSearchBox placeholder="Nom ou slug..." defaultValue={filters.q} />
            <AdminSelect name="status" defaultValue={filters.status}>
              <option value="">Tous statuts</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </AdminSelect>
            <AdminSelect name="logo" defaultValue={filters.logo}>
              <option value="">Tous logos</option>
              <option value="with">Avec logo</option>
              <option value="without">Sans logo</option>
            </AdminSelect>
            <AdminSelect name="perPage" defaultValue={String(brandsPage.perPage)}>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </AdminSelect>
            <Button type="submit" variant="lightOutline" size="sm">Filtrer</Button>
            <Link
              href="/admin/marques"
              className="inline-flex h-9 items-center justify-center rounded-control border border-white/10 px-3 text-sm font-bold text-white/68 hover:bg-white/[0.08]"
            >
              Reset
            </Link>
          </AdminFilterBar>
        </AdminPanel>
        <AdminPanel title={`${brandsPage.total} marques`}>
          {brands.length ? (
            <>
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <th className="px-3 py-3">Marque</th>
                  <th className="px-3 py-3">Slug</th>
                  <th className="px-3 py-3">Logo</th>
                  <th className="px-3 py-3">Officiel</th>
                  <th className="px-3 py-3">Produits</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </AdminTableHead>
              <tbody className="divide-y divide-white/10">
                {brands.map((brand) => (
                  <tr key={brand.id}>
                    <AdminTableCell>
                      <Link
                        href={`/admin/marques/${brand.id}`}
                        className="font-black text-white hover:text-nahda-olive"
                      >
                        {brand.name}
                      </Link>
                    </AdminTableCell>
                    <AdminTableCell>{brand.slug}</AdminTableCell>
                    <AdminTableCell>
                      {brand.logoPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={brand.logoPath}
                          alt=""
                          className="h-10 w-20 rounded bg-white object-contain p-2"
                        />
                      ) : (
                        <span className="rounded-[8px] border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-nahda-olive">
                          {brand.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </AdminTableCell>
                    <AdminTableCell>{brand.isOfficialAsset ? "Oui" : "Non"}</AdminTableCell>
                    <AdminTableCell>{brand.productCount}</AdminTableCell>
                    <AdminTableCell>
                      <AdminStatusBadge tone={brand.isActive ? "success" : "muted"}>
                        {brand.isActive ? "Active" : "Inactive"}
                      </AdminStatusBadge>
                    </AdminTableCell>
                    <AdminTableCell>
                      <Link
                        href={`/admin/marques/${brand.id}`}
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
              basePath="/admin/marques"
              searchParams={params}
              page={brandsPage.page}
              perPage={brandsPage.perPage}
              total={brandsPage.total}
              totalPages={brandsPage.totalPages}
            />
            </>
          ) : (
            <AdminEmptyState title="Aucune marque" description="Creez une premiere marque." />
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

function getLogoFilter(
  value: string | string[] | undefined,
): "with" | "without" | undefined {
  const single = getSingleQuery(value);
  return single === "with" || single === "without" ? single : undefined;
}
