import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "light" | "dark" | "soft";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  children: ReactNode;
};

const variants: Record<CardVariant, string> = {
  light: "premium-card text-nahda-ink",
  dark: "border border-white/10 bg-white/[0.045] text-white shadow-[0_18px_44px_rgb(0_0_0_/_0.22)]",
  soft: "border border-border-soft bg-surface-muted text-nahda-ink",
};

export function Card({
  className,
  variant = "light",
  children,
  ...props
}: CardProps) {
  return (
    <div className={cn("rounded-card", variants[variant], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2 p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5 pt-0", className)} {...props}>
      {children}
    </div>
  );
}
