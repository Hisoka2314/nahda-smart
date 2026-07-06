"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { formatMad } from "@/lib/utils";

type CartHeaderActionProps = {
  compact?: boolean;
  tone?: "light" | "dark";
};

export function CartHeaderAction({
  compact = false,
  tone = "dark",
}: CartHeaderActionProps) {
  const { cartCount, subtotal } = useCart();
  const light = tone === "light";

  if (compact) {
    return (
      <Link
        href="/panier"
        aria-label={`Panier, ${cartCount} article${cartCount > 1 ? "s" : ""}`}
        className="focus-ring relative grid h-9 w-9 place-items-center rounded-control border border-white/40 bg-white/[0.06] text-white transition hover:bg-white/[0.14]"
      >
        <ShoppingCart size={21} />
        {cartCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-nahda-olive px-1 text-[10px] font-black text-white">
            {cartCount}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href="/panier"
      className="group relative grid min-w-[76px] justify-items-center gap-1 rounded-[10px] px-2 py-2 text-center transition hover:bg-surface-muted"
      aria-label={`Panier, ${cartCount} article${cartCount > 1 ? "s" : ""}`}
    >
      <span className="relative">
        <ShoppingCart
          size={22}
          className={
            light
              ? "text-white transition group-hover:text-[#a8c84c]"
              : "text-nahda-ink transition group-hover:text-nahda-olive"
          }
        />
        <span className="absolute -right-2.5 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-nahda-olive px-1 text-[10px] font-black text-white">
          {cartCount}
        </span>
      </span>
      <span className="text-xs font-black leading-none text-nahda-ink">
        Panier
      </span>
      <span className="text-[11px] leading-none text-neutral-500">
        {formatMad(subtotal)}
      </span>
    </Link>
  );
}
