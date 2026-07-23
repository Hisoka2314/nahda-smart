"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { AlertTriangle, LoaderCircle, X } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function AdminConfirmSubmit({
  title,
  description,
  confirmLabel,
  trigger,
  tone = "danger",
}: {
  title: string;
  description: string;
  confirmLabel: string;
  trigger: ReactNode;
  tone?: "danger" | "warning";
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) setOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, pending]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="contents">
        {trigger}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !pending) setOpen(false);
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="w-full max-w-md rounded-card border border-white/12 bg-[#10191b] p-5 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                  tone === "danger"
                    ? "bg-red-500/15 text-red-200"
                    : "bg-amber-400/15 text-amber-100"
                }`}
              >
                <AlertTriangle size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-lg font-black text-white">
                  {title}
                </h2>
                <p id={descriptionId} className="mt-2 text-sm leading-6 text-white/62">
                  {description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                aria-label="Fermer la confirmation"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-control text-white/55 hover:bg-white/[0.08] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="lightOutline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Retour
              </Button>
              <Button
                type="submit"
                variant={tone === "danger" ? "danger" : "primary"}
                disabled={pending}
              >
                {pending ? <LoaderCircle size={16} className="animate-spin" /> : null}
                {pending ? "Traitement..." : confirmLabel}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
