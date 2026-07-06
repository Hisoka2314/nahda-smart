"use client";

import { createProductCollection } from "@/components/shop/create-product-collection";

export const COMPARE_STORAGE_KEY = "nahda-smart-compare-v1";
export const COMPARE_LIMIT = 4;

const compare = createProductCollection({
  storageKey: COMPARE_STORAGE_KEY,
  eventName: "nahda-smart-compare-change",
  addedMessage: "Produit ajouté au comparateur.",
  removedMessage: "Produit retiré du comparateur.",
  limit: COMPARE_LIMIT,
  limitMessage: `Comparateur limité à ${COMPARE_LIMIT} produits.`,
  hookName: "useCompare",
});

export const CompareProvider = compare.Provider;
export const useCompare = compare.useCollection;
