import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminBackLink,
  AdminFeedback,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from "@/components/admin/admin-ui";
import {
  ProductAdminForm,
  ProductAttributesPanel,
  ProductImagesPanel,
  ProductStockPanel,
} from "@/components/admin/product-admin-form";
import { Button } from "@/components/ui/button";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { getProductStatusTone } from "@/lib/admin/labels";
import {
  getAdminProductById,
  getAdminProductFormOptions,
} from "@/lib/services/admin-products";
import { getSingleQuery } from "@/lib/admin/pagination";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("products");
  const { id } = await params;
  const query = await searchParams;
  const product = await getAdminProductById(id);

  if (!product) notFound();

  const canManageProduct = ["SUPER_ADMIN", "MANAGER"].includes(admin.role);
  const canManageTechnical = ["SUPER_ADMIN", "MANAGER", "STOCK_MANAGER"].includes(admin.role);
  const options = await getAdminProductFormOptions(product.categoryId);

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminBackLink href="/admin/produits" />
        <AdminPageHeader
          eyebrow="Catalogue"
          title={product.name}
          description={`${product.sku} - ${product.brandName} - ${product.categoryName}`}
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Produits", href: "/admin/produits" },
            { label: product.name },
          ]}
          action={
            <div className="flex flex-wrap gap-2">
              <AdminStatusBadge tone={getProductStatusTone(product.status)}>
                {product.statusLabel}
              </AdminStatusBadge>
              <Link href={`/produit/${product.slug}`} target="_blank">
                <Button variant="lightOutline" size="sm">
                  Voir public
                </Button>
              </Link>
            </div>
          }
        />
        <AdminFeedback
          success={getSingleQuery(query.success)}
          error={getSingleQuery(query.error)}
        />

        {canManageProduct ? (
          <ProductAdminForm
            product={product}
            brands={options.brands}
            categories={options.categories}
            depots={options.depots}
          />
        ) : (
          <AdminPanel title="Lecture produit">
            <p className="text-sm text-white/58">
              Votre role permet la consultation du catalogue, mais pas la modification
              des prix ou de la publication.
            </p>
          </AdminPanel>
        )}

        {canManageProduct ? <ProductImagesPanel product={product} /> : null}

        {canManageTechnical ? (
          <>
            <ProductAttributesPanel
              product={product}
              attributes={options.attributes}
            />
            <ProductStockPanel product={product} depots={options.depots} />
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
