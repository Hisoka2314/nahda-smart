import {
  SupplierDocumentType,
  SupplierPaymentMethod,
  SupplierPurchaseStatus,
} from "@prisma/client";
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
import {
  supplierDocumentTypeLabels,
  supplierPaymentMethodLabels,
  supplierPurchaseStatusLabels,
} from "@/lib/admin/labels";

type SupplierPurchaseFormData = {
  selectedSupplierId?: string;
  suppliers: Array<{ id: string; name: string; typeLabel: string }>;
  depots: Array<{ id: string; name: string }>;
  products: Array<{
    id: string;
    name: string;
    sku: string;
    priceBuy: number;
    priceBuyLabel: string;
    stockTotal: number;
  }>;
};

export function SupplierPurchaseForm({
  action,
  data,
  canUpdateProductPrice,
  returnTo = "/admin/achats-fournisseurs/nouveau",
  cancelHref = "/admin/achats-fournisseurs",
}: {
  action: (formData: FormData) => Promise<void>;
  data: SupplierPurchaseFormData;
  canUpdateProductPrice: boolean;
  returnTo?: string;
  cancelHref?: string;
}) {
  const defaultDate = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-5">
      <AdminHiddenFields values={{ returnTo }} />
      <AdminPanel
        title="Achat fournisseur"
        description="Creez un brouillon ou validez directement une entree stock recue."
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <AdminField label="Fournisseur">
            <AdminSelect name="supplierId" defaultValue={data.selectedSupplierId}>
              {data.suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} - {supplier.typeLabel}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Depot reception">
            <AdminSelect name="depotId" defaultValue={data.depots[0]?.id}>
              {data.depots.map((depot) => (
                <option key={depot.id} value={depot.id}>
                  {depot.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Date achat">
            <AdminTextInput name="date" type="date" defaultValue={defaultDate} required />
          </AdminField>
          <AdminField label="Statut">
            <AdminSelect name="status" defaultValue="DRAFT">
              {(["DRAFT", "RECEIVED"] satisfies SupplierPurchaseStatus[]).map((status) => (
                <option key={status} value={status}>
                  {supplierPurchaseStatusLabels[status]}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Type de document">
            <AdminSelect name="documentType" defaultValue="INVOICE">
              {Object.values(SupplierDocumentType).map((type) => (
                <option key={type} value={type}>
                  {supplierDocumentTypeLabels[type]}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Numero de facture / document">
            <AdminTextInput name="reference" placeholder="FAC-2026-001" />
          </AdminField>
          <AdminField label="Transport">
            <AdminTextInput name="transportFee" type="number" defaultValue={0} />
          </AdminField>
          <AdminField label="Douane">
            <AdminTextInput name="customsFee" type="number" defaultValue={0} />
          </AdminField>
          <AdminField label="Autres frais">
            <AdminTextInput name="otherFee" type="number" defaultValue={0} />
          </AdminField>
          <AdminField label="Montant paye">
            <AdminTextInput name="paid" type="number" defaultValue={0} />
          </AdminField>
          <AdminField label="Mode de paiement">
            <AdminSelect name="paymentMethod" defaultValue="CASH">
              {Object.values(SupplierPaymentMethod).map((method) => (
                <option key={method} value={method}>
                  {supplierPaymentMethodLabels[method]}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
        </div>
      </AdminPanel>

      <AdminPanel
        title="Produits achetes"
        description="Laissez les lignes non utilisees vides. Le total est verifie cote serveur."
      >
        <div className="space-y-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-control border border-white/10 bg-white/[0.035] p-3 lg:grid-cols-[minmax(0,1.9fr)_110px_140px_170px]"
            >
              <AdminField label={`Produit ${index + 1}`}>
                <select
                  name={`items.${index}.productId`}
                  defaultValue=""
                  className="h-11 rounded-control border border-white/10 bg-[#0c1718] px-3 text-sm font-semibold text-white outline-none focus:border-nahda-olive/70"
                >
                  <option value="">Choisir un produit</option>
                  {data.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.sku} - {product.name} - dernier achat{" "}
                      {product.priceBuyLabel} - stock {product.stockTotal}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="Quantite">
                <AdminTextInput
                  name={`items.${index}.quantity`}
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={index === 0 ? 1 : undefined}
                  placeholder="1"
                />
              </AdminField>
              <AdminField label="Prix achat unitaire">
                <AdminTextInput
                  name={`items.${index}.unitBuyPrice`}
                  type="number"
                  placeholder="0"
                />
              </AdminField>
              <AdminField label="Prix achat produit">
                {canUpdateProductPrice ? (
                  <AdminCheckbox
                    name={`items.${index}.updateProductPrice`}
                    label="Mettre a jour"
                  />
                ) : (
                  <>
                    <AdminHiddenFields
                      values={{ [`items.${index}.updateProductPrice`]: false }}
                    />
                    <span className="inline-flex min-h-10 items-center rounded-control border border-white/10 bg-white/[0.035] px-3 text-sm text-white/42">
                      Non autorise
                    </span>
                  </>
                )}
              </AdminField>
            </div>
          ))}
        </div>
      </AdminPanel>

      <AdminPanel title="Notes internes">
        <AdminField label="Notes">
          <AdminTextarea
            name="notes"
            rows={5}
            placeholder="Conditions fournisseur, reference transport, contexte achat..."
          />
        </AdminField>
      </AdminPanel>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className="inline-flex h-11 items-center justify-center rounded-control border border-white/10 px-4 text-sm font-bold text-white hover:bg-white/[0.08]"
        >
          Annuler
        </Link>
        <Button type="submit" variant="primary">
          Enregistrer achat
        </Button>
      </div>
    </form>
  );
}
