import type { ReactNode } from "react";
import {
  FilterInputType,
  ProductCondition,
  ProductStatus,
  StockMovementType,
} from "@prisma/client";
import {
  AdminCheckbox,
  AdminField,
  AdminPanel,
  AdminSelect,
  AdminStatusBadge,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTextInput,
  AdminTextarea,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import {
  filterInputTypeLabels,
  getStockTone,
  productConditionLabels,
  productStatusLabels,
  stockMovementTypeLabels,
} from "@/lib/admin/labels";
import {
  addProductImageAction,
  createProductAction,
  deleteProductImageAction,
  updateProductAttributeAction,
  updateProductImageAction,
  updateProductAction,
} from "@/app/admin/produits/actions";
import {
  createStockMovementAction,
  updateStockThresholdAction,
} from "@/app/admin/stock/actions";
import { AdminFilePreview } from "@/components/admin/admin-file-preview";
import { AdminConfirmSubmit } from "@/components/admin/admin-confirm-submit";

type Option = { id: string; name: string; slug?: string };
type DepotOption = { id: string; name: string; type: string };
type AttributeOption = {
  id: string;
  label: string;
  value: string;
  order: number;
};
type FilterAttribute = {
  id: string;
  label: string;
  slug: string;
  type: FilterInputType;
  unit: string | null;
  group: { name: string };
  options: AttributeOption[];
};

type ProductFormValue = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode: string;
  brandId: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  technicalDescription: string;
  priceBuy: number;
  priceSell: number;
  promoPrice?: number;
  warrantyMonths: number;
  condition: ProductCondition;
  status: ProductStatus;
  isPromo: boolean;
  isNew: boolean;
  isRecommended: boolean;
  isBestSeller: boolean;
  seoTitle: string;
  seoDescription: string;
  images: Array<{ id: string; url: string; alt: string; order: number }>;
  stocks: Array<{
    depotId: string;
    depotName: string;
    quantity: number;
    lowStockThreshold: number;
  }>;
  movements: Array<{
    id: string;
    depotName: string;
    type: StockMovementType;
    quantity: number;
    reason: string;
    reference: string;
    createdBy?: string;
    createdAt: string;
  }>;
  attributes: Array<{
    attributeId: string;
    optionId: string;
    valueString: string;
    valueNumber?: number;
    valueBoolean?: boolean;
  }>;
};

