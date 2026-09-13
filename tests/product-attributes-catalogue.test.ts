import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { buildAttributes } from "@/lib/adapters/product-adapter";

type Valeurs = Parameters<typeof buildAttributes>[0];

function valeur(overrides: Record<string, unknown>) {
  return {
    id: "valeur",
    productId: "produit",
    attributeId: "attribut",
    optionId: null,
    valueString: null,
    valueNumber: null,
    valueBoolean: null,
    valueJson: null,
    attribute: { slug: "touch", type: "BOOLEAN" },
    option: null,
    ...overrides,
  };
}

function lire(overrides: Record<string, unknown>[]) {
  return buildAttributes(overrides.map(valeur) as unknown as Valeurs);
}

describe("attributs lus pour le catalogue", () => {
  // La boutique compare String(valeur) a la valeur de l'option du filtre,
  // qui vaut "Oui" ou "Non" sur les 49 attributs booleens. Un "true" brut ne
  // correspondait a rien : les filtres Tactile, PoE, Wi-Fi et Scanner
  // restaient invisibles malgre des valeurs verifiees en base.
  it("rend un booleen vrai sous la forme attendue par les filtres", () => {
    expect(lire([{ valueBoolean: true }])).toEqual({ touch: "Oui" });
  });

  it("rend un booleen faux, et ne le confond pas avec une absence", () => {
    expect(lire([{ valueBoolean: false }])).toEqual({ touch: "Non" });
  });

  it("ignore un attribut sans aucune valeur", () => {
    expect(lire([{}])).toEqual({});
  });

  it("prefere l'option au champ libre", () => {
    const attributs = lire([
      {
        optionId: "option",
        option: { value: "16 Go" },
        valueString: "seize gigas",
        attribute: { slug: "ram", type: "CHECKBOX" },
      },
    ]);
    expect(attributs).toEqual({ ram: "16 Go" });
  });

  it("convertit un nombre Decimal en nombre", () => {
    const attributs = lire([
      {
        valueNumber: new Prisma.Decimal("15.6"),
        attribute: { slug: "screenSize", type: "RANGE" },
      },
    ]);
    expect(attributs).toEqual({ screenSize: 15.6 });
  });

  it("regroupe en tableau les valeurs multiples d'un meme attribut", () => {
    const attributs = lire([
      {
        optionId: "hdmi",
        option: { value: "HDMI" },
        attribute: { slug: "gpuOutputs", type: "SEARCH_LIST" },
      },
      {
        optionId: "dvi",
        option: { value: "DVI" },
        attribute: { slug: "gpuOutputs", type: "SEARCH_LIST" },
      },
    ]);
    expect(attributs).toEqual({ gpuOutputs: ["HDMI", "DVI"] });
  });
});
