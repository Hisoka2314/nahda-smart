"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  submitProductReview,
  type ReviewSubmitResult,
} from "@/lib/services/reviews";
import { publicActionRateLimit } from "@/lib/security/rate-limit";

export async function submitProductReviewAction(
  _previousState: ReviewSubmitResult | null,
  formData: FormData,
): Promise<ReviewSubmitResult> {
  try {
    const limit = publicActionRateLimit(await headers(), "review");

    if (limit.limited) {
      return {
        ok: false,
        message: "Trop d'avis envoyés. Veuillez patienter avant de réessayer.",
      };
    }

    const result = await submitProductReview({
      productSlug: formData.get("productSlug"),
      authorName: formData.get("authorName"),
      rating: formData.get("rating"),
      comment: formData.get("comment"),
    });

    if (result.ok) {
      const slug = formData.get("productSlug");
      if (typeof slug === "string" && slug) {
        revalidatePath(`/produit/${slug}`);
      }
    }

    return result;
  } catch {
    return {
      ok: false,
      message: "Envoi impossible pour le moment. Réessayez plus tard.",
    };
  }
}
