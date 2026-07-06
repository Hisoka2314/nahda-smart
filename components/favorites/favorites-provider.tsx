"use client";

import { createProductCollection } from "@/components/shop/create-product-collection";

export const FAVORITES_STORAGE_KEY = "nahda-smart-favorites-v1";

const favorites = createProductCollection({
  storageKey: FAVORITES_STORAGE_KEY,
  eventName: "nahda-smart-favorites-change",
  addedMessage: "Produit ajouté aux favoris.",
  removedMessage: "Produit retiré des favoris.",
  hookName: "useFavorites",
});

export const FavoritesProvider = favorites.Provider;
export const useFavorites = favorites.useCollection;
