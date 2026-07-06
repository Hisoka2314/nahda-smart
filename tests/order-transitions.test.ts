import { describe, expect, it } from "vitest";
import {
  isOrderTransitionAllowed,
  shouldReleaseReservedStock,
  shouldReserveOnConfirmation,
} from "@/lib/services/order-transitions";

describe("isOrderTransitionAllowed", () => {
  it("suit le cycle de vie nominal", () => {
    expect(isOrderTransitionAllowed("PENDING_CONFIRMATION", "CONFIRMED")).toBe(true);
    expect(isOrderTransitionAllowed("CONFIRMED", "PREPARING")).toBe(true);
    expect(isOrderTransitionAllowed("CONFIRMED", "SHIPPED")).toBe(true);
    expect(isOrderTransitionAllowed("PREPARING", "SHIPPED")).toBe(true);
    expect(isOrderTransitionAllowed("SHIPPED", "DELIVERED")).toBe(true);
    expect(isOrderTransitionAllowed("DELIVERED", "RETURNED")).toBe(true);
  });

  it("interdit de sauter l'etape CONFIRMED (reservation du stock)", () => {
    expect(isOrderTransitionAllowed("PENDING_CONFIRMATION", "SHIPPED")).toBe(false);
    expect(isOrderTransitionAllowed("PENDING_CONFIRMATION", "DELIVERED")).toBe(false);
    expect(isOrderTransitionAllowed("PENDING_CONFIRMATION", "PREPARING")).toBe(false);
  });

  it("interdit les retours en arriere", () => {
    expect(isOrderTransitionAllowed("SHIPPED", "PENDING_CONFIRMATION")).toBe(false);
    expect(isOrderTransitionAllowed("DELIVERED", "CONFIRMED")).toBe(false);
    expect(isOrderTransitionAllowed("PREPARING", "PENDING_CONFIRMATION")).toBe(false);
  });

  it("rend CANCELLED et RETURNED terminaux", () => {
    expect(isOrderTransitionAllowed("CANCELLED", "CONFIRMED")).toBe(false);
    expect(isOrderTransitionAllowed("CANCELLED", "PENDING_CONFIRMATION")).toBe(false);
    expect(isOrderTransitionAllowed("RETURNED", "DELIVERED")).toBe(false);
  });

  it("interdit l'annulation apres expedition (utiliser RETURNED)", () => {
    expect(isOrderTransitionAllowed("SHIPPED", "CANCELLED")).toBe(false);
    expect(isOrderTransitionAllowed("DELIVERED", "CANCELLED")).toBe(false);
  });

  it("tolere la re-application du meme statut (idempotence)", () => {
    expect(isOrderTransitionAllowed("CONFIRMED", "CONFIRMED")).toBe(true);
  });
});

describe("shouldReserveOnConfirmation", () => {
  it("reserve uniquement au passage PENDING -> CONFIRMED", () => {
    expect(shouldReserveOnConfirmation("PENDING_CONFIRMATION", "CONFIRMED")).toBe(true);
    expect(shouldReserveOnConfirmation("CONFIRMED", "PREPARING")).toBe(false);
    expect(shouldReserveOnConfirmation("PENDING_CONFIRMATION", "CANCELLED")).toBe(false);
  });
});

describe("shouldReleaseReservedStock", () => {
  it("libere la reservation sur annulation avant expedition", () => {
    expect(shouldReleaseReservedStock("PENDING_CONFIRMATION", "CANCELLED")).toBe(true);
    expect(shouldReleaseReservedStock("CONFIRMED", "CANCELLED")).toBe(true);
    expect(shouldReleaseReservedStock("PREPARING", "CANCELLED")).toBe(true);
  });

  it("reintegre le stock sur retour apres expedition/livraison", () => {
    expect(shouldReleaseReservedStock("SHIPPED", "RETURNED")).toBe(true);
    expect(shouldReleaseReservedStock("DELIVERED", "RETURNED")).toBe(true);
  });

  it("ne touche pas au stock sur les autres transitions", () => {
    expect(shouldReleaseReservedStock("PENDING_CONFIRMATION", "CONFIRMED")).toBe(false);
    expect(shouldReleaseReservedStock("CONFIRMED", "SHIPPED")).toBe(false);
    expect(shouldReleaseReservedStock("SHIPPED", "DELIVERED")).toBe(false);
  });
});
