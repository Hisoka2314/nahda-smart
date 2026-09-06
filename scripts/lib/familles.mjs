// Cartographie des familles d'inventaire vers les categories de la boutique.
//
// Source unique : l'import d'inventaire et le reclassement s'appuient tous
// deux sur ce fichier, faute de quoi les deux versions divergent au premier
// ajustement.
//
// Le code famille vient de Sage. Il decrit le rayon du magasin, pas toujours
// une categorie de boutique : quelques familles melangent des articles qui
// n'ont rien a voir (ACI contient un splitter audio, un tiroir-caisse et un
// desodorisant de voiture). La cartographie fait de son mieux ; les cas
// isoles se corrigent depuis le back-office.

// Categories creees en plus de la quatorzaine d'origine. Elles decoupent les
// deux fourre-tout qui rassemblaient a eux seuls un tiers du catalogue :
// "Accessoires" (292 produits) et "Peripheriques" (144).
export const CATEGORIES_SUPPLEMENTAIRES = [
  {
    slug: "ecrans-moniteurs",
    name: "Écrans & Moniteurs",
    description:
      "Moniteurs bureautiques, gaming et professionnels, de 19 à 32 pouces.",
    bannerUrl: "/generated/product-aio-ai.png",
    order: 15,
  },
  {
    slug: "composants-pc",
    name: "Composants PC",
    description:
      "Mémoire vive, cartes mères, cartes graphiques, boîtiers et dalles d'écran.",
    bannerUrl: "/generated/product-desktop-ai.png",
    order: 16,
  },
  {
    slug: "cables-connectique",
    name: "Câbles & Connectique",
    description:
      "Câbles HDMI, VGA, USB, adaptateurs, convertisseurs et rallonges.",
    bannerUrl: "/generated/product-rack-ai.png",
    order: 17,
  },
  {
    slug: "sacs-housses",
    name: "Sacs & Housses",
    description: "Cartables, sacs à dos et housses pour ordinateurs portables.",
    bannerUrl: "/generated/product-accessory-real.png",
    order: 18,
  },
  {
    slug: "ventilation-climatisation",
    name: "Ventilation & Climatisation",
    description: "Ventilateurs de bureau, brasseurs d'air et climatiseurs.",
    bannerUrl: "/generated/product-accessories-ai.png",
    order: 19,
  },
  {
    slug: "energie-eclairage",
    name: "Énergie & Éclairage",
    description: "Piles, rallonges, prises, gaines et éclairage LED.",
    bannerUrl: "/generated/product-ups-ai.png",
    order: 20,
  },
];

