import { describe, expect, it } from "vitest";
import { computeCmup } from "@/lib/cmup";

describe("computeCmup", () => {
  it("calcule la moyenne pondérée classique", () => {
    // 10 unités à 100 DH en stock + 5 unités reçues à 130 DH
    // = (10*100 + 5*130) / 15 = 1650 / 15 = 110
    expect(
      computeCmup({
        stockBefore: 10,
        currentCmup: 100,
        receivedQuantity: 5,
        unitPrice: 130,
      }),
    ).toBe(110);
  });

  it("repart du prix reçu quand le stock est vide", () => {
    expect(
      computeCmup({
        stockBefore: 0,
        currentCmup: 80,
        receivedQuantity: 3,
        unitPrice: 95,
      }),
    ).toBe(95);
  });

  it("repart du prix reçu quand aucun CMUP n'existe", () => {
    expect(
      computeCmup({
        stockBefore: 12,
        currentCmup: null,
        receivedQuantity: 4,
        unitPrice: 50,
      }),
    ).toBe(50);
  });

  it("ignore un stock négatif (données corrompues) sans casser", () => {
    expect(
      computeCmup({
        stockBefore: -3,
        currentCmup: 100,
        receivedQuantity: 2,
        unitPrice: 60,
      }),
    ).toBe(60);
  });

  it("arrondit à 2 décimales", () => {
    // (3*100 + 1*99) / 4 = 99.75
    expect(
      computeCmup({
        stockBefore: 3,
        currentCmup: 100,
        receivedQuantity: 1,
        unitPrice: 99,
      }),
    ).toBe(99.75);
  });

  it("refuse une quantité nulle ou négative", () => {
    expect(() =>
      computeCmup({
        stockBefore: 5,
        currentCmup: 100,
        receivedQuantity: 0,
        unitPrice: 50,
      }),
    ).toThrow();
  });
});
