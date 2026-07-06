import type { Metadata } from "next";
import {
  Banknote,
  ClipboardCheck,
  MapPin,
  PackageCheck,
  RotateCcw,
  Store,
  Truck,
} from "lucide-react";
import { CtaBand, InfoPage } from "@/components/content/info-page";
import { ShopLayout } from "@/components/layout/shop-layout";

export const metadata: Metadata = {
  title: "Livraison & retour | Nahda Smart",
  description:
    "Informations livraison partout au Maroc, retrait sur place, contrôle du colis et conditions de retour Nahda Smart.",
};

export default function DeliveryReturnPage() {
  return (
    <ShopLayout>
      <InfoPage
        eyebrow="Livraison & retrait"
        title="Un parcours simple : livraison au Maroc ou retrait sur place après confirmation."
        description="Chaque commande est vérifiée par l'équipe Nahda Smart avant expédition ou retrait. Les frais et délais sont confirmés selon la ville, le volume et la disponibilité."
        actions={[
          { label: "Suivre ma commande", href: "/suivre-commande" },
          { label: "Voir les magasins", href: "/magasins", variant: "outline" },
        ]}
        sections={[
          {
            title: "Méthodes disponibles",
            items: [
              {
                title: "Livraison partout au Maroc",
                description:
                  "Livraison à domicile selon ville et disponibilité. Les délais restent indicatifs au lancement.",
                icon: Truck,
              },
              {
                title: "Retrait sur place",
                description:
                  "Retrait en magasin après confirmation de stock et préparation de commande.",
                icon: Store,
              },
              {
                title: "Frais selon commande",
                description:
                  "Les frais dépendent de la ville, du poids, du volume et du mode choisi.",
                icon: MapPin,
              },
            ],
          },
          {
            title: "Réception et retours",
            items: [
              {
                title: "Contrôle du colis",
                description:
                  "Vérifiez l'état du colis à la réception et signalez toute anomalie rapidement.",
                icon: ClipboardCheck,
              },
              {
                title: "Retours sous conditions",
                description:
                  "Les retours dépendent de l'état du produit, emballage, délai et accord préalable.",
                icon: RotateCcw,
              },
              {
                title: "Commande confirmée humainement",
                description:
                  "Toute commande démarre en attente de confirmation avant traitement.",
                icon: PackageCheck,
              },
              {
                title: "Paiement hors ligne",
                description:
                  "Paiement à la livraison ou paiement sur place uniquement au lancement.",
                icon: Banknote,
              },
            ],
          },
        ]}
      >
        <CtaBand
          title="Vous voulez vérifier une commande ?"
          description="Utilisez le suivi commande mock ou contactez notre équipe si vous avez besoin d'un conseil."
          primaryHref="/suivre-commande"
          primaryLabel="Suivre ma commande"
          secondaryHref="/contact"
          secondaryLabel="Contacter l'équipe"
        />
      </InfoPage>
    </ShopLayout>
  );
}
