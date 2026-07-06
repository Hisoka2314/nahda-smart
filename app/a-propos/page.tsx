import type { Metadata } from "next";
import {
  BadgeCheck,
  Building2,
  Headphones,
  Network,
  ShieldCheck,
  Store,
  UsersRound,
} from "lucide-react";
import { CtaBand, InfoPage } from "@/components/content/info-page";
import { ShopLayout } from "@/components/layout/shop-layout";

export const metadata: Metadata = {
  title: "À propos | Nahda Smart",
  description:
    "Découvrez Nahda Smart, partenaire tech au Maroc pour informatique, réseaux, sécurité et télécommunication.",
};

export default function AboutPage() {
  return (
    <ShopLayout>
      <InfoPage
        eyebrow="Votre partenaire tech au Maroc"
        title="Nahda Smart accompagne les particuliers et les professionnels avec des solutions fiables."
        description="Spécialiste en matériel informatique, réseaux, sécurité et télécommunication, Nahda Smart sert le marché marocain avec une approche conseil, proximité et service technique."
        actions={[
          { label: "Voir les produits", href: "/catalogue" },
          { label: "Demander un devis", href: "/demande-devis", variant: "outline" },
          { label: "Nous contacter", href: "/contact", variant: "outline" },
        ]}
        sections={[
          {
            title: "Ce que nous faisons",
            description:
              "Une sélection orientée usage réel : poste de travail, infrastructure réseau, sécurité, impression et support.",
            items: [
              {
                title: "Informatique",
                description:
                  "PC portables, PC bureau, All-in-One, stockage, accessoires et périphériques.",
                icon: Building2,
              },
              {
                title: "Réseaux & télécommunication",
                description:
                  "Routeurs, switchs, câblage, baies réseau, téléphones IP et solutions connectées.",
                icon: Network,
              },
              {
                title: "Sécurité & caméras",
                description:
                  "Caméras IP, NVR, interphones et équipements adaptés aux maisons, bureaux et sites pro.",
                icon: ShieldCheck,
              },
            ],
          },
          {
            title: "Nos valeurs",
            items: [
              {
                title: "Fiabilité",
                description:
                  "Des produits sélectionnés pour leur usage quotidien et leur disponibilité vérifiable.",
                icon: BadgeCheck,
              },
              {
                title: "Conseil",
                description:
                  "Une équipe capable d'aider à choisir selon budget, contexte technique et besoin métier.",
                icon: Headphones,
              },
              {
                title: "Proximité",
                description:
                  "Un parcours pensé pour le Maroc : livraison, retrait, devis B2B et confirmation humaine.",
                icon: Store,
              },
              {
                title: "Service technique",
                description:
                  "SAV, diagnostic et accompagnement pour particuliers, sociétés, écoles et administrations.",
                icon: UsersRound,
              },
            ],
          },
        ]}
      >
        <CtaBand
          title="Un projet informatique ou réseau à préparer ?"
          description="Envoyez une demande de devis ou contactez-nous pour cadrer le besoin avant achat."
        />
      </InfoPage>
    </ShopLayout>
  );
}
