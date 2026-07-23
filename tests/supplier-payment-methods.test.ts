import { describe, expect, it } from "vitest";
import {
  adminSupplierPaymentSchema,
  adminSupplierPurchaseSchema,
} from "@/lib/validations/admin-suppliers";

describe("supplier payment methods", () => {
  it("accepts a controlled supplier payment method", () => {
    const result = adminSupplierPaymentSchema.safeParse({
      purchaseId: "purchase-1",
      amount: 250,
      method: "BANK_TRANSFER",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an arbitrary payment method", () => {
    const result = adminSupplierPaymentSchema.safeParse({
      purchaseId: "purchase-1",
      amount: 250,
      method: "texte libre",
    });

    expect(result.success).toBe(false);
  });

  it("defaults a new purchase payment to cash", () => {
    const result = adminSupplierPurchaseSchema.safeParse({
      supplierId: "supplier-1",
      depotId: "depot-1",
      date: new Date("2026-07-23"),
      status: "DRAFT",
      transportFee: 0,
      customsFee: 0,
      otherFee: 0,
      paid: 0,
      items: [
        {
          productId: "product-1",
          quantity: 1,
          unitBuyPrice: 100,
          updateProductPrice: false,
        },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.paymentMethod).toBe("CASH");
  });
});
