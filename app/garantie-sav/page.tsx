import type { Metadata } from "next";
import {
  ClipboardList,
  FileSearch,
  Headphones,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { CtaBand, InfoPage } from "@/components/content/info-page";
import { ShopLayout } from "@/components/layout/shop-layout";

export const metadata: Metadata = {
  title: "Garantie & SAV | Nahda Smart",
  description:
    "Procédure garantie et service après-vente Nahda Smart pour produits informatiques, réseaux, sécurité et télécommunication.",
};

export default function WarrantyPage() {
  return (
    <ShopLayout>
      <InfoPage
        eyebrow="Garantie & SAV"
        title="Un support clair pour diagnostiquer, traiter et suivre vos produits."
        description="Nahda Smart distingue garantie magasin et garantie fournisseur selon la référence, la facture, le numéro de série et les conditions du produit."
        actions={[
          { label: "Contacter le SAV", href: "/contact" },
          { label: "Demander un devis", href: "/demande-devis", variant: "outline" },
        ]}
        sections={[
          {
            title: "Produits concernés",
            items: [
              {
                title: "Garantie magasin",
                description:
                  "Applicable selon produit, état et conditions affichées lors de la commande.",
                icon: ShieldCheck,
              },
              {
                title: "Garantie fournisseur",
                description:
                  "Traitement avec la marque ou le fournisseur lorsque la référence le prévoit.",
                icon: PackageCheck,
              },
              {
                title: "Numéro de série",
                description:
                  "Certains produits nécessitent numéro de série, facture et accessoires fournis.",
                icon: FileSearch,
              },
            ],
          },
          {
            title: "Procédure SAV",
            items: [
              {
                title: "Signalement",
                description:
                  "Contactez l'équipe avec la référence, le problème constaté et la preuve d'achat.",
                icon: Headphones,
              },
              {
                title: "Diagnostic",
                description:
                  "Un premier diagnostic oriente vers test, retour atelier ou procédure fournisseur.",
                icon: ClipboardList,
              },
              {
                title: "Réparation ou échange",
                description:
                  "Selon cas, état du produit, disponibilité et conditions de garantie applicables.",
                icon: Wrench,
              },
              {
                title: "Suivi",
                description:
                  "Le client est informé de l'avancement et des décisions possibles.",
                icon: RefreshCw,
              },
            ],
          },
        ]}
      >
        <CtaBand
          title="Un produit à diagnostiquer ?"
          description="Préparez référence, facture, numéro de série et description du problème avant contact."
          primaryHref="/contact"
          primaryLabel="Contacter le SAV"
        />
      </InfoPage>
    </ShopLayout>
  );
}
