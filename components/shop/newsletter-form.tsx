"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { subscribeToNewsletterAction } from "@/app/actions/newsletter";
import type { NewsletterSubscribeResult } from "@/lib/services/newsletter";

const initialState: NewsletterSubscribeResult | null = null;

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(
    subscribeToNewsletterAction,
    initialState,
  );

  return (
    <div className="w-full max-w-xl">
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          aria-label="Votre adresse e-mail"
          placeholder="Votre adresse e-mail"
          className="focus-ring h-12 min-w-0 flex-1 rounded-control border border-border-soft px-4 text-sm"
        />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Envoi..." : "S’inscrire"}
        </Button>
      </form>
      {state ? (
        <p
          className={`mt-2 text-sm font-bold ${
            state.ok ? "text-nahda-olive-dark" : "text-nahda-orange"
          }`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