export function ProductAdminForm({
  product,
  brands,
  categories,
}: {
  product?: Partial<ProductFormValue>;
  brands: Option[];
  categories: Option[];
  depots: DepotOption[];
}) {
  const isEdit = Boolean(product?.id);
  const selectedBrand = brands.find((brand) => brand.id === product?.brandId);
  const selectedCategory = categories.find(
    (category) => category.id === product?.categoryId,
  );
  const margin =
    Number(product?.priceSell ?? 0) > 0
      ? Number(product?.priceSell ?? 0) - Number(product?.priceBuy ?? 0)
      : 0;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <form
        action={isEdit ? updateProductAction : createProductAction}
        className="grid gap-5"
      >
        {isEdit ? (
          <>
            <input type="hidden" name="id" value={product?.id} />
            <input
              type="hidden"
              name="returnTo"
              value={`/admin/produits/${product?.id}`}
            />
          </>
        ) : null}
        <ProductSectionNav />
        <ProductFormSection
          id="general"
          title="Informations generales"
          description="Identite, marque, categorie et textes visibles cote boutique."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <AdminField label="Nom">
              <AdminTextInput name="name" defaultValue={product?.name} required />
            </AdminField>
            <AdminField label="Slug">
              <AdminTextInput name="slug" defaultValue={product?.slug} required />
            </AdminField>
            <AdminField label="SKU">
              <AdminTextInput name="sku" defaultValue={product?.sku} required />
            </AdminField>
            <AdminField label="Code-barres">
              <AdminTextInput name="barcode" defaultValue={product?.barcode} />
            </AdminField>
            <AdminField label="Marque">
              <AdminSelect name="brandId" defaultValue={product?.brandId}>
                <option value="">Choisir une marque</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Categorie">
              <AdminSelect name="categoryId" defaultValue={product?.categoryId}>
                <option value="">Choisir une categorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
          </div>
          <AdminField label="Description courte">
            <AdminTextarea
              name="shortDescription"
              defaultValue={product?.shortDescription}
              rows={3}
            />
          </AdminField>
          <AdminField label="Description complete">
            <AdminTextarea
              name="description"
              defaultValue={product?.description}
              rows={6}
              required
            />
          </AdminField>
          <AdminField label="Description technique">
            <AdminTextarea
              name="technicalDescription"
              defaultValue={product?.technicalDescription}
              rows={4}
            />
          </AdminField>
        </ProductFormSection>

        <ProductFormSection
          id="prix"
          title="Prix & promotion"
          description="Le prix d'achat reste reserve a l'admin et n'est jamais expose cote public."
        >
          <div className="grid gap-4 lg:grid-cols-4">
            <AdminField label="Prix achat">
              <AdminTextInput
                name="priceBuy"
                type="number"
                defaultValue={product?.priceBuy ?? 0}
                required
              />
            </AdminField>
            <AdminField label="Prix vente">
              <AdminTextInput
                name="priceSell"
                type="number"
                defaultValue={product?.priceSell ?? 0}
                required
              />
            </AdminField>
            <AdminField label="Prix promo">
              <AdminTextInput
                name="promoPrice"
                type="number"
                defaultValue={product?.promoPrice}
              />
            </AdminField>
            <AdminField label="Garantie mois">
              <AdminTextInput
                name="warrantyMonths"
                type="number"
                defaultValue={product?.warrantyMonths ?? 12}
              />
            </AdminField>
          </div>
          <div className="rounded-control border border-white/10 bg-white/[0.035] p-4 text-sm text-white/58">
            Marge estimee actuelle :{" "}
            <span className="font-black text-white">
              {margin > 0 ? `${margin.toLocaleString("fr-FR")} DH` : "A calculer"}
            </span>
          </div>
        </ProductFormSection>

        <ProductFormSection
          id="publication"
          title="Publication"
          description="Controlez la visibilite publique et les badges marketing."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <AdminField label="Condition">
              <AdminSelect name="condition" defaultValue={product?.condition ?? "NEW"}>
                {Object.values(ProductCondition).map((condition) => (
                  <option key={condition} value={condition}>
                    {productConditionLabels[condition]}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Statut">
              <AdminSelect name="status" defaultValue={product?.status ?? "DRAFT"}>
                {Object.values(ProductStatus).map((status) => (
                  <option key={status} value={status}>
                    {productStatusLabels[status]}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <AdminCheckbox name="isPromo" label="Promotion" defaultChecked={product?.isPromo} />
            <AdminCheckbox name="isNew" label="Nouveaute" defaultChecked={product?.isNew} />
            <AdminCheckbox
              name="isRecommended"
              label="Recommande"
              defaultChecked={product?.isRecommended}
            />
            <AdminCheckbox
              name="isBestSeller"
              label="Best-seller"
              defaultChecked={product?.isBestSeller}
            />
          </div>
        </ProductFormSection>

        <ProductFormSection
          id="seo"
          title="SEO"
          description="Titre et description utilises pour les futures optimisations de recherche."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <AdminField label="SEO title">
              <AdminTextInput name="seoTitle" defaultValue={product?.seoTitle} />
            </AdminField>
            <AdminField label="SEO description">
              <AdminTextInput
                name="seoDescription"
                defaultValue={product?.seoDescription}
              />
            </AdminField>
          </div>
        </ProductFormSection>

        <Button type="submit" className="w-full sm:w-fit">
          {isEdit ? "Enregistrer le produit" : "Creer le produit"}
        </Button>
      </form>

      <aside className="h-fit rounded-card border border-white/10 bg-white/[0.045] p-5 xl:sticky xl:top-6">
        <p className="text-xs font-black uppercase text-nahda-olive">Resume</p>
        <h3 className="mt-2 text-lg font-black text-white">
          {product?.name || "Nouveau produit"}
        </h3>
        <div className="mt-4 grid gap-3 text-sm text-white/58">
          <SummaryRow label="Marque" value={selectedBrand?.name ?? "A choisir"} />
          <SummaryRow label="Categorie" value={selectedCategory?.name ?? "A choisir"} />
          <SummaryRow label="SKU" value={product?.sku ?? "A definir"} />
          <SummaryRow
            label="Prix public"
            value={
              product?.priceSell
                ? `${Number(product.priceSell).toLocaleString("fr-FR")} DH`
                : "A definir"
            }
          />
          <SummaryRow
            label="Statut"
            value={
              product?.status
                ? productStatusLabels[product.status]
                : productStatusLabels.DRAFT
            }
          />
        </div>
        <p className="mt-5 rounded-control border border-white/10 bg-[#071112] p-3 text-xs leading-5 text-white/48">
          Les images, attributs techniques et mouvements de stock se gerent depuis
          la fiche produit une fois le produit cree.
        </p>
      </aside>
    </div>
  );
}

function ProductSectionNav() {
  const sections = [
    ["general", "Infos"],
    ["prix", "Prix"],
    ["publication", "Publication"],
    ["seo", "SEO"],
  ] as const;

  return (
    <div className="sticky top-0 z-10 -mx-1 flex gap-2 overflow-x-auto rounded-card border border-white/10 bg-[#071112]/95 p-2 backdrop-blur">
      {sections.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          className="shrink-0 rounded-control px-3 py-2 text-sm font-black text-white/62 hover:bg-white/[0.08] hover:text-white"
        >
          {label}
        </a>
      ))}
    </div>
  );
}

function ProductFormSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-card border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_44px_rgb(0_0_0_/_0.2)]"
    >
      <div className="mb-5">
        <h2 className="text-base font-black text-white">{title}</h2>
        <p className="mt-1 text-sm text-white/48">{description}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-2">
      <span>{label}</span>
      <span className="max-w-[160px] text-right font-black text-white">{value}</span>
    </div>
  );
}

