import { describe, expect, it } from "vitest";
import { adminProductAttributeSchema } from "@/lib/validations/admin-catalogue";

function submit(field: string, value: string) {
  const form = new FormData();
  form.set("productId", "product");
  form.set("attributeId", "attribute");
  form.set(field, value);
  return adminProductAttributeSchema.safeParse(Object.fromEntries(
    ["productId", "attributeId", "optionId", "valueString", "valueNumber", "valueBoolean"]
      .map((key) => [key, form.get(key)]),
  ));
}

describe("formulaire des attributs produit", () => {
  it.each([
    ["optionId", "option-16go", "option-16go"],
    ["valueString", "Intel Core i5", "Intel Core i5"],
    ["valueNumber", "0", 0],
    ["valueNumber", "13.3", 13.3],
    ["valueBoolean", "false", false],
    ["valueBoolean", "true", true],
  ])("accepte %s sans les champs non affichés", (field, value, expected) => {
    const result = submit(field, value);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data[field as keyof typeof result.data]).toBe(expected);
    if (field !== "valueNumber") expect(result.data.valueNumber).toBeUndefined();
  });
  it.each(["optionId", "valueString", "valueNumber", "valueBoolean"])(
    "permet d'effacer %s sans enregistrer zéro ou faux", (field) => {
      const result = submit(field, "");
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data).toEqual({ productId: "product", attributeId: "attribute" });
    },
  );
  it("refuse un nombre invalide", () => {
    expect(submit("valueNumber", "inconnu").success).toBe(false);
  });
  it("refuse un booléen invalide", () => {
    expect(submit("valueBoolean", "peut-être").success).toBe(false);
  });
});
