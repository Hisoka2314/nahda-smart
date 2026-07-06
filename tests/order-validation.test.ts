import { describe, expect, it } from "vitest";
import { websiteOrderSchema } from "@/lib/validations/order";

function validOrder(overrides: Record<string, unknown> = {}) {
  return {
    customer: {
      fullName: "Client Test",
      phone: "0612345678",
      email: "",
      city: "Casablanca",
      address: "12 rue des Tests",
      customerType: "individual",
      organizationName: "",
      note: "",
    },
    deliveryMethod: "home_delivery",
    paymentMethod: "cash_on_delivery",
    items: [{ productSlug: "hp-probook-450-g10", quantity: 2 }],
    ...overrides,
  };
}

describe("websiteOrderSchema", () => {
  it("accepte une commande valide", () => {
    expect(websiteOrderSchema.safeParse(validOrder()).success).toBe(true);
  });

  it("plafonne la quantite par article (anti-epuisement de stock)", () => {
    const result = websiteOrderSchema.safeParse(
      validOrder({ items: [{ productSlug: "hp-probook-450-g10", quantity: 500 }] }),
    );
    expect(result.success).toBe(false);
  });

  it("plafonne le nombre d'articles", () => {
    const items = Array.from({ length: 31 }, (_, i) => ({
      productSlug: `produit-${i}`,
      quantity: 1,
    }));
    expect(websiteOrderSchema.safeParse(validOrder({ items })).success).toBe(false);
  });

  it("rejette quantite nulle ou negative", () => {
    expect(
      websiteOrderSchema.safeParse(
        validOrder({ items: [{ productSlug: "x-y", quantity: 0 }] }),
      ).success,
    ).toBe(false);
    expect(
      websiteOrderSchema.safeParse(
        validOrder({ items: [{ productSlug: "x-y", quantity: -3 }] }),
      ).success,
    ).toBe(false);
  });

  it("rejette un telephone non marocain", () => {
    const order = validOrder();
    (order.customer as { phone: string }).phone = "123";
    expect(websiteOrderSchema.safeParse(order).success).toBe(false);
  });

  it("exige l'adresse pour la livraison a domicile", () => {
    const order = validOrder();
    (order.customer as { address: string }).address = "";
    expect(websiteOrderSchema.safeParse(order).success).toBe(false);
  });

  it("exige l'organisation pour un client entreprise", () => {
    const order = validOrder();
    (order.customer as { customerType: string }).customerType = "company";
    expect(websiteOrderSchema.safeParse(order).success).toBe(false);
  });
});
