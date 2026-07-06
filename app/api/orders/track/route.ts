import { NextRequest } from "next/server";
import { ZodError } from "zod";
import {
  errorJson,
  fieldErrorsFromZod,
  okJson,
} from "@/lib/api/responses";
import { guardPublicMutation } from "@/lib/api/guards";
import { trackPublicOrder } from "@/lib/services/orders";
import { orderTrackingSchema } from "@/lib/validations/order";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const guarded = guardPublicMutation(request, "tracking");

    if (guarded) return guarded;

    const payload = await request.json();
    const input = orderTrackingSchema.parse(payload);
    const order = await trackPublicOrder(input);

    if (!order) {
      return errorJson(
        "Commande introuvable. Vérifiez le numéro et le téléphone.",
        404,
      );
    }

    return okJson({ order });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorJson(
        "Veuillez corriger les champs indiqués.",
        400,
        fieldErrorsFromZod(error),
      );
    }

    return errorJson(
      "Le suivi commande est momentanément indisponible. Veuillez réessayer plus tard.",
      503,
    );
  }
}
