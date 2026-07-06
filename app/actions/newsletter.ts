"use server";

import { headers } from "next/headers";
import {
  subscribeToNewsletter,
  type NewsletterSubscribeResult,
} from "@/lib/services/newsletter";
import { publicActionRateLimit } from "@/lib/security/rate-limit";

export async function subscribeToNewsletterAction(
  _previousState: NewsletterSubscribeResult | null,
  formData: FormData,
): Promise<NewsletterSubscribeResult> {
  try {
    const limit = publicActionRateLimit(await headers(), "newsletter");

    if (limit.limited) {
      return {
        ok: false,
        message: "Trop de tentatives. Veuillez patienter avant de réessayer.",
      };
    }

    return await subscribeToNewsletter(formData.get("email"));
  } catch {
    return {
      ok: false,
      message: "Inscription impossible pour le moment. Réessayez plus tard.",
    };
  }
}
