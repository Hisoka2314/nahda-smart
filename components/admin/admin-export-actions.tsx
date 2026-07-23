"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";

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
  const [pendingFormat, setPendingFormat] = useState<"xlsx" | "pdf" | null>(
    null,
  );
  const [error, setError] = useState("");
  const baseClass =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-control border border-white/10 px-3 text-xs font-bold text-white/78 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-wait disabled:opacity-55";

  async function download(format: "xlsx" | "pdf") {
    setPendingFormat(format);
    setError("");

    try {
      const response = await fetch(
        `/admin/exports/${dataset}?format=${format}`,
        {
          credentials: "same-origin",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(`Export refusé (${response.status}).`);
      }

      const blob = await response.blob();
      if (!blob.size) throw new Error("Le fichier généré est vide.");

      const filename =
        getDownloadFilename(response.headers.get("content-disposition")) ??
        `${dataset}-nahda-smart.${format}`;
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Le téléchargement a échoué.",
      );
    } finally {
      setPendingFormat(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => download("xlsx")}
          disabled={pendingFormat !== null}
          className={baseClass}
          title="Télécharger toutes les données au format Excel"
        >
          <FileSpreadsheet size={15} />
          {pendingFormat === "xlsx" ? "Préparation…" : "Excel"}
        </button>
        <button
          type="button"
          onClick={() => download("pdf")}
          disabled={pendingFormat !== null}
          className={baseClass}
          title="Télécharger toutes les données au format PDF"
        >
          <FileText size={15} />
          {pendingFormat === "pdf" ? "Préparation…" : "PDF"}
        </button>
      </div>
      {error ? (
        <p className="mt-2 max-w-72 text-xs font-semibold text-red-200" role="alert">
          {error} Réessayez ou reconnectez-vous au dashboard.
        </p>
      ) : null}
    </div>
  );
}

function getDownloadFilename(contentDisposition: string | null) {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);

  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1] ?? null;
}
