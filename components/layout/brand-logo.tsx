import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  showTagline?: boolean;
  size?: "desktop" | "mobile" | "footer" | "admin";
  tone?: "dark" | "light";
};

const sizeStyles = {
  desktop: {
    mark: "h-[54px] w-[74px]",
    name: "text-[25px]",
    tagline: "text-[10px]",
    gap: "gap-3",
  },
  mobile: {
    mark: "h-9 w-11",
    name: "text-[14px]",
    tagline: "text-[9px]",
    gap: "gap-2",
  },
  footer: {
    mark: "h-12 w-16",
    name: "text-[22px]",
    tagline: "text-[10px]",
    gap: "gap-3",
  },
  admin: {
    mark: "h-11 w-[58px]",
    name: "text-[19px]",
    tagline: "text-[9px]",
    gap: "gap-2",
  },
};

export function BrandLogo({
  className,
  priority = false,
  showTagline = true,
  size = "desktop",
  tone = "dark",
}: BrandLogoProps) {
  const styles = sizeStyles[size];
  const isLight = tone === "light";

  return (
    <Link
      href="/"
      aria-label="Nahda Smart - accueil"
      className={cn(
        "inline-flex min-w-0 items-center",
        styles.gap,
        className,
      )}
    >
      <span className={cn("relative shrink-0", styles.mark)}>
        <Image
          src="/brand/logo-nahda-smart-mark.png"
          alt=""
          fill
          priority={priority}
          sizes="80px"
          className="object-contain"
        />
      </span>
      <span className="min-w-0 leading-none">
        <span
          className={cn(
            "block whitespace-nowrap font-black",
            styles.name,
            isLight ? "text-white" : "text-nahda-ink",
          )}
        >
          Nahda <span className="text-nahda-olive">Smart</span>
        </span>
        {showTagline ? (
          <span
            className={cn(
              "mt-1 block whitespace-nowrap font-semibold",
              styles.tagline,
              isLight ? "text-white/[0.72]" : "text-neutral-500",
            )}
          >
            Votre partenaire tech au Maroc
          </span>
        ) : null}
      </span>
    </Link>
  );
}
