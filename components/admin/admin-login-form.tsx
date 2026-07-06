"use client";

import { useActionState } from "react";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { loginAdminAction } from "@/app/admin/login/actions";

type AdminLoginFormProps = {
  authUnavailable?: boolean;
  hasConfiguredAdmin: boolean;
  loggedOut: boolean;
};

export function AdminLoginForm({
  authUnavailable = false,
  hasConfiguredAdmin,
  loggedOut,
}: AdminLoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAdminAction, {});

  return (
    <main className="min-h-screen bg-[#050b0d] px-4 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_460px]">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <BrandLogo size="admin" tone="light" />
            <span className="mt-10 inline-flex items-center gap-2 rounded-full border border-[#a8c84c]/30 bg-[#a8c84c]/10 px-4 py-2 text-xs font-black uppercase text-[#c7e66d]">
              <ShieldCheck size={15} />
              Espace securise Nahda Smart
            </span>
            <h1 className="mt-6 text-5xl font-black leading-tight">
              Admin boutique, stock et operations.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/62">
              Acces reserve a l&apos;equipe Nahda Smart. Les permissions sont
              controlees cote serveur selon le role admin.
            </p>
          </div>
        </section>

        <section className="rounded-card border border-white/10 bg-white/[0.06] p-5 shadow-[0_28px_90px_rgb(0_0_0_/_0.32)] backdrop-blur md:p-8">
          <div className="mb-8 lg:hidden">
            <BrandLogo size="admin" tone="light" />
          </div>
          <div>
            <p className="text-xs font-black uppercase text-[#a8c84c]">
              Connexion admin
            </p>
            <h2 className="mt-2 text-2xl font-black">Bienvenue</h2>
            <p className="mt-2 text-sm leading-6 text-white/58">
              Connectez-vous avec votre email admin et votre mot de passe.
            </p>
          </div>

          {authUnavailable ? (
            <div className="mt-6 rounded-control border border-red-300/25 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
              Le service admin est momentanement indisponible. Verifiez la
              connexion PostgreSQL locale puis reessayez.
            </div>
          ) : null}

          {!authUnavailable && !hasConfiguredAdmin ? (
            <div className="mt-6 rounded-control border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
              Aucun compte admin n&apos;est configure. Generez un hash admin et
              lancez le script de creation.
            </div>
          ) : null}

          {loggedOut ? (
            <div className="mt-6 rounded-control border border-[#a8c84c]/25 bg-[#a8c84c]/10 p-4 text-sm text-[#d9f58b]">
              Session admin fermee.
            </div>
          ) : null}

          {state.error ? (
            <div className="mt-6 rounded-control border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">
              {state.error}
            </div>
          ) : null}

          <form action={formAction} className="mt-8 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-white">
              Email
              <span className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/38"
                  size={18}
                />
                <input
                  className="focus-ring h-12 w-full rounded-control border border-white/10 bg-white/[0.08] px-3 pl-10 text-sm text-white shadow-sm transition placeholder:text-white/35 hover:border-[#a8c84c]/45"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@nahdasmart.ma"
                  required
                />
              </span>
            </label>
            <label className="grid gap-2 text-sm font-bold text-white">
              Mot de passe
              <span className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/38"
                  size={18}
                />
                <input
                  className="focus-ring h-12 w-full rounded-control border border-white/10 bg-white/[0.08] px-3 pl-10 text-sm text-white shadow-sm transition placeholder:text-white/35 hover:border-[#a8c84c]/45"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Votre mot de passe"
                  required
                />
              </span>
            </label>
            <Button
              type="submit"
              size="lg"
              className="mt-2 w-full"
              disabled={authUnavailable || !hasConfiguredAdmin || isPending}
            >
              {isPending ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
