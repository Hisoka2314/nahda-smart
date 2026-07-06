import type { OrderStatus } from "@prisma/client";

// Cycle de vie strict : impossible de sauter l'etape CONFIRMED (qui reserve
// le stock) ou de revenir en arriere. CANCELLED et RETURNED sont terminaux.
export const allowedOrderTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING_CONFIRMATION: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "SHIPPED", "CANCELLED"],
  PREPARING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

export function isOrderTransitionAllowed(
  current: OrderStatus,
  next: OrderStatus,
) {
  if (current === next) return true;
  return allowedOrderTransitions[current].includes(next);
}

export function shouldReserveOnConfirmation(
  current: OrderStatus,
  next: OrderStatus,
) {
  return current === "PENDING_CONFIRMATION" && next === "CONFIRMED";
}

export function shouldReleaseReservedStock(
  current: OrderStatus,
  next: OrderStatus,
) {
  // Annulation avant expedition : liberation de la reservation.
  if (next === "CANCELLED") {
    return ["PENDING_CONFIRMATION", "CONFIRMED", "PREPARING"].includes(current);
  }

  // Retour apres expedition/livraison : la marchandise revient physiquement
  // au depot d'origine. Si elle est defectueuse, la sortir ensuite via un
  // mouvement de stock dedie (OUT / SAV).
  if (next === "RETURNED") {
    return ["SHIPPED", "DELIVERED"].includes(current);
  }

  return false;
}
