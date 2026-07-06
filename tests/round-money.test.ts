import { describe, expect, it } from "vitest";
import { roundMoney } from "@/lib/utils";

describe("roundMoney", () => {
  it("arrondit a 2 decimales", () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(10.004)).toBe(10);
    expect(roundMoney(1234.5599999999)).toBe(1234.56);
  });

  it("neutralise les derives flottantes classiques", () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    // Cas reel : cumul de paiements qui doit atteindre exactement le total.
    const total = 1999.99;
    const paid = roundMoney(roundMoney(999.99) + roundMoney(1000));
    expect(paid).toBe(total);
    expect(paid > total).toBe(false);
  });

  it("gere zero et les negatifs", () => {
    expect(roundMoney(0)).toBe(0);
    expect(roundMoney(-10.004)).toBe(-10);
    expect(roundMoney(-10.006)).toBe(-10.01);
  });
});
