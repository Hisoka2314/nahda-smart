"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SectionCarouselProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  controlsClassName?: string;
};

export function SectionCarousel({
  ariaLabel,
  children,
  className,
  controlsClassName,
}: SectionCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "previous" | "next") => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const scrollDistance = Math.min(viewport.clientWidth * 0.86, 760);

    viewport.scrollBy({
      left: direction === "next" ? scrollDistance : -scrollDistance,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <div className={cn("relative max-w-full overflow-hidden", className)}>
      <div
        className={cn(
          "mb-4 flex items-center justify-end gap-2",
          controlsClassName,
        )}
      >
        <Button
          variant="outline"
          size="icon"
          aria-label={`Faire défiler ${ariaLabel} vers la gauche`}
          onClick={() => scroll("previous")}
          className="h-10 w-10 rounded-full bg-white/95 shadow-card"
        >
          <ChevronLeft size={18} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Faire défiler ${ariaLabel} vers la droite`}
          onClick={() => scroll("next")}
          className="h-10 w-10 rounded-full bg-white/95 shadow-card"
        >
          <ChevronRight size={18} />
        </Button>
      </div>
      <div
        ref={viewportRef}
        role="region"
        aria-label={ariaLabel}
        className="hide-scrollbar flex max-w-full snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4"
      >
        {children}
      </div>
    </div>
  );
}
