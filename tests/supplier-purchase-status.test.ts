import { describe, expect, it } from "vitest";
import {
  isReceivedStatus,
  normalizePurchaseStatus,
} from "@/lib/services/supplier-purchase-status";

describe("normalizePurchaseStatus", () => {
  it("garde un brouillon en brouillon meme avec un acompte", () => {
    expect(normalizePurchaseStatus("DRAFT", 0, 1000)).toBe("DRAFT");
    expect(normalizePurchaseStatus("DRAFT", 500, 1000)).toBe("DRAFT");
    expect(normalizePurchaseStatus("DRAFT", 1000, 1000)).toBe("DRAFT");
  });

  it("derive le statut paye d'un achat recu", () => {
    expect(normalizePurchaseStatus("RECEIVED", 0, 1000)).toBe("RECEIVED");
    expect(normalizePurchaseStatus("RECEIVED", 400, 1000)).toBe("PARTIALLY_PAID");
    expect(normalizePurchaseStatus("RECEIVED", 1000, 1000)).toBe("PAID");
  });

  it("preserve l'annulation", () => {
    expect(normalizePurchaseStatus("CANCELLED", 500, 1000)).toBe("CANCELLED");
  });

  it("ne marque jamais PAID un achat a total nul", () => {
    expect(normalizePurchaseStatus("RECEIVED", 0, 0)).toBe("RECEIVED");
  });
});

describe("isReceivedStatus", () => {
  it("seuls les statuts recus declenchent l'entree en stock", () => {
    expect(isReceivedStatus("RECEIVED")).toBe(true);
    expect(isReceivedStatus("PARTIALLY_PAID")).toBe(true);
    expect(isReceivedStatus("PAID")).toBe(true);
    expect(isReceivedStatus("DRAFT")).toBe(false);
    expect(isReceivedStatus("CANCELLED")).toBe(false);
  });
});