export function ProductImagesPanel({ product }: { product: ProductFormValue }) {
  return (
    <AdminPanel
      title="Images produit"
      description="JPG, PNG ou WebP uniquement. Le premier ordre est utilise comme image principale."
    >
      <form action={addProductImageAction} className="grid gap-3 rounded-control border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[minmax(220px,1fr)_1fr_120px_auto]">
        <input type="hidden" name="productId" value={product.id} />
        <input type="hidden" name="returnTo" value={`/admin/produits/${product.id}`} />
        <AdminFilePreview
          name="image"
          accept="image/jpeg,image/png,image/webp"
          label="Nouvelle image produit"
          required
        />
        <AdminTextInput name="alt" placeholder="Texte alternatif" />
        <AdminTextInput name="order" type="number" defaultValue={product.images.length} />
        <Button type="submit">Ajouter</Button>
      </form>
      <div className="mt-4 grid gap-3">
        {product.images.length ? (
          product.images.map((image) => (
            <div
              key={image.id}
              className="grid gap-3 rounded-control border border-white/10 bg-white/[0.035] p-3 md:grid-cols-[96px_1fr_auto]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.alt}
                className="h-20 w-24 rounded-[8px] object-cover"
              />
              <form action={updateProductImageAction} className="grid gap-2 md:grid-cols-[1fr_120px_auto]">
                <input type="hidden" name="imageId" value={image.id} />
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="returnTo" value={`/admin/produits/${product.id}`} />
                <AdminTextInput name="alt" defaultValue={image.alt} />
                <AdminTextInput name="order" type="number" defaultValue={image.order} />
                <Button type="submit" variant="lightOutline">Mettre a jour</Button>
              </form>
              <form action={deleteProductImageAction}>
                <input type="hidden" name="imageId" value={image.id} />
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="returnTo" value={`/admin/produits/${product.id}`} />
                <AdminConfirmSubmit
                  title="Supprimer cette image ?"
                  description="Le fichier image sera supprimé du produit et du stockage local. Cette opération est irréversible."
                  confirmLabel="Supprimer l'image"
                  trigger={
                    <span className="focus-ring inline-flex h-11 items-center justify-center rounded-control border border-red-300/30 px-4 text-sm font-bold text-red-100 hover:bg-red-500/10">
                      Supprimer
                    </span>
                  }
                />
              </form>
            </div>
          ))
        ) : (
          <p className="text-sm text-white/52">Aucune image produit.</p>
        )}
      </div>
    </AdminPanel>
  );
}

