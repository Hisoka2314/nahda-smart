import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getCurrentAdmin, hasConfiguredAdmin } from "@/lib/auth/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Connexion admin | Nahda Smart",
  description: "Connexion securisee a l'espace admin Nahda Smart.",
};

type AdminLoginPageProps = {
  searchParams: Promise<{
    loggedOut?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const admin = await getCurrentAdmin().catch(() => null);

  if (admin) {
    redirect("/admin");
  }

  const [{ loggedOut }, configuredResult] = await Promise.all([
    searchParams,
    hasConfiguredAdmin()
      .then((configured) => ({ configured, unavailable: false }))
      .catch(() => ({ configured: false, unavailable: true })),
  ]);

  return (
    <AdminLoginForm
      authUnavailable={configuredResult.unavailable}
      hasConfiguredAdmin={configuredResult.configured}
      loggedOut={loggedOut === "1"}
    />
  );
}
