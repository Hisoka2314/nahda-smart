import Link from "next/link";
import {
  CircleHelp,
  MapPin,
  PackageCheck,
  Search,
  ShieldCheck,
  Store,
  Truck,
  Grid2X2,
} from "lucide-react";
import { CartHeaderAction } from "@/components/cart/cart-header-action";
import { BrandLogo } from "@/components/layout/brand-logo";
import { MobileHeader } from "@/components/layout/mobile-header";
import { CollectionHeaderActions } from "@/components/shop/collection-header-actions";
import { Container } from "@/components/ui/container";
import { mainNavigation, topBarLinks } from "@/data/navigation";
import { getSiteSettings } from "@/lib/settings";

const topIcons = [
  Truck,
  PackageCheck,
  Store,
  ShieldCheck,
  CircleHelp,
  MapPin,
  PackageCheck,
];

export async function SiteHeader() {
  const settings = await getSiteSettings();
  // Le numero d'aide vient des parametres du site, pas du fichier statique.
  const resolvedTopBarLinks = topBarLinks.map((item) =>
    item.label.startsWith("Besoin d'aide")
      ? { ...item, label: `Besoin d'aide ? ${settings.phone}` }
      : item,
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-white/[0.96] shadow-[0_6px_28px_rgb(20_31_8_/_0.06)] backdrop-blur">
      <div className="hidden bg-nahda-olive-dark text-[12px] font-bold text-white lg:block">
        <Container className="flex h-8 items-center justify-between gap-8">
          <div className="flex min-w-0 items-center gap-5">
            {resolvedTopBarLinks.slice(0, 4).map((item, index) => {
              const Icon = topIcons[index];

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="inline-flex items-center gap-1.5 transition hover:text-white/80"
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="flex shrink-0 items-center gap-5">
            {resolvedTopBarLinks.slice(4).map((item, index) => {
              const Icon = topIcons[index + 4];

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="inline-flex items-center gap-1.5 transition hover:text-white/80"
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </Container>
      </div>

      <Container className="hidden h-[88px] items-center gap-6 lg:flex">
        <BrandLogo className="w-[244px] shrink-0" priority />
        <form
          action="/recherche"
          method="get"
          className="flex h-[52px] flex-1 overflow-hidden rounded-control border border-border-soft bg-white shadow-sm transition focus-within:border-nahda-olive/[0.55] focus-within:shadow-premium"
        >
          <input
            name="q"
            aria-label="Rechercher un produit"
            className="min-w-0 flex-1 px-5 text-sm outline-none placeholder:text-neutral-400"
            placeholder="Rechercher un produit, une marque..."
          />
          <button
            type="submit"
            className="grid w-[60px] place-items-center bg-nahda-olive text-white transition hover:bg-nahda-olive-dark"
            aria-label="Lancer la recherche"
          >
            <Search size={19} />
          </button>
        </form>
        <div className="flex items-center gap-2">
          <CollectionHeaderActions />
          <CartHeaderAction />
        </div>
      </Container>

      <Container className="hidden h-12 items-center gap-5 border-t border-border-soft lg:flex">
        <Link
          href="/catalogue"
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[8px] border border-border-soft bg-white px-4 text-sm font-black text-nahda-ink transition hover:border-nahda-olive/45 hover:bg-nahda-olive-soft hover:text-nahda-olive-dark"
        >
          <Grid2X2 size={16} className="text-nahda-olive" />
          Catalogue
        </Link>
        {/* La barre defile quand les rayons ne tiennent pas : sans cela, en
            ajouter un poussait les derniers hors de l'ecran, sans moyen de les
            atteindre. Elle reste centree tant qu'il y a la place. */}
        <nav className="hide-scrollbar flex min-w-0 flex-1 items-center justify-start gap-5 overflow-x-auto text-sm font-bold text-neutral-700 xl:justify-center xl:gap-6">
          {mainNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.highlight
                  ? "shrink-0 whitespace-nowrap text-nahda-orange"
                  : "shrink-0 whitespace-nowrap transition hover:text-nahda-olive"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>

      <MobileHeader />
    </header>
  );
}
