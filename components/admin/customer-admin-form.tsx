import {
  CustomerLevel,
  CustomerRelationshipStatus,
  CustomerSource,
  CustomerType,
} from "@prisma/client";
import Link from "next/link";
import {
  customerLevelLabels,
  customerRelationshipStatusLabels,
  customerSourceLabels,
  customerTypeLabels,
} from "@/lib/admin/labels";
import {
  customerTagLabels,
  type AdminClientFormData,
} from "@/lib/services/admin-clients";
import { adminCustomerTagOptions } from "@/lib/validations/admin-crm";
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

type CustomerAdminFormProps = {
  action: (formData: FormData) => Promise<void>;
  customer?: AdminClientFormData | null;
  submitLabel: string;
};

export function CustomerAdminForm({
  action,
  customer,
  submitLabel,
}: CustomerAdminFormProps) {
  return (
    <form action={action} className="space-y-5">
      <AdminHiddenFields values={{ id: customer?.id }} />

      <AdminPanel
        title="Informations client"
        description="Coordonnees principales et classification client."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <AdminField label="Nom complet">
            <AdminTextInput
              name="name"
              defaultValue={customer?.name}
              required
              placeholder="Nom client"
            />
          </AdminField>
          <AdminField label="Telephone">
            <AdminTextInput
              name="phone"
              defaultValue={customer?.phone}
              required
              placeholder="06XXXXXXXX"
            />
          </AdminField>
          <AdminField label="Email">
            <AdminTextInput
              name="email"
              type="email"
              defaultValue={customer?.email}
              placeholder="client@email.ma"
            />
          </AdminField>
          <AdminField label="Ville">
            <AdminTextInput
              name="city"
              defaultValue={customer?.city}
              placeholder="Casablanca"
            />
          </AdminField>
          <AdminField label="Type client">
            <AdminSelect name="type" defaultValue={customer?.type ?? "INDIVIDUAL"}>
              {Object.values(CustomerType).map((type) => (
                <option key={type} value={type}>
                  {customerTypeLabels[type]}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Organisation">
            <AdminTextInput
              name="organizationName"
              defaultValue={customer?.organizationName}
              placeholder="Societe, ecole, administration..."
            />
          </AdminField>
          <AdminField label="Adresse">
            <AdminTextarea
              name="address"
              defaultValue={customer?.address}
              rows={3}
              placeholder="Adresse de livraison ou adresse principale"
            />
          </AdminField>
          <AdminField label="Note interne globale">
            <AdminTextarea
              name="internalNotes"
              defaultValue={customer?.internalNotes}
              rows={3}
              placeholder="Information interne, jamais visible cote public"
            />
          </AdminField>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Relation commerciale"
        description="Ces champs pilotent le suivi CRM et restent internes au dashboard."
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <AdminField label="Source">
            <AdminSelect name="source" defaultValue={customer?.source ?? "STORE"}>
              {Object.values(CustomerSource).map((source) => (
                <option key={source} value={source}>
                  {customerSourceLabels[source]}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Niveau">
            <AdminSelect name="level" defaultValue={customer?.level ?? "NEW"}>
              {Object.values(CustomerLevel).map((level) => (
                <option key={level} value={level}>
                  {customerLevelLabels[level]}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Statut relationnel">
            <AdminSelect
              name="relationshipStatus"
              defaultValue={customer?.relationshipStatus ?? "NORMAL"}
            >
              {Object.values(CustomerRelationshipStatus).map((status) => (
                <option key={status} value={status}>
                  {customerRelationshipStatusLabels[status]}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <div className="rounded-control border border-amber-400/20 bg-amber-400/10 p-3 text-xs font-bold leading-5 text-amber-100">
            Les statuts sensibles comme Bloque ou Litige exigent une permission
            manager et doivent etre justifies par une note interne.
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {adminCustomerTagOptions.map((tag) => (
            <AdminCheckbox
              key={tag}
              name="tags"
              label={customerTagLabels[tag]}
              defaultChecked={customer?.tags.includes(tag)}
            />
          ))}
        </div>
      </AdminPanel>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          href={customer?.id ? `/admin/clients/${customer.id}` : "/admin/clients"}
          className="inline-flex h-11 items-center justify-center rounded-control border border-white/10 px-4 text-sm font-bold text-white hover:bg-white/[0.08]"
        >
          Annuler
        </Link>
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
