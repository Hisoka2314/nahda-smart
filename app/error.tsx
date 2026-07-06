"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#071112] px-4 py-12 text-white">
      <section className="w-full max-w-xl rounded-card border border-white/10 bg-white/[0.055] p-8 text-center shadow-[0_22px_70px_rgb(0_0_0_/_0.35)]">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-control border border-amber-400/30 bg-amber-400/12 text-amber-200">
          <AlertTriangle size={24} />
        </span>
        <p className="mt-5 text-xs font-black uppercase text-nahda-olive">
          Nahda Smart
        </p>
        <h1 className="mt-2 text-2xl font-black">Une erreur est survenue</h1>
        <p className="mt-3 text-sm leading-6 text-white/62">
          Le service est momentanement indisponible. Aucune donnee sensible
          n&apos;est affichee sur cette page.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-white/36">Reference : {error.digest}</p>
        ) : null}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={() => unstable_retry()} variant="primary">
            <RotateCcw size={16} />
            Reessayer
          </Button>
          <Link
            href="/"
            className="focus-ring inline-flex h-11 items-center justify-center rounded-control border border-white/20 px-4 text-sm font-bold text-white hover:bg-white/[0.08]"
          >
            Retour accueil
          </Link>
        </div>
      </section>
    </main>
  );
}
