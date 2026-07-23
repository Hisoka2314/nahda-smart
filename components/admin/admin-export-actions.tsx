import { FileSpreadsheet, FileText } from "lucide-react";

export type AdminExportDataset =
  | "clients"
  | "fournisseurs"
  | "achats"
  | "commandes"
  | "produits"
  | "stock";

export function AdminExportActions({
  dataset,
}: {
  dataset: AdminExportDataset;
}) {
  const baseClass =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-control border border-white/10 px-3 text-xs font-bold text-white/78 transition hover:bg-white/[0.08] hover:text-white";

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`/admin/exports/${dataset}?format=xlsx`}
        className={baseClass}
        title="Télécharger toutes les données au format Excel"
      >
        <FileSpreadsheet size={15} />
        Excel
      </a>
      <a
        href={`/admin/exports/${dataset}?format=pdf`}
        className={baseClass}
        title="Télécharger toutes les données au format PDF"
      >
        <FileText size={15} />
        PDF
      </a>
    </div>
  );
}
