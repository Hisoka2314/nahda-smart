import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  AppWindow,
  Cable,
  Headphones,
  HardDrive,
  Keyboard,
  Laptop,
  Monitor,
  Network,
  Phone,
  Printer,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { ProductCategory, ProductCategoryIconKey } from "@/types/product";

type CategoryCardProps = {
  category: ProductCategory;
};

const categoryIcons: Record<ProductCategoryIconKey, LucideIcon> = {
  laptops: Laptop,
  desktops: Monitor,
  allInOne: Monitor,
  software: AppWindow,
  printing: Printer,
  network: Network,
  multimedia: Headphones,
  peripherals: Keyboard,
  security: ShieldCheck,
  accessories: Cable,
  telephony: Phone,
  storage: HardDrive,
};

export function CategoryCard({ category }: CategoryCardProps) {
  const Icon = categoryIcons[category.iconKey];

  return (
    <Link
      href={`/categorie/${category.slug}`}
      className="premium-card group relative block h-full overflow-hidden p-3 transition duration-300 hover:-translate-y-1 hover:border-nahda-olive/[0.45] hover:shadow-premium"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] border border-border-soft bg-[#f7f9f4]">
        <Image
          src={category.image}
          alt={category.name}
          fill
          sizes="(max-width: 768px) 82vw, (max-width: 1280px) 34vw, 280px"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,6,0)_48%,rgba(5,7,6,0.34)_100%)] opacity-0 transition group-hover:opacity-100" />
        <span className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-[10px] border border-white/[0.72] bg-white/[0.88] text-nahda-olive shadow-[0_12px_26px_rgb(15_24_12_/_0.14)] backdrop-blur">
          <Icon size={20} strokeWidth={2.2} />
        </span>
        <span className="absolute bottom-3 right-3 rounded-[9px] border border-white/[0.65] bg-white/[0.9] px-2.5 py-1 text-[11px] font-black uppercase text-nahda-olive shadow-[0_10px_22px_rgb(15_24_12_/_0.12)] backdrop-blur">
          {category.productCount} produits
        </span>
      </div>

      <div className="p-2.5 pb-3">
        <h3 className="mt-1 text-base font-black leading-6 text-nahda-ink">
          {category.name}
        </h3>
        <p className="mt-1 min-h-[44px] text-sm leading-5 text-neutral-600">
          {category.description}
        </p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-nahda-olive">
          {category.cta ?? "Voir tout"}
          <ArrowRight
            size={15}
            className="transition group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
