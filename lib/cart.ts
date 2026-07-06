import { getBrandName, getCategoryName } from "@/lib/catalogue";
import type { CatalogProduct } from "@/types/catalogue";
import type { CartProduct } from "@/types/cart";
import type { Product } from "@/types/product";

export const CART_STORAGE_KEY = "nahda-smart-cart-v1";

// Aligne avec websiteOrderItemSchema : le serveur refuse au-dela de 20 unites
// par article, inutile de laisser le panier promettre plus.
const MAX_ORDER_QUANTITY = 20;

export function getPurchasableQuantity(
  status: CartProduct["stockStatus"],
  stockQuantity?: number,
) {
  // Stock reel connu (produits venant de la base) : c'est la reference.
  if (typeof stockQuantity === "number") {
    return Math.max(0, Math.min(stockQuantity, MAX_ORDER_QUANTITY));
  }

  // Estimations par statut pour les donnees statiques de demonstration.
  if (status === "out_of_stock") {
    return 0;
  }

  if (status === "on_order") {
    return 4;
  }

  if (status === "low_stock") {
    return 2;
  }

  return 12;
}

export function catalogProductToCartProduct(product: CatalogProduct): CartProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: getBrandName(product.brandSlug),
    category: getCategoryName(product.categorySlug),
    image: product.image,
    price: product.price,
    oldPrice: product.oldPrice,
    stockStatus: product.stockStatus,
    specs: product.specs,
    maxQuantity: getPurchasableQuantity(product.stockStatus, product.stockQuantity),
  };
}

export function productCardToCartProduct(product: Product): CartProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    image: product.image,
    price: product.price,
    oldPrice: product.compareAtPrice,
    stockStatus: product.status,
    specs: product.specs,
    maxQuantity: getPurchasableQuantity(product.status, product.stockQuantity),
  };
}
