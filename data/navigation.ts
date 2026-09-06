// Rayons de la barre de navigation.
//
// L'ordre suit ce qu'un client cherche en premier, pas le nombre de
// references. La barre defile horizontalement quand elle ne tient pas :
// mieux vaut un rayon accessible en glissant qu'un rayon absent.
//
// Un rayon absent d'ici reste atteignable par le bouton "Catalogue", qui
// liste toutes les categories.
export const mainNavigation = [
  {
    label: "Ordinateurs",
    href: "/catalogue?category=pc-portables,pc-bureau,all-in-one",
  },
  {
    label: "Composants",
    href: "/catalogue?category=composants-pc,stockage",
  },
  { label: "Périphériques", href: "/categorie/peripheriques" },
  { label: "Impression", href: "/categorie/impression" },
  {
    label: "Réseaux",
    href: "/catalogue?category=reseaux-connectivite,baies-reseau-cablage",
  },
  { label: "Sécurité", href: "/categorie/securite-cameras" },
  { label: "Multimédia", href: "/categorie/multimedia" },
  { label: "Téléphonie", href: "/categorie/telephonie" },
  { label: "Logiciels", href: "/categorie/logiciels" },
  {
    label: "Accessoires",
    href: "/catalogue?category=cables-connectique,accessoires,energie-eclairage",
  },
  { label: "Gaming", href: "/catalogue?usage=gaming" },
  { label: "Promotions", href: "/catalogue?promo=1", highlight: true },
];

export const assuranceLinks = [
  "Livraison partout au Maroc",
  "Paiement à la livraison",
  "Retrait sur place",
  "Garantie & SAV",
];

export const topBarLinks = [
  { label: "Livraison partout au Maroc", href: "/livraison-retour" },
  { label: "Paiement à la livraison", href: "/livraison-retour" },
  { label: "Retrait sur place", href: "/magasins" },
  { label: "Garantie & SAV", href: "/garantie-sav" },
  { label: "Besoin d'aide ? 0800 123 456", href: "/contact" },
  { label: "Magasins", href: "/magasins" },
  { label: "Suivre ma commande", href: "/suivre-commande" },
];