export function ProductAttributesPanel({
  product,
  attributes,
}: {
  product: ProductFormValue;
  attributes: FilterAttribute[];
}) {
  const currentByAttribute = new Map(
    product.attributes.map((item) => [item.attributeId, item]),
  );
  const grouped = groupAttributes(attributes);

  return (
    <AdminPanel
      title="Attributs techniques"
      description="Les attributs renseignes alimentent la fiche produit et les filtres publics."
    >
      {attributes.length ? (
        <div className="grid gap-4">
          {grouped.map((group, index) => (
            <details
              key={group.name}
              open={index === 0}
              className="rounded-control border border-white/10 bg-white/[0.035]"
            >
              <summary className="cursor-pointer list-none border-b border-white/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-white">{group.name}</p>
                    <p className="mt-1 text-xs text-white/42">
                      {group.items.length} attributs, ordre priorise pour RAM, CPU,
                      stockage, GPU et ecran.
                    </p>
                  </div>
                  <AdminStatusBadge tone={index === 0 ? "success" : "muted"}>
                    {index === 0 ? "Essentiels" : "Avances"}
                  </AdminStatusBadge>
                </div>
              </summary>
              <div className="grid gap-3 p-4">
                {group.items.map((attribute) => {
                  const current = currentByAttribute.get(attribute.id);
                  return (
                    <form
                      key={attribute.id}
                      action={updateProductAttributeAction}
                      className="grid gap-3 rounded-control border border-white/10 bg-[#071112] p-3 lg:grid-cols-[240px_1fr_auto]"
                    >
                      <input type="hidden" name="productId" value={product.id} />
                      <input type="hidden" name="attributeId" value={attribute.id} />
                      <input type="hidden" name="returnTo" value={`/admin/produits/${product.id}`} />
                      <div>
                        <p className="font-black text-white">{attribute.label}</p>
                        <p className="mt-1 text-xs text-white/40">
                          {attribute.group.name} - {filterInputTypeLabels[attribute.type]}
                          {attribute.unit ? ` (${attribute.unit})` : ""}
                        </p>
                      </div>
                      {renderAttributeInput(attribute, current)}
                      <Button type="submit" variant="lightOutline">Enregistrer</Button>
                    </form>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/52">
          Aucun attribut visible pour cette categorie. Ajoutez-en depuis le module Filtres.
        </p>
      )}
    </AdminPanel>
  );
}

export function ProductStockPanel({
  product,
  depots,
}: {
  product: ProductFormValue;
  depots: DepotOption[];
}) {
  return (
    <AdminPanel
      title="Stock par depot"
      description="Chaque changement passe par un mouvement historise. Les stocks negatifs sont refuses."
    >
      <div className="grid gap-4">
        <AdminTable minWidth="720px">
          <AdminTableHead>
            <tr>
              <th className="px-3 py-3">Depot</th>
              <th className="px-3 py-3">Quantite</th>
              <th className="px-3 py-3">Seuil</th>
              <th className="px-3 py-3">Action</th>
            </tr>
          </AdminTableHead>
          <tbody className="divide-y divide-white/10">
            {product.stocks.map((stock) => (
              <tr key={stock.depotId}>
                <AdminTableCell>{stock.depotName}</AdminTableCell>
                <AdminTableCell>
                  <AdminStatusBadge tone={getStockTone(stock.quantity, stock.lowStockThreshold)}>
                    {stock.quantity}
                  </AdminStatusBadge>
                </AdminTableCell>
                <AdminTableCell>{stock.lowStockThreshold}</AdminTableCell>
                <AdminTableCell>
                  <form action={updateStockThresholdAction} className="flex gap-2">
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="depotId" value={stock.depotId} />
                    <input type="hidden" name="returnTo" value={`/admin/produits/${product.id}`} />
                    <AdminTextInput
                      name="lowStockThreshold"
                      type="number"
                      defaultValue={stock.lowStockThreshold}
                    />
                    <Button type="submit" variant="lightOutline">Enregistrer</Button>
                  </form>
                </AdminTableCell>
              </tr>
            ))}
          </tbody>
        </AdminTable>
        <form action={createStockMovementAction} className="grid gap-3 rounded-control border border-white/10 bg-white/[0.035] p-4 lg:grid-cols-3">
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="returnTo" value={`/admin/produits/${product.id}`} />
          <AdminField label="Depot">
            <AdminSelect name="depotId">
              {depots.map((depot) => (
                <option key={depot.id} value={depot.id}>
                  {depot.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Depot destination">
            <AdminSelect name="targetDepotId">
              <option value="">Seulement transfert</option>
              {depots.map((depot) => (
                <option key={depot.id} value={depot.id}>
                  {depot.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Type">
            <AdminSelect name="type">
              {Object.values(StockMovementType)
                .filter((type) => !["RESERVED", "RELEASED"].includes(type))
                .map((type) => (
                  <option key={type} value={type}>
                    {stockMovementTypeLabels[type]}
                  </option>
                ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Quantite">
            <AdminTextInput name="quantity" type="number" required />
          </AdminField>
          <AdminField label="Seuil stock faible">
            <AdminTextInput name="lowStockThreshold" type="number" defaultValue={3} />
          </AdminField>
          <AdminField label="Reference">
            <AdminTextInput name="reference" />
          </AdminField>
          <div className="lg:col-span-3">
            <AdminField label="Raison">
              <AdminTextInput name="reason" />
            </AdminField>
          </div>
          <div className="lg:col-span-3">
            <AdminConfirmSubmit
              title="Créer ce mouvement de stock ?"
              description="Le stock de ce produit sera modifié. Vérifiez le dépôt, le type et la quantité avant confirmation."
              confirmLabel="Confirmer le mouvement"
              tone="warning"
              trigger={
                <span className="focus-ring inline-flex h-11 w-full items-center justify-center rounded-control bg-nahda-olive px-4 text-sm font-bold text-white hover:bg-nahda-olive-dark">
                  Créer le mouvement
                </span>
              }
            />
          </div>
        </form>
        {product.movements.length ? (
          <div>
            <p className="mb-3 text-xs font-black uppercase text-white/44">
              Derniers mouvements produit
            </p>
            <AdminTable minWidth="780px">
              <AdminTableHead>
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Depot</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Quantite</th>
                  <th className="px-3 py-3">Reference</th>
                  <th className="px-3 py-3">Par</th>
                </tr>
              </AdminTableHead>
              <tbody className="divide-y divide-white/10">
                {product.movements.map((movement) => (
                  <tr key={movement.id}>
                    <AdminTableCell>{movement.createdAt}</AdminTableCell>
                    <AdminTableCell>{movement.depotName}</AdminTableCell>
                    <AdminTableCell>{stockMovementTypeLabels[movement.type]}</AdminTableCell>
                    <AdminTableCell>{movement.quantity}</AdminTableCell>
                    <AdminTableCell>{movement.reference || "-"}</AdminTableCell>
                    <AdminTableCell>{movement.createdBy || "-"}</AdminTableCell>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          </div>
        ) : null}
      </div>
    </AdminPanel>
  );
}

function groupAttributes(attributes: FilterAttribute[]) {
  const priority = new Set([
    "processor",
    "processeur",
    "cpu",
    "cpu-generation",
    "generation-cpu",
    "ram",
    "storage",
    "stockage",
    "storage-type",
    "type-stockage",
    "gpu",
    "carte-graphique",
    "screen-size",
    "taille-ecran",
    "screen-resolution",
    "resolution-ecran",
    "operating-system",
    "systeme",
  ]);
  const essential = attributes.filter((attribute) => priority.has(attribute.slug));
  const rest = attributes.filter((attribute) => !priority.has(attribute.slug));
  const groups = new Map<string, FilterAttribute[]>();

  if (essential.length) groups.set("Attributs essentiels", essential);
  rest.forEach((attribute) => {
    const items = groups.get(attribute.group.name) ?? [];
    items.push(attribute);
    groups.set(attribute.group.name, items);
  });

  return Array.from(groups.entries()).map(([name, items]) => ({ name, items }));
}

function renderAttributeInput(
  attribute: FilterAttribute,
  current?: ProductFormValue["attributes"][number],
) {
  if (attribute.options.length > 0) {
    return (
      <AdminSelect name="optionId" defaultValue={current?.optionId}>
        <option value="">Aucune valeur</option>
        {attribute.options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </AdminSelect>
    );
  }

  if (attribute.type === "BOOLEAN") {
    return (
      <AdminSelect
        name="valueBoolean"
        defaultValue={
          current?.valueBoolean === undefined ? "" : String(current.valueBoolean)
        }
      >
        <option value="">Non defini</option>
        <option value="true">Oui</option>
        <option value="false">Non</option>
      </AdminSelect>
    );
  }

  if (attribute.type === "RANGE" || attribute.type === "NUMERIC_RANGE") {
    return (
      <AdminTextInput
        name="valueNumber"
        type="number"
        defaultValue={current?.valueNumber}
      />
    );
  }

  return (
    <AdminTextInput
      name="valueString"
      defaultValue={current?.valueString}
      placeholder="Valeur libre"
    />
  );
}
