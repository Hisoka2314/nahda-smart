import Image from "next/image";
import { cn } from "@/lib/utils";
import type { BrandAsset } from "@/data/brands";

type BrandMarkProps = {
  brand: Pick<
    BrandAsset,
    "name" | "slug" | "logoPath" | "fallbackLabel" | "isOfficialAsset"
  >;
  compact?: boolean;
  className?: string;
};

export function BrandMark({ brand, compact = false, className }: BrandMarkProps) {
  if (brand.logoPath && brand.isOfficialAsset) {
    return (
      <span
        className={cn(
          "relative block",
          compact ? "h-6 w-20" : "h-9 w-full max-w-[130px]",
          className,
        )}
      >
        <Image
          src={brand.logoPath}
          alt={`Logo ${brand.name}`}
          fill
          sizes={compact ? "80px" : "130px"}
          className="object-contain"
        />
      </span>
    );
  }

  const initials = brand.fallbackLabel
    .split(/[\s-]+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[10px] border border-nahda-olive/[0.22] bg-white/[0.92] text-nahda-ink shadow-[0_10px_24px_rgb(15_24_12_/_0.08)]",
        compact ? "h-9 px-2.5 text-[11px]" : "min-h-[52px] px-3 text-sm",
        className,
      )}
      aria-label={`${brand.name} - logo à ajouter`}
      title={`${brand.name} - logo officiel à ajouter`}
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-[8px] bg-nahda-olive-soft font-black text-nahda-olive-dark",
          compact ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs",
        )}
      >
        {initials}
      </span>
      <span className="truncate font-black tracking-normal">
        {brand.fallbackLabel}
      </span>
    </span>
  );
}
