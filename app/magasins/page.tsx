import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  Store,
} from "lucide-react";
import { InfoHero, WhatsappLink } from "@/components/content/info-page";
import { ShopLayout } from "@/components/layout/shop-layout";
import { Container } from "@/components/ui/container";
import { buildMapsUrl, getSiteSettings, toWhatsappDigits } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Magasins | Nahda Smart",
  description:
    "Magasins et dépôts Nahda Smart : retrait sur place, disponibilité, horaires et contact WhatsApp.",
};

export default async function StoresPage() {
  const settings = await getSiteSettings();
  const whatsappDigits = toWhatsappDigits(settings.whatsapp);
  const mapsUrl = buildMapsUrl(settings);
  const whatsappUrl = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
    "Bonjour Nahda Smart, je souhaite vérifier le retrait au magasin.",
  )}`;

  return (
    <ShopLayout>
      <Container className="py-8 md:py-12">
        <InfoHero
          eyebrow="Magasin & retrait"
          title="Retirez vos commandes après confirmation par l’équipe Nahda Smart."
          description="Le retrait sur place est confirmé par téléphone ou WhatsApp avant déplacement."
          actions={[
            { label: "Suivre ma commande", href: "/suivre-commande" },
            { label: "Nous contacter", href: "/contact", variant: "outline" },
          ]}
        />

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <article className="rounded-card border border-border-soft bg-white p-5 shadow-premium md:p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-nahda-olive-soft text-nahda-olive">
                <Store size={23} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase text-nahda-olive">
                  Notre magasin
                </p>
                <h2 className="mt-1 text-2xl font-black text-nahda-ink">
                  {settings.companyName}
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-neutral-600">
                  Retrait sur place disponible après confirmation
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-sm font-semibold text-neutral-700">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex gap-2 transition hover:text-nahda-olive"
                title="Ouvrir dans Google Maps"
              >
                <MapPin size={17} className="mt-0.5 shrink-0 text-nahda-olive" />
                {settings.addressPrimary}
              </a>
              <span className="inline-flex gap-2">
                <Clock size={17} className="mt-0.5 shrink-0 text-nahda-olive" />
                {settings.openingHours}
              </span>
              <a
                href={`tel:${settings.phone.replace(/\s+/g, "")}`}
                className="inline-flex gap-2 transition hover:text-nahda-olive"
              >
                <Phone size={17} className="mt-0.5 shrink-0 text-nahda-olive" />
                {settings.phone}
              </a>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-control border border-border-soft bg-white px-4 text-sm font-black text-nahda-ink transition hover:border-nahda-olive/[0.45] hover:bg-surface-muted"
              >
                <ExternalLink size={17} />
                Itinéraire
              </a>
              <WhatsappLink href={whatsappUrl} label="Vérifier par WhatsApp" />
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-card border border-nahda-olive/[0.24] bg-nahda-olive-soft p-5 shadow-card md:flex md:items-center md:justify-between md:gap-6 md:p-6">
          <div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-[11px] bg-white text-nahda-olive">
              <PackageCheck size={21} />
            </div>
            <h2 className="mt-4 text-xl font-black text-nahda-ink">
              Vérifiez toujours la disponibilité avant déplacement.
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-neutral-700">
              Les produits sont préparés après confirmation. Notre équipe peut
              vérifier le stock, réserver un article et confirmer l’heure de retrait.
            </p>
          </div>
          <Link
            href="/contact"
            className="focus-ring mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-control bg-nahda-olive px-4 text-sm font-black text-white transition hover:bg-nahda-olive-dark md:mt-0"
          >
            <MessageCircle size={17} />
            Contacter le magasin
          </Link>
        </section>
      </Container>
    </ShopLayout>
  );
}
