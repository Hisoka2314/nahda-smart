"use client";

import type { ReactNode } from "react";
import { useEffect, useId } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DrawerSide = "left" | "right";

type DrawerProps = {
  open: boolean;
  title: string;
  side?: DrawerSide;
  children: ReactNode;
  onClose: () => void;
};

export function Drawer({
  open,
  title,
  side = "left",
  children,
  onClose,
}: DrawerProps) {
  const titleId = useId();
  const prefersReducedMotion = useReducedMotion();
  const from = side === "left" ? "-100%" : "100%";

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] bg-nahda-ink/[0.72] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
          onPointerDown={onClose}
        >
          <motion.aside
            className={cn(
              "flex h-dvh w-[min(92vw,392px)] max-w-full flex-col overflow-hidden bg-white shadow-premium",
              side === "right" ? "ml-auto" : "mr-auto",
            )}
            initial={{ x: from }}
            animate={{ x: 0 }}
            exit={{ x: from }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.24,
              ease: "easeOut",
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border-soft bg-white px-5 py-4">
              <h2 id={titleId} className="text-lg font-black text-nahda-ink">
                {title}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Fermer"
                onClick={onClose}
                className="h-10 w-10"
              >
                <X size={20} />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-5">
              {children}
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
