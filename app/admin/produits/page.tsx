import Link from "next/link";
import { Eye, PackagePlus } from "lucide-react";
import { ProductCondition, ProductStatus } from "@prisma/client";
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
import { AdminConfirmSubmit } from "@/components/admin/admin-confirm-submit";
import { AdminExportActions } from "@/components/admin/admin-export-actions";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import {
  getProductStatusTone,
  productConditionLabels,
  productStatusLabels,
} from "@/lib/admin/labels";
import { getAdminBrandOptions } from "@/lib/services/admin-brands";
import { getAdminCategoryOptions } from "@/lib/services/admin-categories";
import { getAdminProductsPage } from "@/lib/services/admin-products";
import { archiveProductAction } from "@/app/admin/produits/actions";
import { getAdminPagination, getSingleQuery } from "@/lib/admin/pagination";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("products");
  const params = await searchParams;
  const pagination = getAdminPagination({
    page: getSingleQuery(params.page),
    perPage: getSingleQuery(params.perPage),
  });
  const filters = {
    q: getSingleQuery(params.q),
    categoryId: getSingleQuery(params.categoryId),
    brandId: getSingleQuery(params.brandId),
    status: getEnum(params.status, ProductStatus),
    condition: getEnum(params.condition, ProductCondition),
    stock: getStockFilter(params.stock),
    promo: getSingleQuery(params.promo) === "1",
    isNew: getSingleQuery(params.isNew) === "1",
    isBestSeller: getSingleQuery(params.isBestSeller) === "1",
    isRecommended: getSingleQuery(params.isRecommended) === "1",
    sort: getSort(params.sort),
  };
  const [productsPage, brands, categories] = await Promise.all([
    getAdminProductsPage(filters, pagination),
    getAdminBrandOptions(),
    getAdminCategoryOptions(),
  ]);
  const products = productsPage.items;
  const canManageProduct = ["SUPER_ADMIN", "MANAGER"].includes(admin.role);

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Catalogue"
          title="Produits"
          description="Gerez les produits, prix, images, statuts et visibilite publique du catalogue."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Produits" },
          ]}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <AdminExportActions dataset="produits" />
              {canManageProduct ? (
                <Link href="/admin/produits/nouveau">
                  <Button>
                    <PackagePlus size={16} />
                    Nouveau produit
                  </Button>
                </Link>
              ) : null}
            </div>
          }
        />
        <AdminFeedback
          success={getSingleQuery(params.success)}
          error={getSingleQuery(params.error)}
        />

        <AdminPanel
          title="Filtres produits"
          description="Recherche rapide, statut public, stock et mise en avant."
        >
          <AdminFilterBar columns="xl:grid-cols-[1.5fr_repeat(8,minmax(0,1fr))_auto_auto]">
            <AdminSearchBox placeholder="Nom, SKU, marque..." defaultValue={filters.q} />
            <AdminSelect name="categoryId" defaultValue={filters.categoryId}>
              <option value="">Toutes categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect name="brandId" defaultValue={filters.brandId}>
              <option value="">Toutes marques</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect name="status" defaultValue={filters.status}>
              <option value="">Tous statuts</option>
              {Object.values(ProductStatus).map((status) => (
                <option key={status} value={status}>
                  {productStatusLabels[status]}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect name="condition" defaultValue={filters.condition}>
              <option value="">Tous etats</option>
              {Object.values(ProductCondition).map((condition) => (
                <option key={condition} value={condition}>
                  {productConditionLabels[condition]}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect name="stock" defaultValue={filters.stock}>
              <option value="">Stock</option>
              <option value="low">Stock faible</option>
              <option value="out">Rupture</option>
            </AdminSelect>
            <AdminSelect name="promo" defaultValue={filters.promo ? "1" : ""}>
              <option value="">Promo</option>
              <option value="1">En promotion</option>
            </AdminSelect>
            <AdminSelect name="isNew" defaultValue={filters.isNew ? "1" : ""}>
              <option value="">Nouveaute</option>
              <option value="1">Nouveaute</option>
            </AdminSelect>
            <AdminSelect name="sort" defaultValue={filters.sort}>
              <option value="">Tri recent</option>
              <option value="name">Nom A-Z</option>
              <option value="price">Prix vente</option>
              <option value="stock">Stock</option>
            </AdminSelect>
            <AdminSelect name="perPage" defaultValue={String(productsPage.perPage)}>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </AdminSelect>
            <Button type="submit" variant="lightOutline" size="sm">
              Filtrer
            </Button>
            <Link
              href="/admin/produits"
              className="inline-flex h-9 items-center justify-center rounded-control border border-white/10 px-3 text-sm font-bold text-white/68 hover:bg-white/[0.08]"
            >
              Reset
            </Link>
          </AdminFilterBar>
        </AdminPanel>

        <AdminPanel title={`${productsPage.total} produits`}>
          {products.length ? (
            <>
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <th className="px-3 py-3">Produit</th>
                  <th className="px-3 py-3">SKU</th>
                  <th className="px-3 py-3">Marque</th>
                  <th className="px-3 py-3">Categorie</th>
                  <th className="px-3 py-3">Prix</th>
                  <th className="px-3 py-3">CMUP</th>
                  <th className="px-3 py-3">Stock</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </AdminTableHead>
              <tbody className="divide-y divide-white/10">
                {products.map((product) => (
                  <tr key={product.id}>
                    <AdminTableCell>
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image}
                            alt=""
                            className="h-12 w-14 rounded-[8px] object-cover"
                          />
                        ) : (
                          <span className="grid h-12 w-14 place-items-center rounded-[8px] bg-white/[0.06] text-xs font-black text-white/42">
                            NS
                          </span>
                        )}
                        <div>
                          <Link
                            href={`/admin/produits/${product.id}`}
                            className="font-black text-white hover:text-nahda-olive"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-1 text-xs text-white/42">
                            Modifie {product.updatedAt}
                          </p>
                        </div>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>{product.sku}</AdminTableCell>
                    <AdminTableCell>{product.brandName}</AdminTableCell>
                    <AdminTableCell>{product.categoryName}</AdminTableCell>
                    <AdminTableCell>
                      <p className="font-black text-white">{product.priceSellLabel}</p>
                      {product.promoPriceLabel ? (
                        <p className="text-xs text-orange-200">{product.promoPriceLabel}</p>
                      ) : null}
                    </AdminTableCell>
                    <AdminTableCell>
                      <p className="font-black text-white">{product.averageCostLabel}</p>
                      <p className="text-xs text-white/42">
                        {product.hasCalculatedAverageCost
                          ? "Calculé sur les réceptions"
                          : "Prix achat initial"}
                      </p>
                    </AdminTableCell>
                    <AdminTableCell>{product.stockTotal}</AdminTableCell>
                    <AdminTableCell>
                      <AdminStatusBadge tone={getProductStatusTone(product.status)}>
                        {product.statusLabel}
                      </AdminStatusBadge>
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="flex min-w-[220px] flex-wrap gap-2">
                        <Link
                          href={`/admin/produits/${product.id}`}
                          className="inline-flex h-9 items-center gap-2 rounded-control border border-white/10 px-3 text-sm font-bold text-white/78 hover:bg-white/[0.08]"
                        >
                          <Eye size={15} />
                          Editer
                        </Link>
                        {canManageProduct && product.status !== "ARCHIVED" ? (
                          <form action={archiveProductAction}>
                            <input type="hidden" name="productId" value={product.id} />
                            <input type="hidden" name="returnTo" value="/admin/produits" />
                            <AdminConfirmSubmit
                              title="Archiver ce produit ?"
                              description={`Le produit « ${product.name} » ne sera plus disponible dans le catalogue actif. Son historique restera conservé.`}
                              confirmLabel="Archiver le produit"
                              trigger={
                                <span className="focus-ring inline-flex h-9 items-center justify-center rounded-control border border-red-300/30 px-3 text-sm font-bold text-red-100 hover:bg-red-500/10">
                                  Archiver
                                </span>
                              }
                            />
                          </form>
                        ) : null}
                      </div>
                    </AdminTableCell>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
            <AdminPagination
              basePath="/admin/produits"
              searchParams={params}
              page={productsPage.page}
              perPage={productsPage.perPage}
              total={productsPage.total}
              totalPages={productsPage.totalPages}
            />
            </>
          ) : (
            <AdminEmptyState
              title="Aucun produit trouve"
              description="Ajustez les filtres ou creez un nouveau produit."
            />
          )}
        </AdminPanel>
      </div>
    </AdminLayout>
  );
}

function getEnum<T extends Record<string, string>>(
  value: string | string[] | undefined,
  enumObject: T,
) {
  const single = getSingleQuery(value);
  return single && Object.values(enumObject).includes(single)
    ? (single as T[keyof T])
    : undefined;
}

function getStockFilter(value: string | string[] | undefined): "low" | "out" | undefined {
  const single = getSingleQuery(value);
  return single === "low" || single === "out" ? single : undefined;
}

function getSort(
  value: string | string[] | undefined,
): "name" | "price" | "stock" | undefined {
  const single = getSingleQuery(value);
  return single === "name" || single === "price" || single === "stock"
    ? single
    : undefined;
}
