import { SupplierType } from "@prisma/client";
import Link from "next/link";
import {
  AdminCheckbox,
  AdminField,
  AdminHiddenFields,
  AdminPanel,
  AdminSelect,
  AdminTextInput,
  AdminTextarea,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { supplierTypeLabels } from "@/lib/admin/labels";
import {
  supplierTagLabels,
  supplierTagOptions,
} from "@/lib/validations/admin-suppliers";

type SupplierFormValue = {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  type?: SupplierType;
  notes?: string;
  tags?: string[];
  isActive?: boolean;
};

export function SupplierAdminForm({
  action,
  supplier,
  mode,
}: {
  action: (formData: FormData) => Promise<void>;
  supplier?: SupplierFormValue;
  mode: "create" | "edit";
}) {
  const selectedTags = new Set(supplier?.tags ?? []);

  return (
    <form action={action} className="space-y-5">
      <AdminHiddenFields values={{ id: supplier?.id }} />

      <AdminPanel
        title="Informations fournisseur"
        description="Ces donnees restent internes a l'espace admin."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <AdminField label="Nom fournisseur">
            <AdminTextInput
              name="name"
              defaultValue={supplier?.name}
              required
              placeholder="Ex: Maroc Tech Distribution"
            />
          </AdminField>
          <AdminField label="Type fournisseur">
            <AdminSelect name="type" defaultValue={supplier?.type ?? "WHOLESALER"}>
              {Object.values(SupplierType).map((type) => (
                <option key={type} value={type}>
                  {supplierTypeLabels[type]}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Telephone">
            <AdminTextInput name="phone" defaultValue={supplier?.phone} />
          </AdminField>
          <AdminField label="Email">
            <AdminTextInput name="email" type="email" defaultValue={supplier?.email} />
          </AdminField>
          <AdminField label="Ville">
            <AdminTextInput name="city" defaultValue={supplier?.city} />
          </AdminField>
          <AdminField label="Adresse">
            <AdminTextInput name="address" defaultValue={supplier?.address} />
          </AdminField>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Relation fournisseur"
        description="Classez rapidement les fournisseurs fiables, sensibles ou a surveiller."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-3">
            <AdminCheckbox
              name="isActive"
              label="Fournisseur actif"
              defaultChecked={supplier?.isActive ?? true}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {supplierTagOptions.map((tag) => (
              <AdminCheckbox
                key={tag}
                name="tags"
                label={supplierTagLabels[tag]}
                defaultChecked={selectedTags.has(tag)}
              />
            ))}
          </div>
        </div>
      </AdminPanel>

      <AdminPanel title="Notes internes">
        <AdminField label="Notes fournisseur">
          <AdminTextarea
            name="notes"
            rows={5}
            defaultValue={supplier?.notes}
            placeholder="Conditions, habitudes, garanties, points de vigilance..."
          />
        </AdminField>
      </AdminPanel>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          href={supplier?.id ? `/admin/fournisseurs/${supplier.id}` : "/admin/fournisseurs"}
          className="inline-flex h-11 items-center justify-center rounded-control border border-white/10 px-4 text-sm font-bold text-white hover:bg-white/[0.08]"
        >
          Annuler
        </Link>
        <Button type="submit" variant="primary">
          {mode === "create" ? "Creer le fournisseur" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
