"use client";

import Link from "next/link";
import { ArrowLeftRight, Heart } from "lucide-react";
import { useCompare } from "@/components/compare/compare-provider";
import { useFavorites } from "@/components/favorites/favorites-provider";

export function CollectionHeaderActions() {
  const favorites = useFavorites();
  const compare = useCompare();

  const actions = [
    {
      label: "Favoris",
      detail: "Mes favoris",
      href: "/favoris",
      icon: Heart,
      count: favorites.count,
    },
    {
      label: "Comparer",
      detail: "Comparateur",
      href: "/comparateur",
      icon: ArrowLeftRight,
      count: compare.count,
    },
  ];

  return (
    <>
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="focus-ring group relative grid min-w-[76px] justify-items-center gap-1 rounded-[10px] px-2 py-2 text-center transition hover:bg-surface-muted"
          aria-label={`${action.label}, ${action.count} produit${action.count > 1 ? "s" : ""}`}
        >
          <span className="relative">
            <action.icon
              size={22}
              className="text-nahda-ink transition group-hover:text-nahda-olive"
            />
            {action.count > 0 ? (
              <span className="absolute -right-2.5 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-nahda-olive px-1 text-[10px] font-black text-white">
                {action.count}
              </span>
            ) : null}
          </span>
          <span className="text-xs font-black leading-none text-nahda-ink">
            {action.label}
          </span>
          <span className="text-[11px] leading-none text-neutral-500">
            {action.detail}
          </span>
        </Link>
      ))}
    </>
  );
}
