import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentAdmin } from "@/lib/auth/admin-auth";
import { adminRoleLabels } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Acces refuse | Nahda Smart Admin",
  description: "Acces admin refuse pour role insuffisant.",
};

export default async function AdminUnauthorizedPage() {
  const admin = await getCurrentAdmin();

  return (
    <main className="min-h-screen bg-[#050b0d] px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center">
        <Card variant="dark" className="w-full border-white/10">
          <CardContent className="grid gap-5 p-8 text-center">
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-500/12 text-red-200">
              <ShieldAlert size={28} />
            </span>
            <div>
              <h1 className="text-2xl font-black">Acces non autorise</h1>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Votre role ne permet pas d&apos;ouvrir cette section admin.
              </p>
            </div>
            {admin ? (
              <p className="rounded-control border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/72">
                Connecte : {admin.name} - {adminRoleLabels[admin.role]}
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/admin"
                className="focus-ring inline-flex h-11 items-center justify-center rounded-control bg-nahda-olive px-5 text-sm font-bold text-white transition hover:bg-nahda-olive-dark"
              >
                Retour admin
              </Link>
              <Link
                href="/admin/login"
                className="focus-ring inline-flex h-11 items-center justify-center rounded-control border border-white/35 bg-white/[0.06] px-5 text-sm font-bold text-white transition hover:bg-white/[0.14]"
              >
                Connexion
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