export const FAMILLE_VERS_CATEGORIE = {
  // Ordinateurs
  LPT: "pc-portables", PTBL: "pc-portables", BAT: "pc-portables", CHG: "pc-portables",
  PC: "all-in-one",
  UC: "pc-bureau", PCB: "pc-bureau",

  // Ecrans : sortis des peripheriques, ou ils representaient a eux seuls
  // presque la moitie du rayon.
  ECR: "ecrans-moniteurs",

  // Peripheriques, une fois les ecrans partis
  SRS: "peripheriques", CLV: "peripheriques", WCAM: "peripheriques",
  ACLV: "peripheriques", SCN: "peripheriques", KVM: "peripheriques",

  // Composants
  // Un processeur, une carte mere et une alimentation sont des composants,
  // pas des ordinateurs de bureau : ils encombraient le rayon "PC Bureau".
  RAM: "composants-pc", CM: "composants-pc", VGA: "composants-pc",
  BTG: "composants-pc", AFF: "composants-pc", CPU: "composants-pc",
  MB: "composants-pc", ALM: "composants-pc",

  // Cablerie et adaptateurs
  CHDMI: "cables-connectique", CVGA: "cables-connectique", CAPL: "cables-connectique",
  CRU: "cables-connectique", ADAP: "cables-connectique", HUSB: "cables-connectique",
  SHDMI: "cables-connectique", CAC: "cables-connectique", ACHG: "cables-connectique",
  CCHG: "cables-connectique", ELEC: "cables-connectique", CALM: "cables-connectique",

  // Impression : RP regroupe les rouleaux thermiques et les etiquettes, qui
  // sont des consommables d'impression et non des accessoires.
  TNR: "impression", CRT: "impression", IMP: "impression", CIMP: "impression",
  FAX: "impression", RP: "impression",

  // Telephonie : PN designe les produits de nettoyage, pas un telephone.
  TEL: "telephonie", CTEL: "telephonie", STEL: "telephonie", PB: "telephonie",
  TAB: "telephonie",

  // Baies et cablage structure
  CRES: "baies-reseau-cablage", BNC: "baies-reseau-cablage", CBNC: "baies-reseau-cablage",
  RACK: "baies-reseau-cablage", PAT: "baies-reseau-cablage", CPL: "baies-reseau-cablage",
  PBR: "baies-reseau-cablage",

  // Videosurveillance. BALM ne contient que des coffrets d'alimentation
  // pour cameras : il etait range en bureautique.
  CAM: "securite-cameras", SCAM: "securite-cameras", ALR: "securite-cameras",
  DVR: "securite-cameras", CPTZ: "securite-cameras", BALM: "securite-cameras",

  // Reseau actif
  CWIFI: "reseaux-connectivite", RTR: "reseaux-connectivite", SWCH: "reseaux-connectivite",
  PAC: "reseaux-connectivite",

  // Stockage : les cles USB, cartes M.2 et lecteurs optiques y ont leur place
  // bien plus que dans les accessoires.
  DD: "stockage", BDD: "stockage", CSD: "stockage", CD: "stockage",
  DVD: "stockage", CDS: "stockage", CUSB: "stockage", CS: "stockage",
  LCT: "stockage", LCM: "stockage", SN: "stockage",

  // Multimedia
  HP: "multimedia", ECT: "multimedia", CSQ: "multimedia", TV: "multimedia",
  STV: "multimedia", TVB: "multimedia", VP: "multimedia", EVP: "multimedia",
  PLAY: "multimedia", BAR: "multimedia",

  SOFT: "logiciels", VIR: "logiciels",

  // Transport et protection
  CRTB: "sacs-housses", EMB: "sacs-housses",

  VNT: "ventilation-climatisation",

  PIL: "energie-eclairage", RLG: "energie-eclairage", PRS: "energie-eclairage",
  VL: "energie-eclairage", PLT: "energie-eclairage",

  // Ce qui reste : petit materiel, outillage et divers.
  ACI: "accessoires", POT: "accessoires", ARM: "accessoires", ETG: "accessoires",
  MAT: "accessoires", MLD: "accessoires", PRA: "accessoires", CALC: "accessoires",
  RUSB: "accessoires", PN: "accessoires",

  // ML rassemble des produits d'herboristerie (safran, amlou, huile d'olive).
  // Ils n'ont pas leur place dans un catalogue informatique : la boutique les
  // rangeait dans "Reseaux & Connectivite". A archiver depuis le back-office,
  // ou a sortir dans une categorie dediee si le magasin les vend vraiment.
  ML: "accessoires",
};

export const CATEGORIE_PAR_DEFAUT = "accessoires";

// Rattrapages a la designation, appliques apres la famille.
//
// Une famille decrit un rayon, pas un article : le magasin range la carte de
// pointage avec les cartes meres (CM) et le cable DisplayPort avec les
// supports optiques (CDS). Une poignee de references ne peut donc pas etre
// classee correctement par sa seule famille.
//
// L'ordre compte : le premier motif qui correspond gagne.
export const AJUSTEMENTS_PAR_DESIGNATION = [
  [/\bCARTE\b.*\bPOINTAGE\b|\bBADGE\b.*\b(RFID|PROXIMITE)\b/, "securite-cameras"],
  [/\bPA[TS]?TE THERMIQUE\b/, "composants-pc"],
  [/\bTABLETTE GRAPHIQUE\b/, "peripheriques"],
  [/\bCABLE\b.*\bDISPLAY\b|\bDISPLAYPORT\b/, "cables-connectique"],
  [/\bTRIPOD\b|\bTREPIED\b/, "accessoires"],
  // Rangee en alarme par le magasin, donc en videosurveillance : la fiche
  // annoncait une telecommande de presentation comme un "equipement de
  // videosurveillance".
  [/\bTELECOMMANDE\b.*\bPRESENTATION\b/, "peripheriques"],
];

export function categoriePourFamille(famille, designation = "") {
  const texte = String(designation ?? "").toUpperCase();

  for (const [motif, slug] of AJUSTEMENTS_PAR_DESIGNATION) {
    if (motif.test(texte)) return slug;
  }

  return FAMILLE_VERS_CATEGORIE[String(famille ?? "").trim().toUpperCase()] ?? CATEGORIE_PAR_DEFAUT;
}
