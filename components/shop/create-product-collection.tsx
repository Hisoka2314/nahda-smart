"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CartProduct } from "@/types/cart";

export type ProductCollectionValue = {
  items: CartProduct[];
  count: number;
  has: (productId: string) => boolean;
  toggle: (product: CartProduct) => ProductCollectionResult;
  add: (product: CartProduct) => ProductCollectionResult;
  remove: (productId: string) => void;
  clear: () => void;
};

export type ProductCollectionResult = {
  ok: boolean;
  active: boolean;
  message: string;
};

type CollectionConfig = {
  storageKey: string;
  eventName: string;
  addedMessage: string;
  removedMessage: string;
  limit?: number;
  limitMessage?: string;
  hookName: string;
};

const EMPTY_SNAPSHOT = "[]";

export function createProductCollection(config: CollectionConfig) {
  const Context = createContext<ProductCollectionValue | null>(null);

  function readItems(): CartProduct[] {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(config.storageKey);

      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as CartProduct[];

      return parsed.filter((item) => item && typeof item.id === "string");
    } catch {
      window.localStorage.removeItem(config.storageKey);
      return [];
    }
  }

  function writeItems(items: CartProduct[]) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(config.storageKey, JSON.stringify(items));
    window.dispatchEvent(new Event(config.eventName));
  }

  function subscribe(onStoreChange: () => void) {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === config.storageKey) {
        onStoreChange();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(config.eventName, onStoreChange);
    const initialSync = window.setTimeout(onStoreChange, 0);

    return () => {
      window.clearTimeout(initialSync);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(config.eventName, onStoreChange);
    };
  }

  function getSnapshot() {
    return JSON.stringify(readItems());
  }

  function getServerSnapshot() {
    return EMPTY_SNAPSHOT;
  }

  function Provider({ children }: { children: ReactNode }) {
    const snapshot = useSyncExternalStore(
      subscribe,
      getSnapshot,
      getServerSnapshot,
    );
    const items = useMemo<CartProduct[]>(() => {
      try {
        return JSON.parse(snapshot) as CartProduct[];
      } catch {
        return [];
      }
    }, [snapshot]);

    const add = useCallback((product: CartProduct): ProductCollectionResult => {
      const current = readItems();

      if (current.some((item) => item.id === product.id)) {
        return { ok: true, active: true, message: config.addedMessage };
      }

      if (config.limit && current.length >= config.limit) {
        return {
          ok: false,
          active: false,
          message: config.limitMessage ?? "Limite atteinte.",
        };
      }

      writeItems([...current, product]);
      return { ok: true, active: true, message: config.addedMessage };
    }, []);

    const toggle = useCallback(
      (product: CartProduct): ProductCollectionResult => {
        const current = readItems();

        if (current.some((item) => item.id === product.id)) {
          writeItems(current.filter((item) => item.id !== product.id));
          return { ok: true, active: false, message: config.removedMessage };
        }

        if (config.limit && current.length >= config.limit) {
          return {
            ok: false,
            active: true,
            message: config.limitMessage ?? "Limite atteinte.",
          };
        }

        writeItems([...current, product]);
        return { ok: true, active: true, message: config.addedMessage };
      },
      [],
    );

    const remove = useCallback((productId: string) => {
      writeItems(readItems().filter((item) => item.id !== productId));
    }, []);

    const clear = useCallback(() => {
      writeItems([]);
    }, []);

    const value = useMemo<ProductCollectionValue>(() => {
      const ids = new Set(items.map((item) => item.id));

      return {
        items,
        count: items.length,
        has: (productId: string) => ids.has(productId),
        toggle,
        add,
        remove,
        clear,
      };
    }, [add, clear, items, remove, toggle]);

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useCollection() {
    const context = useContext(Context);

    if (!context) {
      throw new Error(`${config.hookName} must be used inside its provider`);
    }

    return context;
  }

  return { Provider, useCollection };
}
