import type { Metadata } from "next";
import {
  Banknote,
  ClipboardCheck,
  Headphones,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { CtaBand, InfoPage } from "@/components/content/info-page";
import { ShopLayout } from "@/components/layout/shop-layout";

export const metadata: Metadata = {
  title: "Conditions générales | Nahda Smart",
  description:
    "Conditions générales Nahda Smart pour commandes, prix, disponibilité, livraison, paiement hors ligne, retours et garantie.",
};

export default function TermsPage() {
  return (
    <ShopLayout>
      <InfoPage
        eyebrow="Cadre de vente"
        title="Des conditions claires pour acheter sereinement chez Nahda Smart."
        description="Ces conditions présentent le fonctionnement général des commandes Nahda Smart au lancement : confirmation humaine, disponibilité vérifiée, livraison ou retrait, paiement à la livraison ou sur place."
        actions={[
          { label: "Nous contacter", href: "/contact" },
          { label: "Suivre ma commande", href: "/suivre-commande", variant: "outline" },
        ]}
        sections={[
          {
            title: "Commandes, prix et disponibilité",
            description:
              "Les informations affichées servent à préparer la commande. La validation finale se fait après contact par notre équipe.",
            items: [
              {
                title: "Confirmation commande",
                description:
                  "Toute commande démarre avec le statut En attente de confirmation. Nahda Smart contacte le client avant traitement.",
                icon: ClipboardCheck,
              },
              {
                title: "Prix en DH",
                description:
                  "Les prix sont affichés en dirhams marocains. Ils peuvent être confirmés selon stock, devis B2B ou configuration demandée.",
                icon: Banknote,
              },
              {
                title: "Disponibilité",
                description:
                  "Le stock affiché est indicatif en phase mock. La disponibilité finale est confirmée avant livraison ou retrait.",
                icon: PackageCheck,
              },
            ],
          },
          {
            title: "Livraison, paiement et retours",
            items: [
              {
                title: "Livraison",
                description:
                  "Livraison à domicile selon ville, volume, délai et confirmation de disponibilité.",
                icon: Truck,
              },
              {
                title: "Paiement hors ligne",
                description:
                  "Au lancement, seuls le paiement à la livraison et le paiement sur place sont actifs.",
                icon: Banknote,
              },
              {
                title: "Retours",
                description:
                  "Les retours sont étudiés selon état du produit, emballage, délai, accessoires et accord préalable.",
                icon: RotateCcw,
              },
            ],
          },
          {
            title: "Garantie, responsabilité et contact",
            items: [
              {
                title: "Garantie",
                description:
                  "La garantie peut dépendre du produit, du fournisseur, de la facture et du numéro de série.",
                icon: ShieldCheck,
              },
              {
                title: "Limitation raisonnable",
                description:
                  "Nahda Smart accompagne le client dans la limite des informations produit, garanties applicables et conditions fournisseur.",
                icon: Headphones,
              },
              {
                title: "Assistance",
                description:
                  "Pour toute question sur commande, livraison, retour ou SAV, contactez notre équipe avant toute démarche.",
                icon: Headphones,
              },
            ],
          },
        ]}
      >
        <CtaBand
          title="Une question avant de commander ?"
          description="Notre équipe peut vérifier le stock, confirmer les frais de livraison ou préparer une demande de devis B2B."
          primaryHref="/contact"
          primaryLabel="Contacter l’équipe"
          secondaryHref="/demande-devis"
          secondaryLabel="Demander un devis"
        />
      </InfoPage>
    </ShopLayout>
  );
}
