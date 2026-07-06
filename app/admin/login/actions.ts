"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  authenticateAdmin,
  isLoginBlockedByHistory,
} from "@/lib/auth/admin-auth";
import {
  buildLoginRateLimitKey,
  clearLoginFailures,
  isLoginRateLimited,
  recordLoginFailure,
} from "@/lib/auth/rate-limit";

const loginSchema = z.object({
  email: z.string().trim().email("Email invalide."),
  password: z.string().min(1, "Mot de passe obligatoire."),
});

const genericError =
  "Identifiants invalides ou trop de tentatives. Reessayez plus tard.";

async function getRequestMetadata() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "local";

  return {
    ipAddress,
    userAgent: headerStore.get("user-agent") ?? undefined,
  };
}

export async function loginAdminAction(
  _previousState: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.flatten().fieldErrors.email?.[0] ??
        parsed.error.flatten().fieldErrors.password?.[0] ??
        "Formulaire invalide.",
    };
  }

  const metadata = await getRequestMetadata();
  const rateLimitKey = buildLoginRateLimitKey(
    metadata.ipAddress,
    parsed.data.email,
  );

  if (isLoginRateLimited(rateLimitKey)) {
    return { error: genericError };
  }

  if (await isLoginBlockedByHistory(parsed.data.email)) {
    return { error: genericError };
  }

  const result = await authenticateAdmin({
    email: parsed.data.email,
    password: parsed.data.password,
    metadata,
  }).catch(() => ({ ok: false as const }));

  if (!result.ok) {
    recordLoginFailure(rateLimitKey);
    return { error: genericError };
  }

  clearLoginFailures(rateLimitKey);
  redirect("/admin");
}
