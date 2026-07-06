import type { NextRequest } from "next/server";
import { errorJson } from "@/lib/api/responses";
import {
  isSameOriginRequest,
  publicMutationRateLimit,
} from "@/lib/security/rate-limit";

type PublicMutationScope = "checkout" | "quote" | "contact" | "tracking";

export function guardPublicMutation(
  request: NextRequest,
  scope: PublicMutationScope,
) {
  if (!isSameOriginRequest(request)) {
    return errorJson("Requete non autorisee.", 403);
  }

  const rateLimit = publicMutationRateLimit(request, scope);

  if (rateLimit.limited) {
    return errorJson(
      "Trop de demandes. Veuillez patienter avant de reessayer.",
      429,
      undefined,
      {
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds ?? 60),
        },
      },
    );
  }

  return null;
}
