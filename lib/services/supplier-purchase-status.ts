import type { SupplierPurchaseStatus } from "@prisma/client";

export function normalizePurchaseStatus(
  requested: SupplierPurchaseStatus,
  paid: number,
  total: number,
): SupplierPurchaseStatus {
  if (requested === "CANCELLED") return "CANCELLED";
  // Un brouillon reste un brouillon meme avec un acompte : le paiement ne
  // vaut pas reception de la marchandise (le stock n'entre qu'a la
  // validation de la reception).
  if (requested === "DRAFT") return "DRAFT";
  if (paid >= total && total > 0) return "PAID";
  if (paid > 0) return "PARTIALLY_PAID";
  return "RECEIVED";
}

export function isReceivedStatus(status: SupplierPurchaseStatus) {
  return ["RECEIVED", "PARTIALLY_PAID", "PAID"].includes(status);
}
