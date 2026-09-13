// Definition des filtres de boutique, categorie par categorie.
//
// Une categorie sans FilterAttribute n'affiche aucun filtre technique : le
// visiteur de "Composants PC" voyait defiler pele-mele des barrettes de RAM,
// des boitiers et des processeurs sans pouvoir reduire la liste.
//
// Deux regles gouvernent ce fichier :
//
// 1. Le `slug` d'un attribut est la cle technique lue sur le produit
//    (product.attributes[slug]). Elle est en camelCase dans tout le
//    catalogue. Reutiliser le slug d'une autre categorie quand le sens est
//    identique - `processor`, `ramSlots`, `cpuCores` - pour que le filtre du
//    catalogue complet reste coherent, et reprendre ses libelles d'options
//    au caractere pres, accents compris : la comparaison est litterale.
//
// 2. Un attribut dont aucun produit ne porte de valeur est masque en
//    boutique (getVisibleOptions). On peut donc declarer la structure
//    d'abord et n'y rattacher les faits verifies qu'ensuite, sans jamais
//    montrer un filtre vide au client.
//
// Les valeurs elles-memes ne sont PAS ecrites ici : elles passent par
// data/verified-product-specs.json et scripts/import-verified-specs.mjs, qui
// exigent deux sources HTTPS et une preuve par valeur.

const OUI_NON = ["Oui", "Non"];

function attribut(slug, label, options, extra = {}) {
  return {
    slug,
    label,
    type: extra.type ?? "CHECKBOX",
    searchable: extra.searchable ?? false,
    unit: extra.unit ?? null,
    options: options ?? [],
  };
}

function booleen(slug, label) {
  return attribut(slug, label, OUI_NON, { type: "BOOLEAN" });
}

function liste(slug, label, options) {
  return attribut(slug, label, options, { type: "SEARCH_LIST", searchable: true });
}

