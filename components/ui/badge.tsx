import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "olive" | "success" | "promo" | "muted" | "danger";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children: ReactNode;
};

const variants: Record<BadgeVariant, string> = {
  default: "bg-neutral-100 text-neutral-700",
  olive: "bg-nahda-olive-soft text-nahda-olive-dark",
  success: "bg-[#e8f7df] text-[#2f6a13]",
  danger: "bg-[#fde8e8] text-[#a11212]",
  promo: "bg-nahda-orange text-white",
  muted: "bg-white/[0.12] text-white/[0.82]",
};

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-[8px] px-2.5 py-1 text-xs font-black uppercase tracking-normal",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
