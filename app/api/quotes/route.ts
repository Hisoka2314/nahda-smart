import { NextRequest } from "next/server";
import { ZodError } from "zod";
import {
  errorJson,
  fieldErrorsFromZod,
  okJson,
} from "@/lib/api/responses";
import { guardPublicMutation } from "@/lib/api/guards";
import { createWebsiteQuote } from "@/lib/services/quotes";
import { websiteQuoteSchema } from "@/lib/validations/quote";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const guarded = guardPublicMutation(request, "quote");

    if (guarded) return guarded;

    const payload = await request.json();
    const input = websiteQuoteSchema.parse(payload);
    const quote = await createWebsiteQuote(input);

    return okJson({ quote }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorJson(
        "Veuillez corriger les champs indiqués.",
        400,
        fieldErrorsFromZod(error),
      );
    }

    if (error instanceof Error && error.message.includes("Produit")) {
      return errorJson(error.message, 400);
    }

    return errorJson(
      "Le service de devis est momentanément indisponible. Veuillez réessayer ou nous contacter par WhatsApp.",
      503,
    );
  }
}
