"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { CART_STORAGE_KEY } from "@/lib/cart";
import type { CartAddResult, CartItem, CartProduct } from "@/types/cart";

type CartContextValue = {
  items: CartItem[];
  cartCount: number;
  subtotal: number;
  deliveryFee: number;
  /** Tarif livraison a domicile configure, pour recalculer selon le mode choisi. */
  homeDeliveryFee: number;
  total: number;
  addItem: (product: CartProduct, quantity?: number) => CartAddResult;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_CHANGE_EVENT = "nahda-smart-cart-change";
const EMPTY_CART_SNAPSHOT = "[]";

export function CartProvider({
  children,
  deliveryFee: configuredDeliveryFee = 0,
}: {
  children: ReactNode;
  deliveryFee?: number;
}) {
  const cartSnapshot = useSyncExternalStore(
    subscribeToCartStorage,
    getStoredCartSnapshot,
    getServerCartSnapshot,
  );
  const items = useMemo(() => parseStoredCartItems(cartSnapshot), [cartSnapshot]);

  const addItem = useCallback((product: CartProduct, quantity = 1) => {
    if (product.stockStatus === "out_of_stock" || product.maxQuantity <= 0) {
      return {
        ok: false,
        message: "Ce produit est en rupture pour le moment.",
      };
    }

    let result: CartAddResult = {
      ok: true,
      message: "Produit ajouté au panier.",
    };

    updateStoredCartItems((currentItems) => {
      const existing = currentItems.find((item) => item.product.id === product.id);
      const requestedQuantity = Math.max(1, Math.floor(quantity));

      if (!existing) {
        const nextQuantity = clampQuantity(requestedQuantity, product.maxQuantity);

        if (nextQuantity < requestedQuantity) {
          result = {
            ok: false,
            message: "Quantité limitée par le stock disponible.",
          };
        }

        return [...currentItems, { product, quantity: nextQuantity }];
      }

      const nextQuantity = clampQuantity(
        existing.quantity + requestedQuantity,
        product.maxQuantity,
      );

      if (nextQuantity === existing.quantity) {
        result = {
          ok: false,
          message: "Stock insuffisant pour ajouter plus d'unités.",
        };
      }

      return currentItems.map((item) =>
        item.product.id === product.id
          ? { product, quantity: nextQuantity }
          : item,
      );
    });

    return result;
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    updateStoredCartItems((currentItems) =>
      currentItems.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: clampQuantity(quantity, item.product.maxQuantity),
            }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    updateStoredCartItems((currentItems) =>
      currentItems.filter((item) => item.product.id !== productId),
    );
  }, []);

  const clearCart = useCallback(() => {
    writeStoredCartItems([]);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const cartCount = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    );
    // Estimation "livraison a domicile" affichee dans le panier, avant que le
    // client ait choisi son mode de retrait. Le montant vient des reglages du
    // site et non plus d'une constante ecrite en dur.
    const deliveryFee = items.length > 0 ? configuredDeliveryFee : 0;

    return {
      items,
      cartCount,
      subtotal,
      deliveryFee,
      homeDeliveryFee: configuredDeliveryFee,
      total: subtotal + deliveryFee,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    };
  }, [
    addItem,
    clearCart,
    configuredDeliveryFee,
    items,
    removeItem,
    updateQuantity,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}

function clampQuantity(quantity: number, maxQuantity: number) {
  const normalized = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
  return Math.min(Math.max(normalized, 1), Math.max(maxQuantity, 1));
}

function subscribeToCartStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === CART_STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CART_CHANGE_EVENT, onStoreChange);
  const initialSync = window.setTimeout(onStoreChange, 0);

  return () => {
    window.clearTimeout(initialSync);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CART_CHANGE_EVENT, onStoreChange);
  };
}

function getStoredCartSnapshot() {
  return JSON.stringify(readStoredCartItems());
}

function getServerCartSnapshot() {
  return EMPTY_CART_SNAPSHOT;
}

function updateStoredCartItems(updater: (items: CartItem[]) => CartItem[]) {
  writeStoredCartItems(updater(readStoredCartItems()));
}

function writeStoredCartItems(items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
}

function readStoredCartItems() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as CartItem[];

    return parsed
      .filter((item) => item.product && item.quantity > 0)
      .map((item) => ({
        ...item,
        quantity: clampQuantity(item.quantity, item.product.maxQuantity),
      }));
  } catch {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
}

function parseStoredCartItems(snapshot: string) {
  try {
    const parsed = JSON.parse(snapshot) as CartItem[];

    return parsed
      .filter((item) => item.product && item.quantity > 0)
      .map((item) => ({
        ...item,
        quantity: clampQuantity(item.quantity, item.product.maxQuantity),
      }));
  } catch {
    return [];
  }
}
