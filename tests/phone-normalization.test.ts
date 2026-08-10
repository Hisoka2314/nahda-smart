import { describe, expect, it } from "vitest";
import { normalizeMoroccanPhone } from "@/lib/validations/common";

describe("normalizeMoroccanPhone", () => {
  it("ramene les notations locales et internationales a la meme cle", () => {
    const attendu = "212612345678";

    expect(normalizeMoroccanPhone("0612345678")).toBe(attendu);
    expect(normalizeMoroccanPhone("+212612345678")).toBe(attendu);
    expect(normalizeMoroccanPhone("212612345678")).toBe(attendu);
    expect(normalizeMoroccanPhone("06 12 34 56 78")).toBe(attendu);
    expect(normalizeMoroccanPhone("06.12.34.56.78")).toBe(attendu);
    expect(normalizeMoroccanPhone("  +212 612-345-678 ")).toBe(attendu);
  });

  it("permet au client de suivre sa commande avec l'autre notation", () => {
    // Regression : le client enregistre en +212... ne retrouvait pas sa
    // commande en saisissant 06..., les deux formes ne se rejoignaient pas.
    const enregistre = normalizeMoroccanPhone("+212658666666");
    const saisi = normalizeMoroccanPhone("0658666666");

    expect(enregistre).toBe(saisi);
  });

  it("est idempotente", () => {
    const une = normalizeMoroccanPhone("0612345678");

    expect(normalizeMoroccanPhone(une)).toBe(une);
  });

  it("ne fabrique pas de prefixe sur une saisie deja sans zero initial", () => {
    expect(normalizeMoroccanPhone("612345678")).toBe("612345678");
  });
});
