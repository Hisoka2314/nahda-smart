import { describe, expect, it } from "vitest";
import { encodeValue, sameValue, validateEvidence } from "@/scripts/lib/verified-specs.mjs";

const evidence = [
  { url: "https://manufacturer.example/spec", proof: "Core i5" },
  { url: "https://seller.example/item", proof: "Intel Core i5" },
];

describe("correspondances vérifiées", () => {
  it("exige deux preuves HTTPS avec un extrait", () => {
    expect(validateEvidence({ value: "Intel Core i5", status: "verified", checkedAt: "2026-09-09", scope: "configuration", evidence })).toBe(true);
    expect(validateEvidence({ value: "Intel Core i5", status: "verified", checkedAt: "2026-09-09", scope: "configuration", evidence: [evidence[0]] })).toBe(false);
    expect(validateEvidence({ value: "Intel Core i5", status: "verified", checkedAt: "2026-09-09", scope: "configuration", evidence: [{ url: "http://seller.example/item", proof: "Core i5" }, evidence[0]] })).toBe(false);
  });

  it("convertit un booléen en option Oui/Non pour un filtre à cases", () => {
    expect(encodeValue({ type: "CHECKBOX" }, [{ id: "yes", label: "Oui", value: "Oui", visible: true }], true)).toEqual({ optionId: "yes" });
  });

  it("reconnaît une valeur déjà écrite comme identique", () => {
    expect(sameValue([{ optionId: "option", valueString: null, valueNumber: null, valueBoolean: null }], { optionId: "option" })).toBe(true);
  });
});
