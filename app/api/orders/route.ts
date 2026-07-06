import { NextRequest } from "next/server";
import { ZodError } from "zod";
import {
  errorJson,
  fieldErrorsFromZod,
  okJson,
} from "@/lib/api/responses";
import { guardPublicMutation } from "@/lib/api/guards";
import { createWebsiteOrder } from "@/lib/services/orders";
import { StockReservationError } from "@/lib/services/stock";
import { websiteOrderSchema } from "@/lib/validations/order";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const guarded = guardPublicMutation(request, "checkout");

    if (guarded) return guarded;

    const payload = await request.json();
    const input = websiteOrderSchema.parse(payload);
    const order = await createWebsiteOrder(input);

    return okJson({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorJson(
        "Veuillez corriger les champs indiqués.",
        400,
        fieldErrorsFromZod(error),
      );
    }

    if (error instanceof StockReservationError) {
      return errorJson(error.message, 409);
    }

    if (error instanceof Error && isBusinessError(error.message)) {
      return errorJson(error.message, 400);
    }

    return errorJson(
      "Le service de commande est momentanément indisponible. Veuillez réessayer ou nous contacter par WhatsApp.",
      503,
    );
  }
}


function isBusinessError(message: string) {
  return (
    message.includes("Produit") ||
    message.includes("produit") ||
    message.includes("panier")
  );
}
