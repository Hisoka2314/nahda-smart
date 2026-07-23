"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Grid2X2, Heart, Home, Search } from "lucide-react";

const mobileItems = [
  { label: "Accueil", href: "/", icon: Home },
  { label: "Catégories", href: "/catalogue", icon: Grid2X2 },
  { label: "Rechercher", href: "/recherche", icon: Search },
  { label: "Favoris", href: "/favoris", icon: Heart },
  { label: "Comparer", href: "/comparateur", icon: ArrowLeftRight },
];

export function MobileBottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-nahda-ink/[0.96] px-1.5 pb-[env(safe-area-inset-bottom)] pt-2 text-white shadow-[0_-16px_42px_rgb(0_0_0_/_0.28)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-0.5 sm:gap-1">
        {mobileItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-[10px] text-[10px] font-semibold transition sm:text-[11px] ${
                active
                  ? "bg-nahda-olive/[0.18] text-[#a8c84c]"
                  : "text-white/[0.78] hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              <item.icon size={22} />
              <span className="max-w-full truncate px-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
