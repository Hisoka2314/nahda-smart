import { notFound } from "next/navigation";
import { FilterInputType } from "@prisma/client";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminBackLink,
  AdminCheckbox,
  AdminFeedback,
  AdminField,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminStatusBadge,
  AdminTextInput,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { filterInputTypeLabels } from "@/lib/admin/labels";
import { getAdminFiltersForCategory } from "@/lib/services/admin-filters";
import {
  createFilterAttributeAction,
  createFilterGroupAction,
  createFilterOptionAction,
  updateFilterAttributeAction,
  updateFilterGroupAction,
  updateFilterOptionAction,
} from "@/app/admin/filtres/actions";
import { getSingleQuery } from "@/lib/admin/pagination";

export const dynamic = "force-dynamic";

export default async function AdminCategoryFiltersPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("filters");
  const { categoryId } = await params;
  const query = await searchParams;
  const category = await getAdminFiltersForCategory(categoryId);

  if (!category) notFound();

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminBackLink href="/admin/filtres" />
        <AdminPageHeader
          eyebrow="Filtres dynamiques"
          title={category.name}
          description="Les filtres visibles ici alimentent le catalogue public et les pages categorie."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Filtres", href: "/admin/filtres" },
            { label: category.name },
          ]}
        />
        <AdminFeedback
          success={getSingleQuery(query.success)}
          error={getSingleQuery(query.error)}
        />

        <AdminPanel
          title="Ajouter un groupe"
          description="Utilisez l'ordre pour placer les filtres principaux plus haut dans la sidebar publique."
        >
          <form action={createFilterGroupAction} className="grid gap-3 lg:grid-cols-[1fr_1fr_120px_repeat(3,auto)_auto]">
            <input type="hidden" name="categoryId" value={category.id} />
            <input type="hidden" name="returnTo" value={`/admin/filtres/${category.id}`} />
            <AdminTextInput name="name" placeholder="Performance" required />
            <AdminTextInput name="slug" placeholder="performance" required />
            <AdminTextInput name="order" type="number" defaultValue={0} />
            <AdminCheckbox name="defaultOpen" label="Ouvert" />
            <AdminCheckbox name="isAdvanced" label="Avance" />
            <AdminCheckbox name="visible" label="Visible" defaultChecked />
            <Button type="submit">Ajouter</Button>
          </form>
        </AdminPanel>

        <div className="space-y-5">
          {category.filterGroups.map((group) => (
            <AdminPanel
              key={group.id}
              title={`${group.name} (${group.attributes.length} attributs)`}
              action={
                <div className="flex flex-wrap gap-2">
                  <AdminStatusBadge tone={group.defaultOpen ? "success" : "muted"}>
                    {group.defaultOpen ? "Ouvert" : "Plie"}
                  </AdminStatusBadge>
                  <AdminStatusBadge tone={group.isAdvanced ? "warning" : "info"}>
                    {group.isAdvanced ? "Avance" : "Principal"}
                  </AdminStatusBadge>
                  <AdminStatusBadge tone={group.visible ? "success" : "muted"}>
                    {group.visible ? "Visible" : "Masque"}
                  </AdminStatusBadge>
                </div>
              }
            >
              <form action={updateFilterGroupAction} className="mb-5 grid gap-3 lg:grid-cols-[1fr_1fr_100px_repeat(3,auto)_auto]">
                <input type="hidden" name="id" value={group.id} />
                <input type="hidden" name="categoryId" value={category.id} />
                <input type="hidden" name="returnTo" value={`/admin/filtres/${category.id}`} />
                <AdminTextInput name="name" defaultValue={group.name} />
                <AdminTextInput name="slug" defaultValue={group.slug} />
                <AdminTextInput name="order" type="number" defaultValue={group.order} />
                <AdminCheckbox name="defaultOpen" label="Ouvert" defaultChecked={group.defaultOpen} />
                <AdminCheckbox name="isAdvanced" label="Avance" defaultChecked={group.isAdvanced} />
                <AdminCheckbox name="visible" label="Visible" defaultChecked={group.visible} />
                <Button type="submit" variant="lightOutline">Enregistrer</Button>
              </form>

              <form action={createFilterAttributeAction} className="mb-5 grid gap-3 rounded-control border border-white/10 bg-white/[0.035] p-4 lg:grid-cols-4">
                <input type="hidden" name="groupId" value={group.id} />
                <input type="hidden" name="categoryId" value={category.id} />
                <input type="hidden" name="returnTo" value={`/admin/filtres/${category.id}`} />
                <AdminField label="Label">
                  <AdminTextInput name="label" placeholder="RAM" required />
                </AdminField>
                <AdminField label="Slug">
                  <AdminTextInput name="slug" placeholder="ram" required />
                </AdminField>
                <AdminField label="Type">
                  <AdminSelect name="type">
                    {Object.values(FilterInputType).map((type) => (
                      <option key={type} value={type}>
                        {filterInputTypeLabels[type]}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="Unite">
                  <AdminTextInput name="unit" placeholder="Go, pouces..." />
                </AdminField>
                <AdminField label="Ordre">
                  <AdminTextInput name="order" type="number" defaultValue={0} />
                </AdminField>
                <AdminCheckbox name="filterable" label="Filtrable" defaultChecked />
                <AdminCheckbox name="searchable" label="Recherchable" />
                <AdminCheckbox name="visible" label="Visible" defaultChecked />
                <Button type="submit" className="lg:col-span-4">Ajouter attribut</Button>
              </form>

              <div className="grid gap-4">
                {group.attributes.map((attribute) => (
                  <details
                    key={attribute.id}
                    open={attribute._count.productValues > 0}
                    className="rounded-control border border-white/10 bg-[#071112]"
                  >
                    <summary className="cursor-pointer list-none p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-white">{attribute.label}</p>
                          <p className="mt-1 text-xs text-white/42">
                            {filterInputTypeLabels[attribute.type]} - ordre {attribute.order}
                            {attribute.unit ? ` - ${attribute.unit}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <AdminStatusBadge tone={attribute.visible ? "success" : "muted"}>
                            {attribute.visible ? "Visible" : "Masque"}
                          </AdminStatusBadge>
                          <AdminStatusBadge tone={attribute._count.productValues ? "warning" : "muted"}>
                            {attribute._count.productValues} valeurs
                          </AdminStatusBadge>
                        </div>
                      </div>
                    </summary>
                    <div className="border-t border-white/10 p-4">
                      {attribute._count.productValues ? (
                        <p className="mb-3 rounded-control border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
                          Ce filtre est deja utilise par des produits. Preferez le masquer plutot que supprimer sa logique.
                        </p>
                      ) : null}
                      <form action={updateFilterAttributeAction} className="grid gap-3 lg:grid-cols-4">
                        <input type="hidden" name="id" value={attribute.id} />
                        <input type="hidden" name="groupId" value={group.id} />
                        <input type="hidden" name="categoryId" value={category.id} />
                        <input type="hidden" name="returnTo" value={`/admin/filtres/${category.id}`} />
                        <AdminField label="Label">
                          <AdminTextInput name="label" defaultValue={attribute.label} />
                        </AdminField>
                        <AdminField label="Slug">
                          <AdminTextInput name="slug" defaultValue={attribute.slug} />
                        </AdminField>
                        <AdminField label="Type">
                          <AdminSelect name="type" defaultValue={attribute.type}>
                            {Object.values(FilterInputType).map((type) => (
                              <option key={type} value={type}>
                                {filterInputTypeLabels[type]}
                              </option>
                            ))}
                          </AdminSelect>
                        </AdminField>
                        <AdminField label="Unite">
                          <AdminTextInput name="unit" defaultValue={attribute.unit ?? ""} />
                        </AdminField>
                        <AdminField label="Ordre">
                          <AdminTextInput name="order" type="number" defaultValue={attribute.order} />
                        </AdminField>
                        <AdminCheckbox name="filterable" label="Filtrable" defaultChecked={attribute.filterable} />
                        <AdminCheckbox name="searchable" label="Recherchable" defaultChecked={attribute.searchable} />
                        <AdminCheckbox name="visible" label="Visible" defaultChecked={attribute.visible} />
                        <Button type="submit" variant="lightOutline" className="lg:col-span-4">
                          Enregistrer attribut
                        </Button>
                      </form>
                    </div>
                    <div className="border-t border-white/10 p-4">
                      <p className="mb-3 text-xs font-black uppercase text-white/44">
                        Options ({attribute.options.length}) - utilise par {attribute._count.productValues} valeurs produit
                      </p>
                      <form action={createFilterOptionAction} className="mb-3 grid gap-3 md:grid-cols-[1fr_1fr_100px_auto_auto]">
                        <input type="hidden" name="attributeId" value={attribute.id} />
                        <input type="hidden" name="returnTo" value={`/admin/filtres/${category.id}`} />
                        <AdminTextInput name="label" placeholder="16 Go" />
                        <AdminTextInput name="value" placeholder="16go" />
                        <AdminTextInput name="order" type="number" defaultValue={0} />
                        <AdminCheckbox name="visible" label="Visible" defaultChecked />
                        <Button type="submit">Ajouter option</Button>
                      </form>
                      <div className="grid gap-2">
                        {attribute.options.map((option) => (
                          <form
                            key={option.id}
                            action={updateFilterOptionAction}
                            className="grid gap-2 md:grid-cols-[1fr_1fr_100px_auto_auto]"
                          >
                            <input type="hidden" name="id" value={option.id} />
                            <input type="hidden" name="attributeId" value={attribute.id} />
                            <input type="hidden" name="returnTo" value={`/admin/filtres/${category.id}`} />
                            <AdminTextInput name="label" defaultValue={option.label} />
                            <AdminTextInput name="value" defaultValue={option.value} />
                            <AdminTextInput name="order" type="number" defaultValue={option.order} />
                            <AdminCheckbox name="visible" label="Visible" defaultChecked={option.visible} />
                            <Button type="submit" variant="lightOutline">Enregistrer</Button>
                          </form>
                        ))}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </AdminPanel>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
