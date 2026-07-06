import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Container } from "@/components/ui/container";
import { FacebookIcon, InstagramIcon } from "@/components/ui/social-icons";
import { buildMapsUrl, getSiteSettings, toWhatsappDigits } from "@/lib/settings";

const footerColumns = [
  {
    title: "Catégories",
    links: [
      {
        label: "Ordinateurs",
        href: "/catalogue?category=pc-portables,pc-bureau,all-in-one",
      },
      { label: "Réseaux", href: "/categorie/reseaux-connectivite" },
      { label: "Impression", href: "/categorie/impression" },
      { label: "Sécurité", href: "/categorie/securite-cameras" },
      { label: "Accessoires", href: "/categorie/accessoires" },
      { label: "Gaming", href: "/catalogue?usage=gaming" },
    ],
  },
  {
    title: "Infos pratiques",
    links: [
      { label: "À propos de nous", href: "/a-propos" },
      { label: "Conditions Générales de Vente", href: "/conditions-generales" },
      { label: "Livraison & Retours", href: "/livraison-retour" },
      { label: "Politique confidentialité", href: "/politique-confidentialite" },
    ],
  },
  {
    title: "Service client",
    links: [
      { label: "Suivre ma commande", href: "/suivre-commande" },
      { label: "Demander un devis", href: "/demande-devis" },
      { label: "Garantie & SAV", href: "/garantie-sav" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export async function SiteFooter() {
  const settings = await getSiteSettings();
  const mapsUrl = buildMapsUrl(settings);
  const socialItems = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/${toWhatsappDigits(settings.whatsapp)}`,
    },
    settings.facebookUrl
      ? { label: "Facebook", icon: FacebookIcon, href: settings.facebookUrl }
      : null,
    settings.instagramUrl
      ? { label: "Instagram", icon: InstagramIcon, href: settings.instagramUrl }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <footer className="bg-nahda-ink text-white">
      <Container className="grid gap-10 py-12 lg:grid-cols-[1.15fr_1.55fr_1fr_1fr]">
        <div>
          <BrandLogo size="footer" tone="light" />
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/[0.62]">
            Votre partenaire tech au Maroc. Solutions en informatique, réseaux,
            sécurité et télécommunication pour particuliers et professionnels.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-black uppercase text-[#a8c84c]">
                {column.title}
              </h2>
              <nav className="mt-4 grid gap-2 text-sm text-white/[0.68]">
                {column.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-sm font-black uppercase text-[#a8c84c]">
            Nos magasins
          </h2>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-white/[0.68]">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex gap-2 transition hover:text-white"
              title="Ouvrir dans Google Maps"
            >
              <MapPin size={16} className="mt-1 shrink-0" />
              {settings.addressPrimary}
            </a>
            {settings.addressSecondary ? (
              <span className="inline-flex gap-2">
                <MapPin size={16} className="mt-1 shrink-0" />
                {settings.addressSecondary}
              </span>
            ) : null}
            <a
              href={`tel:${settings.phone.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-2 transition hover:text-white"
            >
              <Phone size={16} />
              {settings.phone}
            </a>
            <a
              href={`mailto:${settings.email}`}
              className="inline-flex items-center gap-2 transition hover:text-white"
            >
              <Mail size={16} />
              {settings.email}
            </a>
            <Link
              href="/magasins"
              className="mt-1 inline-flex w-fit items-center font-black text-[#a8c84c] transition hover:text-white"
            >
              Voir les magasins
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase text-[#a8c84c]">
            Suivez-nous
          </h2>
          <div className="mt-4 flex gap-2">
            {socialItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring grid h-10 w-10 place-items-center rounded-full border border-white/[0.15] text-white/[0.75] transition hover:border-[#a8c84c] hover:text-[#a8c84c]"
                aria-label={item.label}
                title={item.label}
              >
                <item.icon size={18} />
              </a>
            ))}
          </div>
          <h3 className="mt-7 text-sm font-black uppercase text-[#a8c84c]">
            Paiement
          </h3>
          <div className="mt-3 grid gap-2 text-sm text-white/[0.68]">
            <span>Paiement à la livraison</span>
            <span>Paiement sur place</span>
          </div>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-4 text-xs text-white/[0.45] md:flex-row md:items-center md:justify-between">
          <span>© 2026 Nahda Smart. Tous droits réservés.</span>
          <span>Les paiements en ligne ne sont pas actifs au lancement.</span>
        </Container>
      </div>
    </footer>
  );
}
