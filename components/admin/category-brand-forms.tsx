import {
  AdminCheckbox,
  AdminField,
  AdminPanel,
  AdminTextInput,
  AdminTextarea,
  AdminSelect,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import {
  createCategoryAction,
  updateCategoryAction,
} from "@/app/admin/categories/actions";
import {
  createBrandAction,
  removeBrandLogoAction,
  updateBrandAction,
  uploadBrandLogoAction,
} from "@/app/admin/marques/actions";
import { AdminFilePreview } from "@/components/admin/admin-file-preview";

type CategoryOption = { id: string; name: string };

export function CategoryForm({
  category,
  parents,
}: {
  category?: {
    id: string;
    name: string;
    slug: string;
    parentId?: string | null;
    icon?: string | null;
    bannerUrl?: string | null;
    description?: string | null;
    order: number;
    isActive: boolean;
  };
  parents: CategoryOption[];
}) {
  const isEdit = Boolean(category?.id);

  return (
    <AdminPanel
      title={isEdit ? "Modifier la categorie" : "Nouvelle categorie"}
      description="Le slug et l'etat actif pilotent la visibilite publique."
    >
      <form action={isEdit ? updateCategoryAction : createCategoryAction} className="grid gap-4">
        {isEdit ? (
          <>
            <input type="hidden" name="id" value={category?.id} />
            <input type="hidden" name="returnTo" value={`/admin/categories/${category?.id}`} />
          </>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2">
          <AdminField label="Nom">
            <AdminTextInput name="name" defaultValue={category?.name} required />
          </AdminField>
          <AdminField label="Slug">
            <AdminTextInput name="slug" defaultValue={category?.slug} required />
          </AdminField>
          <AdminField label="Parent">
            <AdminSelect name="parentId" defaultValue={category?.parentId ?? ""}>
              <option value="">Aucun parent</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Ordre">
            <AdminTextInput name="order" type="number" defaultValue={category?.order ?? 0} />
          </AdminField>
          <AdminField label="Icone">
            <AdminTextInput name="icon" defaultValue={category?.icon ?? ""} />
          </AdminField>
          <AdminField label="Banniere URL">
            <AdminTextInput name="bannerUrl" defaultValue={category?.bannerUrl ?? ""} />
          </AdminField>
        </div>
        <AdminField label="Description">
          <AdminTextarea name="description" defaultValue={category?.description ?? ""} />
        </AdminField>
        <AdminCheckbox name="isActive" label="Categorie active" defaultChecked={category?.isActive ?? true} />
        <Button type="submit" className="w-full sm:w-fit">
          {isEdit ? "Enregistrer" : "Creer"}
        </Button>
      </form>
    </AdminPanel>
  );
}

export function BrandForm({
  brand,
}: {
  brand?: {
    id: string;
    name: string;
    slug: string;
    logoPath?: string | null;
    isActive: boolean;
    isOfficialAsset: boolean;
  };
}) {
  const isEdit = Boolean(brand?.id);

  return (
    <AdminPanel
      title={isEdit ? "Modifier la marque" : "Nouvelle marque"}
      description="Aucun logo n'est genere automatiquement. Le fallback typographique reste actif sans logo."
    >
      <form action={isEdit ? updateBrandAction : createBrandAction} className="grid gap-4">
        {isEdit ? (
          <>
            <input type="hidden" name="id" value={brand?.id} />
            <input type="hidden" name="returnTo" value={`/admin/marques/${brand?.id}`} />
          </>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2">
          <AdminField label="Nom">
            <AdminTextInput name="name" defaultValue={brand?.name} required />
          </AdminField>
          <AdminField label="Slug">
            <AdminTextInput name="slug" defaultValue={brand?.slug} required />
          </AdminField>
        </div>
        <input type="hidden" name="logoPath" value={brand?.logoPath ?? ""} />
        <div className="grid gap-2 sm:grid-cols-2">
          <AdminCheckbox name="isActive" label="Marque active" defaultChecked={brand?.isActive ?? true} />
          <AdminCheckbox
            name="isOfficialAsset"
            label="Afficher le logo sur le site (asset officiel)"
            defaultChecked={brand?.isOfficialAsset}
          />
        </div>
        <Button type="submit" className="w-full sm:w-fit">
          {isEdit ? "Enregistrer" : "Creer"}
        </Button>
      </form>
    </AdminPanel>
  );
}

export function BrandLogoPanel({
  brand,
}: {
  brand: {
    id: string;
    name: string;
    logoPath?: string | null;
    isOfficialAsset: boolean;
  };
}) {
  return (
    <AdminPanel
      title="Logo marque"
      description="Ajoutez uniquement un logo fourni ou autorise. SVG refuse temporairement pour securite."
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {brand.logoPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.logoPath}
            alt={brand.name}
            className="h-20 w-32 rounded-control bg-white object-contain p-3"
          />
        ) : (
          <div className="grid h-20 w-32 place-items-center rounded-control border border-white/10 bg-white/[0.06] text-lg font-black text-nahda-olive">
            {brand.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="text-sm text-white/58">
          <p>Aucun logo n&apos;est genere automatiquement.</p>
          <p>Ajoutez uniquement un asset fourni ou autorise.</p>
        </div>
      </div>
      <form action={uploadBrandLogoAction} className="mt-5 grid gap-3 md:grid-cols-[minmax(240px,1fr)_auto_auto]">
        <input type="hidden" name="brandId" value={brand.id} />
        <input type="hidden" name="returnTo" value={`/admin/marques/${brand.id}`} />
        <AdminFilePreview
          name="logo"
          accept="image/jpeg,image/png,image/webp"
          label="Logo a uploader"
          hint="JPG, PNG ou WebP uniquement. SVG refuse temporairement pour securite."
          required
        />
        <AdminCheckbox
          name="isOfficialAsset"
          label="Afficher sur le site (logo officiel)"
          defaultChecked={brand.isOfficialAsset}
        />
        <Button type="submit">Uploader</Button>
      </form>
      {brand.logoPath ? (
        <form action={removeBrandLogoAction} className="mt-3">
          <input type="hidden" name="brandId" value={brand.id} />
          <input type="hidden" name="returnTo" value={`/admin/marques/${brand.id}`} />
          <Button type="submit" variant="lightOutline">
            Supprimer le logo
          </Button>
        </form>
      ) : null}
    </AdminPanel>
  );
}
