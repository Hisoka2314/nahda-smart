import type { Metadata } from "next";
import {
  ClipboardList,
  Database,
  FileText,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { CtaBand, InfoPage } from "@/components/content/info-page";
import { ShopLayout } from "@/components/layout/shop-layout";

export const metadata: Metadata = {
  title: "Politique confidentialité | Nahda Smart",
  description:
    "Politique de confidentialité Nahda Smart : données collectées, utilisation, stockage mock actuel et droits de contact.",
};

export default function PrivacyPage() {
  return (
    <ShopLayout>
      <InfoPage
        eyebrow="Confidentialité"
        title="Vos informations servent uniquement à traiter vos demandes Nahda Smart."
        description="Cette page explique simplement les données utilisées pour les commandes, devis, suivi client et SAV. En phase mock, les données restent côté navigateur avant connexion backend."
        actions={[
          { label: "Nous contacter", href: "/contact" },
          { label: "Voir les conditions", href: "/conditions-generales", variant: "outline" },
        ]}
        sections={[
          {
            title: "Données collectées",
            items: [
              {
                title: "Identité et contact",
                description:
                  "Nom complet, téléphone, email optionnel et type de client pour pouvoir vous contacter.",
                icon: UserRound,
              },
              {
                title: "Adresse et ville",
                description:
                  "Adresse utilisée seulement lorsque la livraison à domicile est demandée.",
                icon: ClipboardList,
              },
              {
                title: "Commandes et devis",
                description:
                  "Produits, quantités, total, statut, notes client et demandes techniques liées au devis.",
                icon: FileText,
              },
            ],
          },
          {
            title: "Utilisation",
            items: [
              {
                title: "Traitement commande",
                description:
                  "Préparer, confirmer et suivre votre commande avec paiement hors ligne.",
                icon: ShieldCheck,
              },
              {
                title: "Contact client",
                description:
                  "Vous joindre par téléphone, WhatsApp ou email pour confirmer les détails.",
                icon: Mail,
              },
              {
                title: "Devis et SAV",
                description:
                  "Analyser les besoins B2B, répondre aux demandes techniques et gérer les dossiers SAV.",
                icon: LockKeyhole,
              },
            ],
          },
          {
            title: "Engagements",
            items: [
              {
                title: "Pas de vente de données",
                description:
                  "Nahda Smart ne vend pas vos données personnelles à des tiers.",
                icon: ShieldCheck,
              },
              {
                title: "Stockage mock maintenant",
                description:
                  "Les commandes et devis mock sont stockés localement dans le navigateur avant la phase backend.",
                icon: Database,
              },
              {
                title: "Modification ou suppression",
                description:
                  "Vous pourrez demander la modification ou suppression de vos informations via la page contact.",
                icon: Mail,
              },
            ],
          },
        ]}
      >
        <CtaBand
          title="Besoin de modifier vos informations ?"
          description="Contactez Nahda Smart avec votre numéro de commande ou de devis afin que l’équipe puisse identifier la demande."
          primaryHref="/contact"
          primaryLabel="Contacter Nahda Smart"
          secondaryHref="/suivre-commande"
          secondaryLabel="Suivre une commande"
        />
      </InfoPage>
    </ShopLayout>
  );
}
