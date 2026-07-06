"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  BadgePercent,
  Cable,
  FileText,
  Gamepad2,
  Grid2X2,
  Headphones,
  Heart,
  Home,
  Laptop,
  Menu,
  MessageCircle,
  Network,
  Phone,
  Printer,
  Search,
  ShieldCheck,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { CartHeaderAction } from "@/components/cart/cart-header-action";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";

const mobileMenuItems: Array<{
  label: string;
  href: string;
  icon: LucideIcon;
  highlight?: boolean;
}> = [
  { label: "Accueil Nahda Smart", href: "/", icon: Home },
  { label: "Catalogue", href: "/catalogue", icon: Grid2X2 },
  {
    label: "Ordinateurs",
    href: "/catalogue?category=pc-portables,pc-bureau,all-in-one",
    icon: Laptop,
  },
  {
    label: "Réseaux & Connectivité",
    href: "/categorie/reseaux-connectivite",
    icon: Network,
  },
  { label: "Impression", href: "/categorie/impression", icon: Printer },
  {
    label: "Sécurité & Caméras",
    href: "/categorie/securite-cameras",
    icon: ShieldCheck,
  },
  { label: "Accessoires", href: "/categorie/accessoires", icon: Cable },
  { label: "Téléphonie", href: "/categorie/telephonie", icon: Phone },
  { label: "Gaming", href: "/catalogue?usage=gaming", icon: Gamepad2 },
  {
    label: "Promotions",
    href: "/catalogue?promo=1",
    icon: BadgePercent,
    highlight: true,
  },
  { label: "Devis", href: "/demande-devis", icon: FileText },
  { label: "Contact", href: "/contact", icon: MessageCircle },
];

const secondaryActions = [
  { label: "Favoris", href: "/favoris", icon: Heart },
  { label: "Comparateur", href: "/comparateur", icon: ArrowLeftRight },
  { label: "Panier", href: "/panier", icon: ShoppingCart },
];

export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-nahda-ink text-white lg:hidden">
      <div className="grid h-[72px] grid-cols-[40px_minmax(0,1fr)_76px] items-center gap-2 px-3">
        <Button
          variant="lightOutline"
          size="icon"
          className="h-10 w-10"
          aria-label="Ouvrir le menu"
          onClick={() => setOpen(true)}
        >
          <Menu size={22} />
        </Button>
        <BrandLogo
          className="w-[140px] max-w-full justify-self-center overflow-hidden"
          priority
          showTagline={false}
          size="mobile"
          tone="light"
        />
        <div className="flex shrink-0 justify-end gap-1">
          <Link
            href="/favoris"
            aria-label="Favoris"
            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-control border border-white/40 bg-white/[0.06] text-white backdrop-blur transition hover:bg-white/[0.14]"
          >
            <Heart size={21} />
          </Link>
          <CartHeaderAction compact tone="light" />
        </div>
      </div>
      <div className="px-3 pb-4">
        <form
          action="/recherche"
          method="get"
          className="flex h-12 w-full max-w-full overflow-hidden rounded-control bg-white text-nahda-ink"
        >
          <input
            name="q"
            aria-label="Rechercher"
            className="w-0 min-w-0 flex-1 px-4 text-sm outline-none"
            placeholder="Rechercher un produit..."
          />
          <button
            type="submit"
            className="grid w-11 shrink-0 place-items-center bg-nahda-olive text-white"
            aria-label="Rechercher"
          >
            <Search size={20} />
          </button>
        </form>
      </div>

      <Drawer open={open} title="Menu boutique" onClose={() => setOpen(false)}>
        <div className="rounded-card bg-nahda-ink p-4 text-white shadow-premium">
          <BrandLogo
            className="max-w-full"
            showTagline
            size="mobile"
            tone="light"
          />
          <p className="mt-3 text-sm leading-6 text-white/[0.72]">
            Matériel informatique, réseaux, sécurité et télécommunication au
            Maroc.
          </p>
        </div>

        <form
          action="/recherche"
          method="get"
          onSubmit={() => setOpen(false)}
          className="mt-4 flex h-12 overflow-hidden rounded-control border border-border-soft bg-white text-nahda-ink shadow-sm"
        >
          <input
            name="q"
            aria-label="Rechercher dans le menu"
            className="min-w-0 flex-1 px-4 text-sm outline-none placeholder:text-neutral-400"
            placeholder="Rechercher un produit..."
          />
          <button
            type="submit"
            className="grid w-12 shrink-0 place-items-center bg-nahda-olive text-white"
            aria-label="Rechercher"
          >
            <Search size={19} />
          </button>
        </form>

        <nav className="mt-5 grid gap-2" aria-label="Navigation mobile">
          {mobileMenuItems.map((item) => (
            <MobileMenuLink
              key={item.href}
              href={item.href}
              highlight={item.highlight}
              icon={item.icon}
              label={item.label}
              onClick={() => setOpen(false)}
            />
          ))}
        </nav>

        <div className="mt-6 grid grid-cols-3 gap-2.5">
          {secondaryActions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="focus-ring inline-flex h-11 min-w-0 items-center justify-start gap-2 rounded-control border border-border-soft bg-white px-3 text-sm font-bold text-nahda-ink transition hover:border-nahda-olive/[0.4] hover:bg-nahda-olive-soft"
              style={{ color: "var(--nahda-ink)" }}
              onClick={() => setOpen(false)}
            >
              <item.icon size={16} className="shrink-0 text-nahda-olive" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="mt-6 rounded-card border border-nahda-olive/[0.2] bg-nahda-olive-soft p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-white text-nahda-olive">
              <Headphones size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black text-nahda-olive-dark">
                Besoin d&apos;un conseil ?
              </p>
              <p className="mt-1 text-sm leading-6 text-neutral-700">
                Notre équipe vous aide à choisir le bon matériel.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/contact"
                  className="rounded-[8px] bg-white px-3 py-2 text-xs font-black text-nahda-olive-dark shadow-sm transition hover:bg-nahda-olive hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  Nous contacter
                </Link>
                <Link
                  href="/demande-devis"
                  className="rounded-[8px] border border-nahda-olive/[0.35] px-3 py-2 text-xs font-black text-nahda-olive-dark transition hover:bg-white"
                  onClick={() => setOpen(false)}
                >
                  Demander un devis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

type MobileMenuLinkProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  highlight?: boolean;
  onClick: () => void;
};

function MobileMenuLink({
  href,
  icon: Icon,
  label,
  highlight,
  onClick,
}: MobileMenuLinkProps) {
  const color = highlight ? "var(--nahda-orange)" : "var(--nahda-ink)";

  return (
    <Link
      href={href}
      className={`flex min-h-12 min-w-0 items-center gap-3 rounded-control border px-3.5 py-3 text-sm font-black shadow-sm transition ${
        highlight
          ? "border-orange-200 bg-[#fff4ea] text-nahda-orange hover:border-orange-300 hover:bg-[#ffe9d6]"
          : "border-border-soft bg-white text-nahda-ink hover:border-nahda-olive/[0.35] hover:bg-nahda-olive-soft hover:text-nahda-olive-dark"
      }`}
      style={{ color }}
      onClick={onClick}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-[9px] ${
          highlight
            ? "bg-white text-nahda-orange"
            : "bg-nahda-olive-soft text-nahda-olive"
        }`}
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0 break-words leading-snug" style={{ color }}>
        {label}
      </span>
    </Link>
  );
}
