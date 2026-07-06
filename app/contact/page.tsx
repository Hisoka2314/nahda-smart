import type { Metadata } from "next";
import {
  Clock,
  Headphones,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { ContactForm } from "@/components/content/contact-form";
import { InfoCardBlock, InfoHero, WhatsappLink } from "@/components/content/info-page";
import { ShopLayout } from "@/components/layout/shop-layout";
import { Container } from "@/components/ui/container";
import { getSiteSettings, toWhatsappDigits } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Contact | Nahda Smart",
  description:
    "Contactez Nahda Smart pour conseil technique, commande, devis, SAV ou disponibilité produit.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const whatsappUrl = `https://wa.me/${toWhatsappDigits(settings.whatsapp)}?text=${encodeURIComponent(
    "Bonjour Nahda Smart, j'ai besoin d'un conseil technique.",
  )}`;

  return (
    <ShopLayout>
      <Container className="py-8 md:py-12">
        <InfoHero
          eyebrow="Contact & conseil"
          title="Besoin d'un conseil technique ou d'une disponibilité produit ?"
          description="L'équipe Nahda Smart vous accompagne pour choisir le bon matériel, préparer une commande ou cadrer une demande de devis."
          actions={[
            { label: "Suivre ma commande", href: "/suivre-commande" },
            { label: "Demander un devis", href: "/demande-devis", variant: "outline" },
          ]}
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <ContactForm />
          <aside className="grid gap-4 lg:self-start">
            <InfoCardBlock
              item={{
                title: "Téléphone",
                description: settings.phone,
                icon: Phone,
              }}
            />
            <InfoCardBlock
              item={{
                title: "Email",
                description: settings.email,
                icon: Mail,
              }}
            />
            <InfoCardBlock
              item={{
                title: "Adresse magasin",
                description: [settings.addressPrimary, settings.addressSecondary]
                  .filter(Boolean)
                  .join(" · "),
                icon: MapPin,
              }}
            />
            <InfoCardBlock
              item={{
                title: "Horaires",
                description: settings.openingHours,
                icon: Clock,
              }}
            />
            <div className="rounded-card border border-nahda-olive/[0.24] bg-nahda-olive-soft p-5 shadow-card">
              <span className="grid h-11 w-11 place-items-center rounded-[11px] bg-white text-nahda-olive">
                <Headphones size={21} />
              </span>
              <h2 className="mt-4 text-lg font-black text-nahda-ink">
                Besoin d&apos;un conseil technique ?
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-neutral-700">
                Décrivez votre contexte : nombre d&apos;utilisateurs, budget, usage,
                site à équiper ou contraintes réseau.
              </p>
              <div className="mt-4">
                <WhatsappLink href={whatsappUrl} label="Écrire sur WhatsApp" />
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </ShopLayout>
  );
}
