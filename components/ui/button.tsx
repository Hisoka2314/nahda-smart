import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "promo"
  | "danger"
  | "dark"
  | "lightOutline";

type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-nahda-olive text-white shadow-[0_10px_24px_rgb(85_114_15_/_0.28)] hover:bg-nahda-olive-dark",
  secondary:
    "bg-nahda-olive-soft text-nahda-olive-dark hover:bg-[#dfecc8]",
  outline:
    "border border-nahda-olive/[0.45] bg-white text-nahda-olive-dark hover:border-nahda-olive hover:bg-nahda-olive-soft",
  ghost: "text-nahda-ink hover:bg-surface-muted",
  promo: "bg-nahda-orange text-white hover:bg-[#d9610a]",
  danger:
    "bg-red-600 text-white shadow-[0_10px_24px_rgb(220_38_38_/_0.2)] hover:bg-red-700",
  dark: "bg-nahda-ink text-white hover:bg-[#172016]",
  lightOutline:
    "border border-white/40 bg-white/[0.06] text-white backdrop-blur hover:bg-white/[0.14]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-11 w-11 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "focus-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-control font-bold transition duration-200 disabled:pointer-events-none disabled:opacity-55",
        "active:translate-y-px",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);

Button.displayName = "Button";