export const FILTRES_PAR_CATEGORIE = {
  "composants-pc": {
    principaux: [
      // Le filtre decisif : la categorie melange sept familles d'articles
      // qui n'ont presque aucune caracteristique commune.
      attribut("componentType", "Type de composant", [
        "Carte graphique",
        "Processeur",
        "Mémoire RAM",
        "Carte mère",
        "Boîtier",
        "Alimentation",
        "Refroidissement",
        "Pâte thermique",
      ]),
      // Memes libelles que PC Portables : sur le catalogue complet, les deux
      // se repondent au lieu de se doubler.
      attribut("processor", "Processeur", [
        "Intel Core i3",
        "Intel Core i5",
        "Intel Core i7",
        "Intel Core i9",
        "AMD Ryzen 3",
        "AMD Ryzen 5",
        "AMD Ryzen 7",
        "AMD Ryzen 9",
      ]),
      attribut("memoryCapacity", "Capacité mémoire", [
        "1 Go",
        "2 Go",
        "4 Go",
        "8 Go",
        "16 Go",
        "32 Go",
      ]),
      attribut("memoryType", "Type de mémoire", ["DDR2", "DDR3", "DDR4", "DDR5"]),
      // Une barrette de portable ne rentre pas dans une tour : c'est la
      // premiere erreur d'achat sur ce rayon.
      attribut("memoryFormat", "Format de barrette", [
        "DIMM (PC bureau)",
        "SO-DIMM (PC portable)",
      ]),
      attribut("gpuChipset", "Puce graphique", [
        "GeForce GT 730",
        "GeForce GT 1030",
      ]),
    ],
    avances: [
      attribut("memorySpeed", "Fréquence mémoire", [
        "800 MHz",
        "1066 MHz",
        "1333 MHz",
        "1600 MHz",
        "1866 MHz",
        "2133 MHz",
        "2400 MHz",
        "2666 MHz",
        "3200 MHz",
        "3600 MHz",
      ]),
      // Une barrette RDIMM ne demarre pas sur une carte mere de bureau.
      // L'information vaut un retour client evite.
      attribut("memoryModuleClass", "Type de module", [
        "UDIMM (non-ECC)",
        "UDIMM ECC",
        "RDIMM (ECC registered)",
      ]),
      attribut("gpuMemory", "Mémoire vidéo", ["1 Go", "2 Go", "4 Go", "6 Go", "8 Go"]),
      attribut("gpuMemoryType", "Type de mémoire vidéo", ["DDR3", "GDDR5", "GDDR6"]),
      liste("gpuOutputs", "Sorties vidéo", ["HDMI", "DisplayPort", "DVI", "VGA"]),
      attribut("socket", "Socket", [
        "AM4",
        "AM5",
        "LGA 1151",
        "LGA 1200",
        "LGA 1700",
      ]),
      // Memes libelles que l'attribut cpuCores de PC Portables.
      attribut("cpuCores", "Nombre de cœurs", [
        "2 cœurs",
        "4 cœurs",
        "6 cœurs",
        "8 cœurs",
        "12 cœurs",
        "16 cœurs",
      ]),
      // "Tray" veut dire sans ventirad : le client doit le savoir avant de
      // payer, pas en ouvrant la boite.
      attribut("cpuPackaging", "Conditionnement", [
        "Box (ventirad inclus)",
        "Tray (sans ventirad)",
      ]),
      booleen("integratedGraphics", "Graphiques intégrés"),
      // Les cartes graphiques d'entree de gamme descendent bien plus bas que
      // les processeurs : la liste couvre les deux familles.
      attribut("tdp", "Enveloppe thermique (TDP)", [
        "20 W",
        "30 W",
        "35 W",
        "45 W",
        "65 W",
        "95 W",
        "105 W",
        "125 W",
      ]),
      attribut("chipset", "Chipset", ["A320", "A520", "B450", "B550", "X570"]),
      attribut("motherboardFormat", "Format carte mère", [
        "ATX",
        "Micro-ATX",
        "Mini-ITX",
      ]),
      attribut("ramSlots", "Slots mémoire", ["2 slots", "4 slots"]),
      attribut("caseFormat", "Format boîtier", [
        "Mini tour",
        "Moyenne tour",
        "Grande tour",
      ]),
      attribut("includedFans", "Ventilateurs inclus", [
        "1 ventilateur",
        "2 ventilateurs",
        "3 ventilateurs",
        "4 ventilateurs",
        "5 ventilateurs",
        "6 ventilateurs",
      ]),
      booleen("rgb", "Éclairage RGB"),
      attribut("sidePanel", "Panneau latéral", [
        "Verre trempé",
        "Acrylique",
        "Acier plein",
        "Maillé",
      ]),
      attribut("psuPower", "Puissance alimentation", [
        "400 W",
        "450 W",
        "500 W",
        "550 W",
        "600 W",
        "650 W",
        "750 W",
        "850 W",
      ]),
      attribut("psuCertification", "Certification 80 PLUS", [
        "80 PLUS",
        "80 PLUS Bronze",
        "80 PLUS Silver",
        "80 PLUS Gold",
      ]),
      attribut("psuModular", "Modularité", [
        "Non modulaire",
        "Semi-modulaire",
        "Entièrement modulaire",
      ]),
      attribut("coolerType", "Type de refroidissement", [
        "Ventirad (air)",
        "Watercooling AIO",
      ]),
      liste("coolerSockets", "Sockets compatibles", [
        "AM4",
        "AM5",
        "LGA 1151",
        "LGA 1200",
        "LGA 1700",
      ]),
    ],
  },
};

export const GROUPES = [
  {
    cle: "principaux",
    name: "Filtres principaux",
    slug: "filtres-principaux",
    order: 1,
    defaultOpen: true,
    isAdvanced: false,
  },
  {
    cle: "avances",
    name: "Filtres avancés",
    slug: "filtres-avances",
    order: 2,
    defaultOpen: false,
    isAdvanced: true,
  },
];
