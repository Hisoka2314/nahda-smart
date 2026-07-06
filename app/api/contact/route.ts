import { NextRequest } from "next/server";
import { ZodError } from "zod";
import {
  errorJson,
  fieldErrorsFromZod,
  okJson,
} from "@/lib/api/responses";
import { guardPublicMutation } from "@/lib/api/guards";
import { createContactMessage } from "@/lib/services/contact";
import { contactMessageSchema } from "@/lib/validations/contact";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const guarded = guardPublicMutation(request, "contact");

    if (guarded) return guarded;

    const payload = await request.json();
    const input = contactMessageSchema.parse(payload);
    const contact = await createContactMessage(input);

    return okJson({ contact }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorJson(
        "Veuillez corriger les champs indiqués.",
        400,
        fieldErrorsFromZod(error),
      );
    }

    return errorJson(
      "Le service contact est momentanément indisponible. Veuillez réessayer ou nous contacter par WhatsApp.",
      503,
    );
  }
}
