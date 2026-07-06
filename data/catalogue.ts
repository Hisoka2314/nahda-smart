import type {
  AttributeFilter,
  CatalogCategory,
  CatalogProduct,
  DeliveryMode,
  FilterOption,
  ProductAudience,
  ProductCondition,
  ProductRange,
  ProductUsage,
  PurchaseType,
  StockLocation,
  StockStatus,
  WarrantyProvider,
} from "@/types/catalogue";

type ProductGlobalFields = Pick<
  CatalogProduct,
  | "warrantyProvider"
  | "stockLocation"
  | "deliveryModes"
  | "purchaseTypes"
  | "audiences"
  | "range"
  | "series"
  | "b2bQuoteCompatible"
  | "isRecommended"
>;

type CatalogProductInput = Omit<CatalogProduct, keyof ProductGlobalFields> &
  Partial<ProductGlobalFields>;

export const catalogueImages = {
  laptop: "/generated/product-laptop-ai.png",
  desktop: "/generated/product-desktop-ai.png",
  aio: "/generated/product-aio-ai.png",
  software: "/generated/product-software-ai.png",
  router: "/generated/product-router-ai.png",
  switch: "/generated/product-switch-ai.png",
  camera: "/generated/product-camera-ai.png",
  printer: "/generated/product-printer-ai.png",
  ssd: "/generated/product-ssd-ai.png",
  headset: "/generated/product-headset-ai.png",
  phone: "/generated/product-ip-phone-ai.png",
  rack: "/generated/product-rack-ai.png",
  ups: "/generated/product-ups-ai.png",
  accessories: "/generated/product-accessories-ai.png",
} as const;

export const catalogueCategories: CatalogCategory[] = [
  {
    name: "PC Portables",
    slug: "pc-portables",
    eyebrow: "Ordinateurs",
    description:
      "PC portables professionnels, ultrabooks et machines performantes pour équipes mobiles.",
    image: catalogueImages.laptop,
    bannerImage: catalogueImages.laptop,
    productCount: 86,
  },
  {
    name: "PC Bureau",
    slug: "pc-bureau",
    eyebrow: "Ordinateurs",
    description:
      "Tours, mini PC et postes fixes fiables pour bureaux, écoles et administrations.",
    image: catalogueImages.desktop,
    bannerImage: catalogueImages.desktop,
    productCount: 54,
  },
  {
    name: "All-in-One",
    slug: "all-in-one",
    eyebrow: "Ordinateurs",
    description:
      "Postes intégrés élégants pour accueils, salles de formation et espaces de travail propres.",
    image: catalogueImages.aio,
    bannerImage: catalogueImages.aio,
    productCount: 28,
  },
  {
    name: "Logiciels",
    slug: "logiciels",
    eyebrow: "Solutions",
    description:
      "Licences, sécurité, bureautique et outils numériques pour particuliers et sociétés.",
    image: catalogueImages.software,
    bannerImage: catalogueImages.software,
    productCount: 67,
  },
  {
    name: "Impression",
    slug: "impression",
    eyebrow: "Bureau",
    description:
      "Imprimantes laser, jet d'encre, thermiques, multifonctions et consommables compatibles.",
    image: catalogueImages.printer,
    bannerImage: catalogueImages.printer,
    productCount: 46,
  },
  {
    name: "Réseaux & Connectivité",
    slug: "reseaux-connectivite",
    eyebrow: "Infrastructure",
    description:
      "Routeurs, switchs, points d'accès, baies, câbles et modules pour réseaux fiables.",
    image: catalogueImages.router,
    bannerImage: catalogueImages.router,
    productCount: 98,
  },
  {
    name: "Multimédia",
    slug: "multimedia",
    eyebrow: "Communication",
    description:
      "Casques, audio, visioconférence et équipements pour réunions nettes et efficaces.",
    image: catalogueImages.headset,
    bannerImage: catalogueImages.headset,
    productCount: 52,
  },
  {
    name: "Périphériques",
    slug: "peripheriques",
    eyebrow: "Poste de travail",
    description:
      "Claviers, souris, hubs, adaptateurs et accessoires utiles au quotidien.",
    image: catalogueImages.accessories,
    bannerImage: catalogueImages.accessories,
    productCount: 132,
  },
  {
    name: "Sécurité & Caméras",
    slug: "securite-cameras",
    eyebrow: "Surveillance",
    description:
      "Caméras IP, NVR, DVR, alarmes et interphones pour sites professionnels et maisons.",
    image: catalogueImages.camera,
    bannerImage: catalogueImages.camera,
    productCount: 74,
  },
  {
    name: "Accessoires",
    slug: "accessoires",
    eyebrow: "Connectique",
    description:
      "Câbles, chargeurs, supports, connectique et petits équipements prêts à brancher.",
    image: catalogueImages.accessories,
    bannerImage: catalogueImages.accessories,
    productCount: 210,
  },
  {
    name: "Téléphonie",
    slug: "telephonie",
    eyebrow: "VoIP",
    description:
      "Téléphones IP, postes fixes et solutions de communication pour équipes et accueils.",
    image: catalogueImages.phone,
    bannerImage: catalogueImages.phone,
    productCount: 36,
  },
  {
    name: "Stockage",
    slug: "stockage",
    eyebrow: "Mémoire",
    description:
      "SSD, disques externes, NAS et mémoire pour accélérer, sauvegarder et sécuriser.",
    image: catalogueImages.ssd,
    bannerImage: catalogueImages.ssd,
    productCount: 84,
  },
  {
    name: "Onduleurs & Énergie",
    slug: "onduleurs-energie",
    eyebrow: "Protection",
    description:
      "Onduleurs, multiprises protégées et énergie fiable pour postes, réseaux et serveurs.",
    image: catalogueImages.ups,
    bannerImage: catalogueImages.ups,
    productCount: 31,
  },
  {
    name: "Baies réseau & câblage",
    slug: "baies-reseau-cablage",
    eyebrow: "Infrastructure",
    description:
      "Armoires, brassage, câblage et accessoires d'organisation pour salles techniques.",
    image: catalogueImages.rack,
    bannerImage: catalogueImages.rack,
    productCount: 42,
  },
];

export const stockOptions: FilterOption[] = [
  { label: "En stock", value: "in_stock" },
  { label: "Sur commande", value: "on_order" },
  { label: "Rupture", value: "out_of_stock" },
];

export const conditionOptions: Array<FilterOption & { value: ProductCondition }> = [
  { label: "Neuf", value: "new" },
  { label: "Occasion", value: "used" },
  { label: "Reconditionné", value: "refurbished" },
];

export const usageOptions: Array<FilterOption & { value: ProductUsage }> = [
  { label: "Maison", value: "home" },
  { label: "Bureau", value: "office" },
  { label: "Entreprise", value: "enterprise" },
  { label: "Gaming", value: "gaming" },
  { label: "École", value: "school" },
  { label: "Administration", value: "administration" },
];

export const warrantyOptions: FilterOption[] = [
  { label: "6 mois", value: "6 mois" },
  { label: "12 mois", value: "12 mois" },
  { label: "24 mois", value: "24 mois" },
  { label: "36 mois", value: "36 mois" },
];

export const stockLocationOptions: Array<
  FilterOption & { value: StockLocation }
> = [
  { label: "Dépôt principal", value: "main_depot" },
  { label: "Showroom", value: "showroom" },
  { label: "Sur commande", value: "on_order" },
];

export const deliveryModeOptions: Array<
  FilterOption & { value: DeliveryMode }
> = [
  { label: "Livraison disponible", value: "delivery" },
  { label: "Retrait sur place", value: "pickup" },
];

export const purchaseTypeOptions: Array<
  FilterOption & { value: PurchaseType }
> = [
  { label: "Achat direct", value: "direct" },
  { label: "Demande de devis", value: "quote" },
  { label: "Pack / bundle", value: "bundle" },
];

export const audienceOptions: Array<
  FilterOption & { value: ProductAudience }
> = [
  { label: "Particulier", value: "individual" },
  { label: "Entreprise", value: "company" },
  { label: "École", value: "school" },
  { label: "Administration", value: "administration" },
  { label: "Revendeur", value: "reseller" },
];

export const rangeOptions: Array<FilterOption & { value: ProductRange }> = [
  { label: "Entrée de gamme", value: "entry" },
  { label: "Milieu de gamme", value: "mid" },
  { label: "Premium", value: "premium" },
  { label: "Professionnel", value: "professional" },
];

export const warrantyProviderOptions: Array<
  FilterOption & { value: WarrantyProvider }
> = [
  { label: "Garantie fournisseur", value: "supplier" },
  { label: "Garantie magasin", value: "store" },
];

export const seriesOptions: FilterOption[] = [
  { label: "Latitude", value: "Latitude" },
  { label: "ThinkPad", value: "ThinkPad" },
  { label: "EliteBook", value: "EliteBook" },
  { label: "EliteDesk", value: "EliteDesk" },
  { label: "ProBook", value: "ProBook" },
  { label: "TUF", value: "TUF" },
  { label: "Omada", value: "Omada" },
  { label: "UniFi", value: "UniFi" },
  { label: "JetStream", value: "JetStream" },
  { label: "EcoTank", value: "EcoTank" },
  { label: "LaserJet", value: "LaserJet" },
  { label: "Easy UPS", value: "Easy UPS" },
];

export const categorySpecificFilters: Record<string, AttributeFilter[]> = {
  "pc-portables": [
    {
      key: "processor",
      label: "Processeur",
      options: [
        { label: "Intel Core i3", value: "Intel Core i3" },
        { label: "Intel Core i5", value: "Intel Core i5" },
        { label: "Intel Core i7", value: "Intel Core i7" },
        { label: "Intel Core i9", value: "Intel Core i9" },
        { label: "AMD Ryzen 3", value: "AMD Ryzen 3" },
        { label: "AMD Ryzen 5", value: "AMD Ryzen 5" },
        { label: "AMD Ryzen 7", value: "AMD Ryzen 7" },
        { label: "AMD Ryzen 9", value: "AMD Ryzen 9" },
      ],
    },
    {
      key: "processorGeneration",
      label: "Génération processeur",
      options: [
        { label: "10e génération", value: "10e génération" },
        { label: "11e génération", value: "11e génération" },
        { label: "12e génération", value: "12e génération" },
        { label: "13e génération", value: "13e génération" },
        { label: "14e génération", value: "14e génération" },
      ],
    },
    {
      key: "ram",
      label: "RAM",
      options: [
        { label: "4 Go", value: "4 Go" },
        { label: "8 Go", value: "8 Go" },
        { label: "16 Go", value: "16 Go" },
        { label: "32 Go", value: "32 Go" },
        { label: "64 Go", value: "64 Go" },
      ],
    },
    {
      key: "storageCapacity",
      label: "Stockage",
      options: [
        { label: "128 Go", value: "128 Go" },
        { label: "256 Go", value: "256 Go" },
        { label: "512 Go", value: "512 Go" },
        { label: "1 To", value: "1 To" },
        { label: "2 To", value: "2 To" },
      ],
    },
    {
      key: "storageType",
      label: "Type stockage",
      options: [
        { label: "SSD", value: "SSD" },
        { label: "NVMe", value: "NVMe" },
        { label: "HDD", value: "HDD" },
      ],
    },
    {
      key: "storage",
      label: "Stockage SSD/HDD",
      options: [
        { label: "256 Go SSD", value: "256 Go SSD" },
        { label: "512 Go SSD", value: "512 Go SSD" },
        { label: "1 To SSD", value: "1 To SSD" },
      ],
    },
    {
      key: "graphics",
      label: "Carte graphique",
      options: [
        { label: "Intel UHD", value: "Intel UHD" },
        { label: "Intel Iris Xe", value: "Intel Iris Xe" },
        { label: "AMD Radeon", value: "AMD Radeon" },
        { label: "NVIDIA GTX", value: "NVIDIA GTX" },
        { label: "NVIDIA RTX", value: "NVIDIA RTX" },
      ],
    },
    {
      key: "screenSize",
      label: "Taille écran",
      options: [
        { label: "13 pouces", value: "13 pouces" },
        { label: "14 pouces", value: "14 pouces" },
        { label: "15.6 pouces", value: "15.6 pouces" },
        { label: "16 pouces", value: "16 pouces" },
        { label: "17 pouces", value: "17 pouces" },
      ],
    },
    {
      key: "resolution",
      label: "Résolution",
      options: [
        { label: "HD", value: "HD" },
        { label: "Full HD", value: "Full HD" },
        { label: "2K", value: "2K" },
        { label: "WUXGA", value: "WUXGA" },
        { label: "2.5K", value: "2.5K" },
        { label: "4K", value: "4K" },
      ],
    },
    {
      key: "touch",
      label: "Tactile",
      options: [
        { label: "Oui", value: "Oui" },
        { label: "Non", value: "Non" },
      ],
    },
    {
      key: "os",
      label: "Système d'exploitation",
      options: [
        { label: "Windows 10", value: "Windows 10" },
        { label: "Windows 11 Pro", value: "Windows 11 Pro" },
        { label: "Windows 11 Home", value: "Windows 11 Home" },
        { label: "Windows 11", value: "Windows 11" },
        { label: "FreeDOS", value: "FreeDOS" },
        { label: "macOS", value: "macOS" },
        { label: "Sans OS", value: "Sans OS" },
      ],
    },
    {
      key: "system",
      label: "Système",
      options: [
        { label: "Windows 10", value: "Windows 10" },
        { label: "Windows 11", value: "Windows 11" },
        { label: "FreeDOS", value: "FreeDOS" },
        { label: "macOS", value: "macOS" },
      ],
    },
    {
      key: "battery",
      label: "Autonomie",
      options: [
        { label: "8 h", value: "8 h" },
        { label: "10 h", value: "10 h" },
        { label: "12 h", value: "12 h" },
      ],
    },
    {
      key: "weight",
      label: "Poids",
      options: [
        { label: "Moins de 1.5 kg", value: "Moins de 1.5 kg" },
        { label: "1.5 à 2 kg", value: "1.5 à 2 kg" },
        { label: "Plus de 2 kg", value: "Plus de 2 kg" },
      ],
    },
  ],
  "reseaux-connectivite": [
    {
      key: "networkType",
      label: "Type",
      options: [
        { label: "Routeur", value: "Routeur" },
        { label: "Switch", value: "Switch" },
        { label: "Point d'accès", value: "Point d'accès" },
        { label: "Baie réseau", value: "Baie réseau" },
        { label: "Câble", value: "Câble" },
        { label: "Module SFP", value: "Module SFP" },
      ],
    },
    {
      key: "ports",
      label: "Nombre de ports",
      options: [
        { label: "4 ports", value: "4 ports" },
        { label: "8 ports", value: "8 ports" },
        { label: "24 ports", value: "24 ports" },
        { label: "48 ports", value: "48 ports" },
      ],
    },
    {
      key: "poe",
      label: "PoE",
      options: [
        { label: "Oui", value: "Oui" },
        { label: "Non", value: "Non" },
      ],
    },
    {
      key: "speed",
      label: "Vitesse",
      options: [
        { label: "100 Mbps", value: "100 Mbps" },
        { label: "Gigabit", value: "Gigabit" },
        { label: "2.5G", value: "2.5G" },
        { label: "10G", value: "10G" },
      ],
    },
    {
      key: "wifi",
      label: "Wi-Fi",
      options: [
        { label: "Wi-Fi 5", value: "Wi-Fi 5" },
        { label: "Wi-Fi 6", value: "Wi-Fi 6" },
        { label: "Wi-Fi 6E", value: "Wi-Fi 6E" },
        { label: "Wi-Fi 7", value: "Wi-Fi 7" },
      ],
    },
    {
      key: "band",
      label: "Bandes",
      options: [
        { label: "Dual band", value: "Dual band" },
        { label: "Tri band", value: "Tri band" },
      ],
    },
    {
      key: "rackable",
      label: "Rackable",
      options: [
        { label: "Oui", value: "Oui" },
        { label: "Non", value: "Non" },
      ],
    },
    {
      key: "manageable",
      label: "Manageable",
      options: [
        { label: "Manageable", value: "Manageable" },
        { label: "Non manageable", value: "Non manageable" },
      ],
    },
    {
      key: "networkUsage",
      label: "Usage",
      options: [
        { label: "Usage pro", value: "Usage pro" },
        { label: "Usage maison", value: "Usage maison" },
      ],
    },
  ],
  "securite-cameras": [
    {
      key: "securityType",
      label: "Type",
      options: [
        { label: "Caméra IP", value: "Caméra IP" },
        { label: "Caméra analogique", value: "Caméra analogique" },
        { label: "DVR", value: "DVR" },
        { label: "NVR", value: "NVR" },
        { label: "Alarme", value: "Alarme" },
        { label: "Interphone", value: "Interphone" },
      ],
    },
    {
      key: "resolution",
      label: "Résolution",
      options: [
        { label: "2MP", value: "2MP" },
        { label: "4MP", value: "4MP" },
        { label: "8MP", value: "8MP" },
      ],
    },
    {
      key: "nightVision",
      label: "Vision nocturne",
      options: [
        { label: "30 m", value: "30 m" },
        { label: "50 m", value: "50 m" },
        { label: "100 m", value: "100 m" },
      ],
    },
    {
      key: "placement",
      label: "Intérieur / extérieur",
      options: [
        { label: "Intérieur", value: "Intérieur" },
        { label: "Extérieur", value: "Extérieur" },
        { label: "Intérieur / extérieur", value: "Intérieur / extérieur" },
      ],
    },
    {
      key: "poe",
      label: "PoE",
      options: [
        { label: "Oui", value: "Oui" },
        { label: "Non", value: "Non" },
      ],
    },
    {
      key: "ptz",
      label: "PTZ",
      options: [
        { label: "Oui", value: "Oui" },
        { label: "Non", value: "Non" },
      ],
    },
    {
      key: "audio",
      label: "Audio",
      options: [
        { label: "Oui", value: "Oui" },
        { label: "Non", value: "Non" },
      ],
    },
    {
      key: "storage",
      label: "Stockage",
      options: [
        { label: "MicroSD", value: "MicroSD" },
        { label: "NVR", value: "NVR" },
        { label: "DVR", value: "DVR" },
      ],
    },
    {
      key: "recorderCompatibility",
      label: "Compatibilité NVR/DVR",
      options: [
        { label: "NVR", value: "NVR" },
        { label: "DVR", value: "DVR" },
        { label: "Hybride", value: "Hybride" },
      ],
    },
  ],
  impression: [
    {
      key: "printerType",
      label: "Type",
      options: [
        { label: "Laser", value: "Laser" },
        { label: "Jet d'encre", value: "Jet d'encre" },
        { label: "Thermique", value: "Thermique" },
      ],
    },
    {
      key: "colorMode",
      label: "Couleur / monochrome",
      options: [
        { label: "Couleur", value: "Couleur" },
        { label: "Monochrome", value: "Monochrome" },
      ],
    },
    {
      key: "wifi",
      label: "Wi-Fi",
      options: [
        { label: "Oui", value: "Oui" },
        { label: "Non", value: "Non" },
      ],
    },
    {
      key: "duplex",
      label: "Recto-verso",
      options: [
        { label: "Oui", value: "Oui" },
        { label: "Non", value: "Non" },
      ],
    },
    {
      key: "scanner",
      label: "Scanner",
      options: [
        { label: "Oui", value: "Oui" },
        { label: "Non", value: "Non" },
      ],
    },
    {
      key: "adf",
      label: "ADF",
      options: [
        { label: "Oui", value: "Oui" },
        { label: "Non", value: "Non" },
      ],
    },
    {
      key: "paperFormat",
      label: "Format papier",
      options: [
        { label: "A4", value: "A4" },
        { label: "A3", value: "A3" },
        { label: "Ticket", value: "Ticket" },
      ],
    },
    {
      key: "printSpeed",
      label: "Vitesse impression",
      options: [
        { label: "20 ppm", value: "20 ppm" },
        { label: "30 ppm", value: "30 ppm" },
        { label: "40 ppm", value: "40 ppm" },
      ],
    },
    {
      key: "consumables",
      label: "Consommables compatibles",
      options: [
        { label: "Toner", value: "Toner" },
        { label: "Bouteilles d'encre", value: "Bouteilles d'encre" },
        { label: "Rouleaux thermiques", value: "Rouleaux thermiques" },
      ],
    },
  ],
  accessoires: [
    {
      key: "accessoryType",
      label: "Type accessoire",
      options: [
        { label: "Câble", value: "Câble" },
        { label: "Casque", value: "Casque" },
        { label: "Clavier", value: "Clavier" },
        { label: "Chargeur", value: "Chargeur" },
        { label: "Hub", value: "Hub" },
      ],
    },
    {
      key: "connectivity",
      label: "Connectique",
      options: [
        { label: "USB", value: "USB" },
        { label: "USB-C", value: "USB-C" },
        { label: "RJ45", value: "RJ45" },
        { label: "HDMI", value: "HDMI" },
        { label: "Bluetooth", value: "Bluetooth" },
      ],
    },
    {
      key: "compatibility",
      label: "Compatibilité",
      options: [
        { label: "PC", value: "PC" },
        { label: "Mac", value: "Mac" },
        { label: "Réseau", value: "Réseau" },
        { label: "VoIP", value: "VoIP" },
      ],
    },
    {
      key: "power",
      label: "Puissance",
      options: [
        { label: "30W", value: "30W" },
        { label: "65W", value: "65W" },
        { label: "100W", value: "100W" },
      ],
    },
    {
      key: "capacity",
      label: "Capacité",
      options: [
        { label: "128 Go", value: "128 Go" },
        { label: "512 Go", value: "512 Go" },
        { label: "1 To", value: "1 To" },
      ],
    },
    {
      key: "cableLength",
      label: "Longueur câble",
      options: [
        { label: "1 m", value: "1 m" },
        { label: "3 m", value: "3 m" },
        { label: "30 m", value: "30 m" },
      ],
    },
    {
      key: "color",
      label: "Couleur",
      options: [
        { label: "Noir", value: "Noir" },
        { label: "Blanc", value: "Blanc" },
        { label: "Bleu", value: "Bleu" },
      ],
    },
    {
      key: "brand",
      label: "Marque",
      options: [
        { label: "Logitech", value: "Logitech" },
        { label: "Kingston", value: "Kingston" },
        { label: "TP-Link", value: "TP-Link" },
      ],
    },
  ],
};

export const commonAttributeFilters: AttributeFilter[] = [
  {
    key: "processor",
    label: "Processeur",
    options: [
      { label: "Intel Core i5", value: "Intel Core i5" },
      { label: "Intel Core i7", value: "Intel Core i7" },
      { label: "AMD Ryzen 5", value: "AMD Ryzen 5" },
    ],
  },
  {
    key: "networkType",
    label: "Type réseau",
    options: [
      { label: "Routeur", value: "Routeur" },
      { label: "Switch", value: "Switch" },
      { label: "Point d'accès", value: "Point d'accès" },
    ],
  },
  {
    key: "printerType",
    label: "Type impression",
    options: [
      { label: "Laser", value: "Laser" },
      { label: "Jet d'encre", value: "Jet d'encre" },
      { label: "Thermique", value: "Thermique" },
    ],
  },
];

export const advancedCategorySpecificFilters: Record<string, AttributeFilter[]> = {
  "pc-portables": [
    filter("cpuModel", "Modèle CPU exact", [
      "i5-1135G7",
      "i5-1235U",
      "i7-1355U",
      "Ryzen 5 5500U",
      "Ryzen 7 7735HS",
    ], true),
    filter("cpuSeries", "Série CPU", ["U", "P", "H", "HS", "HX"]),
    filter("cpuCores", "Nombre de cœurs CPU", ["4 cœurs", "6 cœurs", "8 cœurs", "12 cœurs"]),
    filter("ramExpandable", "RAM extensible", yesNo()),
    filter("maxRam", "RAM maximale supportée", ["16 Go", "32 Go", "64 Go"]),
    filter("ramSlots", "Nombre de slots RAM", ["1 slot", "2 slots", "Soudée"]),
    filter("ssdSlots", "Nombre de slots SSD", ["1 slot", "2 slots"]),
    filter("panelType", "Type écran", ["TN", "IPS", "OLED"]),
    filter("brightness", "Luminosité écran", ["250 nits", "300 nits", "400 nits+"]),
    filter("colorCoverage", "Couverture couleur", ["Standard", "sRGB", "Créateur"]),
    filter("webcam", "Webcam", ["HD", "FHD", "Cache confidentialité"]),
    filter("securityFeatures", "Sécurité", [
      "Empreinte digitale",
      "TPM",
      "Lecteur Smart Card",
      "Caméra IR",
    ], true),
    filter("portsDetailed", "Connectique détaillée", [
      "HDMI",
      "USB-A",
      "USB-C",
      "Thunderbolt",
      "RJ45",
      "Jack audio",
      "Lecteur SD",
    ], true),
    filter("wifiStandard", "Wi-Fi", ["Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E", "Wi-Fi 7"]),
    filter("bluetooth", "Bluetooth", ["Bluetooth 5.0", "Bluetooth 5.2", "Bluetooth 5.3"]),
    filter("batteryWh", "Batterie Wh", ["41 Wh", "50 Wh", "57 Wh", "76 Wh"]),
    filter("chargerType", "Chargeur", ["USB-C", "Chargeur classique"]),
    filter("chargerPower", "Puissance chargeur", ["45W", "65W", "90W", "180W"]),
    filter("keyboard", "Clavier", ["AZERTY", "QWERTY", "Rétroéclairé", "Pavé numérique"]),
    filter("refurbGrade", "Grade occasion/reconditionné", ["Grade A", "Grade B", "Grade C"]),
    filter("batteryHealth", "État batterie", ["Excellent", "Bon", "Moyen"]),
    filter("cosmeticCondition", "État esthétique", [
      "Comme neuf",
      "Traces légères",
      "Traces visibles",
    ]),
  ],
  "pc-bureau": desktopAdvancedFilters(),
  "all-in-one": desktopAdvancedFilters([
    filter("aioScreenSize", "Taille écran All-in-One", ["21.5 pouces", "23.8 pouces", "27 pouces"]),
  ]),
  "reseaux-connectivite": [
    filter("networkType", "Type", [
      "Routeur",
      "Switch",
      "Point d'accès",
      "Contrôleur",
      "Baie",
      "Câble",
      "Module SFP",
      "Adaptateur",
    ]),
    filter("rj45Ports", "Nombre de ports RJ45", ["1", "4", "8", "16", "24", "48"]),
    filter("sfpPorts", "Nombre de ports SFP / SFP+", ["0", "2", "4", "8"]),
    filter("portSpeed", "Vitesse ports", ["100 Mbps", "1G", "2.5G", "10G"]),
    filter("poeType", "PoE", ["Non", "PoE", "PoE+", "PoE++"]),
    filter("poeBudget", "Budget PoE total", ["60W", "120W", "250W", "500W"]),
    filter("poePowerPerPort", "Puissance PoE par port", ["15W", "30W", "60W", "90W"]),
    filter("manageableBool", "Manageable", yesNo()),
    filter("managementLevel", "Niveau", [
      "Unmanaged",
      "Smart managed",
      "Managed",
      "Layer 2",
      "Layer 3",
    ]),
    filter("vlan", "VLAN", yesNo()),
    filter("qos", "QoS", yesNo()),
    filter("rackable", "Rackable", yesNo()),
    filter("fanless", "Fanless", yesNo()),
    filter("cloudManaged", "Cloud managed", yesNo()),
    filter("controllerCompatibility", "Compatible contrôleur", [
      "Omada",
      "UniFi",
      "Standalone",
    ], true),
    filter("wifiStandard", "Wi-Fi standard", ["Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E", "Wi-Fi 7"]),
    filter("wifiBands", "Bandes", ["Single", "Dual-band", "Tri-band"]),
    filter("antennas", "Antennes", ["Internes", "Externes"]),
    filter("coverage", "Couverture estimée", ["50 m²", "120 m²", "250 m²", "500 m²+"]),
    filter("usersRecommended", "Nombre utilisateurs recommandé", ["10", "30", "60", "100+"]),
    filter("networkAudience", "Usage", [
      "Maison",
      "PME",
      "Hôtel",
      "École",
      "Entreprise",
      "Administration",
    ]),
    filter("vpn", "VPN", yesNo()),
    filter("cellular", "4G/5G", yesNo()),
  ],
  "securite-cameras": [
    filter("securityType", "Type", [
      "Caméra IP",
      "Caméra analogique",
      "DVR",
      "NVR",
      "Kit caméra",
      "Alarme",
      "Interphone",
    ]),
    filter("cameraResolution", "Résolution", ["2MP", "4MP", "5MP", "8MP", "4K"]),
    filter("lens", "Objectif", ["2.8mm", "3.6mm", "Varifocal"]),
    filter("viewingAngle", "Angle de vue", ["90°", "105°", "120°"]),
    filter("nightVisionDistance", "Vision nocturne distance", ["20m", "30m", "50m", "80m+"]),
    filter("cameraPlacement", "Intérieur / extérieur", ["Intérieur", "Extérieur", "Intérieur / extérieur"]),
    filter("protectionIndex", "Indice protection", ["IP66", "IP67"]),
    filter("vandalProof", "Anti-vandale", ["IK10"]),
    filter("poe", "PoE", yesNo()),
    filter("wifi", "Wi-Fi", yesNo()),
    filter("ptz", "PTZ", yesNo()),
    filter("audioType", "Audio", ["Micro", "Haut-parleur", "Bidirectionnel"]),
    filter("detection", "Détection", ["Mouvement", "Humain", "Véhicule", "Intrusion"]),
    filter("compression", "Compression", ["H.264", "H.265"]),
    filter("wdr", "WDR", yesNo()),
    filter("onvif", "ONVIF", yesNo()),
    filter("videoStorage", "Stockage", ["MicroSD", "NVR", "Cloud"]),
    filter("channels", "Nombre de canaux NVR/DVR", ["4", "8", "16", "32"]),
    filter("diskCapacity", "Capacité disque supportée", ["2 To", "6 To", "10 To", "16 To"]),
    filter("brandCompatibility", "Compatible marque", ["Hikvision", "Dahua", "Uniview", "Autre"], true),
  ],
  impression: [
    filter("printerType", "Type", ["Laser", "Jet d'encre", "Thermique", "Multifonction"]),
    filter("printColorMode", "Couleur / monochrome", ["Couleur", "Monochrome"]),
    filter("functions", "Fonctions", ["Impression", "Scan", "Copie", "Fax"]),
    filter("wifi", "Wi-Fi", yesNo()),
    filter("ethernet", "Ethernet", yesNo()),
    filter("usb", "USB", yesNo()),
    filter("autoDuplex", "Recto-verso automatique", yesNo()),
    filter("adf", "ADF", yesNo()),
    filter("printFormat", "Format", ["A4", "A3"]),
    filter("printSpeedPpm", "Vitesse ppm", ["20 ppm", "30 ppm", "40 ppm"]),
    filter("dpi", "Résolution dpi", ["600 dpi", "1200 dpi", "2400 dpi"]),
    filter("monthlyDuty", "Cycle mensuel", ["5 000 pages", "20 000 pages", "80 000 pages"]),
    filter("consumableType", "Type consommable", ["Toner", "Cartouche", "Bouteille encre"]),
    filter("consumableReference", "Référence consommable", ["HP 149A", "HP 150A", "Epson 103", "Rouleau 80mm"], true),
    filter("costPerPage", "Coût par page", ["Économique", "Standard", "Élevé"]),
    filter("printUsage", "Usage", ["Maison", "Bureau", "Entreprise", "École"]),
  ],
  stockage: [
    filter("storageType", "Type", ["SSD", "HDD", "Clé USB", "Carte mémoire", "NAS"]),
    filter("storageFormat", "Format", ["2.5 pouces", "3.5 pouces", "M.2 2280"]),
    filter("storageInterface", "Interface", ["SATA", "NVMe", "PCIe Gen3", "Gen4", "Gen5", "USB 3.0", "USB-C"]),
    filter("capacity", "Capacité", ["128 Go", "256 Go", "512 Go", "1 To", "2 To", "4 To+"]),
    filter("readSpeed", "Vitesse lecture", ["550 Mo/s", "3 500 Mo/s", "7 000 Mo/s"]),
    filter("writeSpeed", "Vitesse écriture", ["500 Mo/s", "3 000 Mo/s", "6 000 Mo/s"]),
    filter("endurance", "Endurance TBW", ["150 TBW", "300 TBW", "600 TBW"]),
    filter("heatsink", "Avec dissipateur", yesNo()),
    filter("storageUsage", "Usage", ["PC portable", "Desktop", "Gaming", "Vidéosurveillance", "NAS"]),
  ],
  "onduleurs-energie": [
    filter("vaPower", "Puissance VA", ["650VA", "1000VA", "1600VA", "3000VA"]),
    filter("wattPower", "Puissance W", ["360W", "600W", "900W", "2700W"]),
    filter("upsType", "Type", ["Offline", "Line-interactive", "Online"]),
    filter("avr", "AVR", yesNo()),
    filter("outlets", "Nombre de prises", ["4", "6", "8"]),
    filter("autonomy", "Autonomie estimée", ["5 min", "10 min", "20 min"]),
    filter("replaceableBattery", "Batterie remplaçable", yesNo()),
    filter("waveForm", "Forme onde", ["Simulée", "Pure sine wave"]),
    filter("energyUsage", "Usage", ["PC", "Serveur", "Caméra", "Réseau", "Caisse"]),
    filter("surgeProtection", "Protection surtension", yesNo()),
    filter("energyFormat", "Format", ["Desktop", "Rackable"]),
  ],
  telephonie: [
    filter("voipType", "Type", ["Téléphone IP", "Casque", "Adaptateur", "Standard"]),
    filter("sipAccounts", "Nombre de comptes SIP", ["1", "2", "4", "8"]),
    filter("poe", "PoE", yesNo()),
    filter("colorScreen", "Écran couleur", yesNo()),
    filter("bluetooth", "Bluetooth", yesNo()),
    filter("wifi", "Wi-Fi", yesNo()),
    filter("headsetCompatible", "Compatible casque", yesNo()),
    filter("voipUsage", "Usage", ["Centre d'appel", "Bureau", "Réception", "Direction"]),
  ],
  "baies-reseau-cablage": cablingAdvancedFilters(),
  accessoires: cablingAdvancedFilters([
    filter("accessoryType", "Type accessoire", ["Câble", "Casque", "Clavier", "Chargeur", "Hub"]),
    filter("connectivity", "Connectique", ["USB", "USB-C", "RJ45", "HDMI", "Bluetooth"]),
    filter("compatibility", "Compatibilité", ["PC", "Mac", "Réseau", "VoIP"], true),
  ]),
  peripheriques: [
    filter("accessoryType", "Type accessoire", ["Clavier", "Souris", "Hub", "Adaptateur"]),
    filter("connectivity", "Connectique", ["USB", "USB-C", "Bluetooth", "HDMI"]),
    filter("compatibility", "Compatibilité", ["PC", "Mac"], true),
    filter("color", "Couleur", ["Noir", "Blanc", "Bleu"]),
  ],
  multimedia: [
    filter("accessoryType", "Type", ["Casque", "Micro", "Webcam", "Speakerphone"]),
    filter("connectivity", "Connectique", ["USB", "USB-C", "Bluetooth", "Jack audio"]),
    filter("compatibility", "Compatibilité", ["PC", "Mac", "VoIP"], true),
  ],
  logiciels: [
    filter("licenseType", "Type licence", ["Antivirus", "Bureautique", "OS", "Sécurité", "Sauvegarde"]),
    filter("licenseDuration", "Durée", ["1 an", "2 ans", "Lifetime"]),
    filter("usersCount", "Nombre d'utilisateurs", ["1", "5", "10", "50+"]),
    filter("devicesCount", "Nombre d'appareils", ["1", "3", "5", "10+"]),
    filter("platform", "Plateforme", ["Windows", "macOS", "Android", "iOS"]),
    filter("activation", "Activation", ["Clé digitale", "Compte", "Installation"]),
    filter("softwareUsage", "Usage", ["Personnel", "Entreprise", "École"]),
  ],
};

const product = (item: CatalogProductInput): CatalogProduct => {
  const defaults = buildProductDefaults(item);

  return {
    ...item,
    ...defaults,
    attributes: {
      ...defaults.attributes,
      ...item.attributes,
    },
  };
};

function filter(
  key: string,
  label: string,
  values: string[],
  searchable = false,
): AttributeFilter {
  return {
    key,
    label,
    searchable,
    tone: "advanced",
    options: values.map((value) => ({ label: value, value })),
  };
}

function yesNo() {
  return ["Oui", "Non"];
}

function desktopAdvancedFilters(extra: AttributeFilter[] = []) {
  return [
    filter("desktopFormat", "Format", ["Tour", "Mini PC", "SFF", "Workstation", "All-in-One"]),
    filter("exactCpu", "CPU exact", ["i5-1235U", "i7-1355U", "Ryzen 5 5500U"]),
    filter("chipsetGeneration", "Chipset / génération", ["Intel 12e génération", "Intel 13e génération", "AMD série 5000"]),
    filter("ramExpandable", "RAM extensible", yesNo()),
    filter("ramSlots", "Nombre de slots RAM", ["1 slot", "2 slots", "4 slots"]),
    filter("storageSlots", "Slots stockage", ["1 slot", "2 slots", "4 slots"]),
    filter("dedicatedGpu", "GPU dédié", yesNo()),
    filter("psuPower", "Puissance alimentation", ["65W", "180W", "300W", "500W"]),
    filter("wifi", "Wi-Fi", yesNo()),
    filter("bluetooth", "Bluetooth", yesNo()),
    filter("screenIncluded", "Écran inclus", yesNo()),
    ...extra,
    filter("desktopUsage", "Usage", ["Bureautique", "Caisse", "École", "Entreprise", "Design", "Gaming"]),
    filter("upgradeable", "Possibilité upgrade", yesNo()),
  ];
}

function cablingAdvancedFilters(extra: AttributeFilter[] = []) {
  return [
    filter("cableCategory", "Catégorie câble", ["Cat5e", "Cat6", "Cat6A", "Cat7"]),
    filter("shielding", "Blindage", ["UTP", "FTP", "SFTP"]),
    filter("cableLength", "Longueur", ["1m", "2m", "3m", "5m", "10m", "20m", "100m", "305m"]),
    filter("color", "Couleur", ["Noir", "Blanc", "Bleu", "Gris"]),
    filter("connectorType", "Type connecteur", ["RJ45", "USB-C", "HDMI", "Jack audio"]),
    filter("rackHeight", "Baie hauteur", ["6U", "9U", "12U", "18U", "22U", "42U"]),
    filter("rackDepth", "Profondeur baie", ["450mm", "600mm", "800mm", "1000mm"]),
    filter("rackMount", "Murale / sol", ["Murale", "Sol"]),
    filter("ventilation", "Ventilation", yesNo()),
    filter("pduIncluded", "PDU inclus", yesNo()),
    filter("includedAccessories", "Accessoires inclus", ["Étagère", "PDU", "Ventilateur", "Kit visserie"]),
    ...extra,
  ];
}

function buildProductDefaults(item: CatalogProductInput): ProductGlobalFields & {
  attributes: Record<string, string | number | boolean | string[]>;
} {
  const isOnOrder = item.stockStatus === "on_order";
  const isEnterprise =
    item.usage.includes("enterprise") || item.usage.includes("administration");
  const range = inferRange(item);
  const series = inferSeries(item);

  return {
    warrantyProvider: item.warrantyProvider ?? inferWarrantyProvider(item.warranty),
    stockLocation: item.stockLocation ?? (isOnOrder ? "on_order" : item.salesRank % 2 === 0 ? "showroom" : "main_depot"),
    deliveryModes:
      item.deliveryModes ??
      (item.deliveryAvailable ? ["delivery", "pickup"] : ["pickup"]),
    purchaseTypes:
      item.purchaseTypes ??
      [
        "direct",
        ...(item.price >= 1000 || isEnterprise ? ["quote" as const] : []),
        ...(item.isPromo ? ["bundle" as const] : []),
      ],
    audiences: item.audiences ?? inferAudiences(item),
    range: item.range ?? range,
    series: item.series ?? series,
    b2bQuoteCompatible:
      item.b2bQuoteCompatible ?? (isEnterprise || item.price >= 1000),
    isRecommended: item.isRecommended ?? item.rating >= 4.6,
    attributes: advancedDefaultsForProduct(item, series, range),
  };
}

function inferWarrantyProvider(warranty: string): WarrantyProvider {
  const months = Number.parseInt(warranty, 10);
  return Number.isFinite(months) && months >= 24 ? "supplier" : "store";
}

function inferRange(item: CatalogProductInput): ProductRange {
  if (item.price >= 8000) {
    return "premium";
  }

  if (
    item.usage.includes("enterprise") ||
    item.usage.includes("administration") ||
    item.price >= 3000
  ) {
    return "professional";
  }

  if (item.price >= 900) {
    return "mid";
  }

  return "entry";
}

function inferAudiences(item: CatalogProductInput): ProductAudience[] {
  const audiences = new Set<ProductAudience>();

  if (item.usage.includes("home") || item.usage.includes("gaming")) {
    audiences.add("individual");
  }

  if (item.usage.includes("office") || item.usage.includes("enterprise")) {
    audiences.add("company");
  }

  if (item.usage.includes("school")) {
    audiences.add("school");
  }

  if (item.usage.includes("administration")) {
    audiences.add("administration");
  }

  if (item.categorySlug === "reseaux-connectivite" || item.categorySlug === "accessoires") {
    audiences.add("reseller");
  }

  return audiences.size > 0 ? Array.from(audiences) : ["company"];
}

function inferSeries(item: CatalogProductInput) {
  const name = item.name.toLowerCase();

  if (name.includes("latitude")) return "Latitude";
  if (name.includes("thinkpad")) return "ThinkPad";
  if (name.includes("elitedesk")) return "EliteDesk";
  if (name.includes("elitebook")) return "EliteBook";
  if (name.includes("probook")) return "ProBook";
  if (name.includes("tuf")) return "TUF";
  if (name.includes("eap") || name.includes("archer")) return "Omada";
  if (name.includes("unifi")) return "UniFi";
  if (name.includes("dgs")) return "JetStream";
  if (name.includes("ecotank")) return "EcoTank";
  if (name.includes("laserjet")) return "LaserJet";
  if (name.includes("easy ups")) return "Easy UPS";

  return item.brandSlug === "apc" ? "Easy UPS" : "Professionnel";
}

function advancedDefaultsForProduct(
  item: CatalogProductInput,
  series: string,
  range: ProductRange,
) {
  const name = item.name.toLowerCase();
  const common = {
    series,
    productRange: range,
  };

  if (item.categorySlug === "pc-portables") {
    const isRyzen = name.includes("ryzen");
    const isGaming = item.usage.includes("gaming");
    const storageValue = String(item.attributes.storage ?? "");
    const osValue = String(item.attributes.os ?? "");

    return {
      ...common,
      cpuModel: isRyzen ? (isGaming ? "Ryzen 7 7735HS" : "Ryzen 5 5500U") : name.includes("i7") ? "i7-1355U" : "i5-1235U",
      cpuSeries: isGaming ? "H" : "U",
      cpuCores: isGaming ? "8 cœurs" : "10 cœurs",
      storageCapacity: storageValue.includes("2 To")
        ? "2 To"
        : storageValue.includes("1 To")
          ? "1 To"
          : storageValue.includes("256")
            ? "256 Go"
            : storageValue.includes("128")
              ? "128 Go"
              : "512 Go",
      storageType: storageValue.toLowerCase().includes("hdd")
        ? "HDD"
        : item.price >= 6000
          ? "NVMe"
          : "SSD",
      system: osValue.includes("Windows 10")
        ? "Windows 10"
        : osValue.toLowerCase().includes("freedos") || osValue.toLowerCase().includes("sans")
          ? "FreeDOS"
          : osValue.toLowerCase().includes("mac")
            ? "macOS"
            : "Windows 11",
      ramExpandable: item.condition === "refurbished" ? "Oui" : "Oui",
      maxRam: item.specs.some((spec) => spec.includes("32")) ? "64 Go" : "32 Go",
      ramSlots: "2 slots",
      ssdSlots: item.price >= 8000 ? "2 slots" : "1 slot",
      panelType: isGaming ? "IPS" : "IPS",
      brightness: item.price >= 8000 ? "400 nits+" : "300 nits",
      colorCoverage: isGaming ? "Créateur" : "sRGB",
      webcam: "Cache confidentialité",
      securityFeatures: ["TPM", "Empreinte digitale"],
      portsDetailed: ["HDMI", "USB-A", "USB-C", "RJ45", "Jack audio"],
      wifiStandard: item.price >= 8000 ? "Wi-Fi 6E" : "Wi-Fi 6",
      bluetooth: "Bluetooth 5.2",
      batteryWh: item.price >= 8000 ? "76 Wh" : "50 Wh",
      chargerType: isGaming ? "Chargeur classique" : "USB-C",
      chargerPower: isGaming ? "180W" : "65W",
      keyboard: isGaming ? ["AZERTY", "Rétroéclairé", "Pavé numérique"] : ["AZERTY", "Rétroéclairé"],
      refurbGrade: item.condition === "refurbished" ? "Grade A" : "Grade A",
      batteryHealth: item.condition === "refurbished" ? "Bon" : "Excellent",
      cosmeticCondition: item.condition === "refurbished" ? "Traces légères" : "Comme neuf",
    };
  }

  if (["pc-bureau", "all-in-one"].includes(item.categorySlug)) {
    return {
      ...common,
      desktopFormat: item.categorySlug === "all-in-one" ? "All-in-One" : name.includes("mini") ? "Mini PC" : "SFF",
      exactCpu: name.includes("i7") ? "i7-1355U" : "i5-1235U",
      chipsetGeneration: "Intel 13e génération",
      ramExpandable: "Oui",
      ramSlots: item.categorySlug === "all-in-one" ? "2 slots" : "4 slots",
      storageSlots: item.categorySlug === "all-in-one" ? "2 slots" : "4 slots",
      dedicatedGpu: item.usage.includes("gaming") ? "Oui" : "Non",
      psuPower: item.categorySlug === "all-in-one" ? "180W" : "300W",
      wifi: "Oui",
      bluetooth: "Oui",
      screenIncluded: item.categorySlug === "all-in-one" ? "Oui" : "Non",
      aioScreenSize: "23.8 pouces",
      desktopUsage: item.usage.includes("school") ? "École" : item.usage.includes("gaming") ? "Gaming" : "Entreprise",
      upgradeable: "Oui",
    };
  }

  if (item.categorySlug === "reseaux-connectivite" || item.categorySlug === "baies-reseau-cablage") {
    const isSwitch = item.specs.some((spec) => spec.toLowerCase().includes("switch"));
    const isRack = item.categorySlug === "baies-reseau-cablage" || name.includes("baie");
    const isPoE = item.specs.some((spec) => spec.toLowerCase().includes("poe")) || item.attributes.poe === "Oui";

    return {
      ...common,
      networkType: isRack ? "Baie" : isSwitch ? "Switch" : item.specs.some((spec) => spec.includes("Point")) ? "Point d'accès" : "Routeur",
      rj45Ports: isSwitch ? "24" : "4",
      sfpPorts: isSwitch ? "4" : "0",
      portSpeed: item.specs.some((spec) => spec.includes("10G")) ? "10G" : "1G",
      poeType: isPoE ? "PoE+" : "Non",
      poeBudget: isPoE ? "120W" : "60W",
      poePowerPerPort: isPoE ? "30W" : "15W",
      manageableBool: isSwitch || item.specs.some((spec) => spec.includes("Point")) ? "Oui" : "Non",
      managementLevel: isSwitch ? "Smart managed" : "Unmanaged",
      vlan: isSwitch ? "Oui" : "Non",
      qos: "Oui",
      rackable: isSwitch || isRack ? "Oui" : "Non",
      fanless: isSwitch ? "Oui" : "Non",
      cloudManaged: item.brandSlug === "tp-link" ? "Oui" : "Non",
      controllerCompatibility: item.brandSlug === "tp-link" ? "Omada" : "Standalone",
      wifiStandard: item.specs.some((spec) => spec.includes("Wi-Fi 6")) ? "Wi-Fi 6" : "Wi-Fi 5",
      wifiBands: "Dual-band",
      antennas: name.includes("archer") ? "Externes" : "Internes",
      coverage: item.price > 1200 ? "250 m²" : "120 m²",
      usersRecommended: item.price > 2500 ? "100+" : "30",
      networkAudience: item.usage.includes("home") ? "Maison" : "Entreprise",
      vpn: "Oui",
      cellular: "Non",
      cableCategory: "Cat6",
      shielding: "UTP",
      cableLength: "30m",
      color: "Noir",
      connectorType: "RJ45",
      rackHeight: isRack ? "18U" : "6U",
      rackDepth: "600mm",
      rackMount: isRack ? "Sol" : "Murale",
      ventilation: isRack ? "Oui" : "Non",
      pduIncluded: "Non",
      includedAccessories: ["Kit visserie"],
    };
  }

  if (item.categorySlug === "securite-cameras") {
    const isNvr = item.specs.some((spec) => spec === "NVR");

    return {
      ...common,
      securityType: isNvr ? "NVR" : "Caméra IP",
      cameraResolution: item.specs.find((spec) => spec.includes("4MP")) ? "4MP" : item.specs.find((spec) => spec.includes("8")) ? "8MP" : "2MP",
      lens: "2.8mm",
      viewingAngle: "105°",
      nightVisionDistance: item.specs.find((spec) => spec.includes("100")) ? "80m+" : "30m",
      cameraPlacement: "Intérieur / extérieur",
      protectionIndex: "IP67",
      vandalProof: "IK10",
      poe: "Oui",
      wifi: "Non",
      ptz: isNvr ? "Oui" : "Non",
      audioType: item.attributes.audio === "Oui" ? "Micro" : "Bidirectionnel",
      detection: ["Mouvement", "Humain", "Intrusion"],
      compression: "H.265",
      wdr: "Oui",
      onvif: "Oui",
      videoStorage: isNvr ? "NVR" : "MicroSD",
      channels: isNvr ? "8" : "4",
      diskCapacity: isNvr ? "10 To" : "2 To",
      brandCompatibility: item.brandSlug === "dahua" ? "Dahua" : "Hikvision",
    };
  }

  if (item.categorySlug === "impression") {
    const isEpson = item.brandSlug === "epson";
    const isThermal = name.includes("tm-");

    return {
      ...common,
      printerType: isThermal ? "Thermique" : isEpson ? "Jet d'encre" : "Laser",
      printColorMode: isEpson ? "Couleur" : "Monochrome",
      functions: isThermal ? ["Impression"] : ["Impression", "Scan", "Copie"],
      wifi: isThermal ? "Non" : "Oui",
      ethernet: "Oui",
      usb: "Oui",
      autoDuplex: isEpson ? "Non" : "Oui",
      adf: isThermal ? "Non" : "Oui",
      printFormat: isThermal ? "A4" : "A4",
      printSpeedPpm: isThermal ? "30 ppm" : isEpson ? "20 ppm" : "40 ppm",
      dpi: isEpson ? "2400 dpi" : "1200 dpi",
      monthlyDuty: isEpson ? "5 000 pages" : "20 000 pages",
      consumableType: isEpson ? "Bouteille encre" : isThermal ? "Cartouche" : "Toner",
      consumableReference: isEpson ? "Epson 103" : isThermal ? "Rouleau 80mm" : "HP 149A",
      costPerPage: isEpson ? "Économique" : "Standard",
      printUsage: item.usage.includes("home") ? "Maison" : "Entreprise",
    };
  }

  if (item.categorySlug === "stockage") {
    return {
      ...common,
      storageType: "SSD",
      storageFormat: "M.2 2280",
      storageInterface: "Gen4",
      capacity: "1 To",
      readSpeed: "7 000 Mo/s",
      writeSpeed: "6 000 Mo/s",
      endurance: "600 TBW",
      heatsink: item.usage.includes("gaming") ? "Oui" : "Non",
      storageUsage: item.usage.includes("gaming") ? "Gaming" : "PC portable",
    };
  }

  if (item.categorySlug === "onduleurs-energie") {
    return {
      ...common,
      vaPower: name.includes("1600") ? "1600VA" : "1000VA",
      wattPower: name.includes("1600") ? "900W" : "600W",
      upsType: "Line-interactive",
      avr: "Oui",
      outlets: "6",
      autonomy: "10 min",
      replaceableBattery: "Oui",
      waveForm: name.includes("easy") ? "Simulée" : "Pure sine wave",
      energyUsage: item.usage.includes("enterprise") ? "Serveur" : "PC",
      surgeProtection: "Oui",
      energyFormat: name.includes("rack") ? "Rackable" : "Desktop",
    };
  }

  if (item.categorySlug === "telephonie") {
    return {
      ...common,
      voipType: "Téléphone IP",
      sipAccounts: "2",
      poe: "Oui",
      colorScreen: "Non",
      bluetooth: "Non",
      wifi: "Non",
      headsetCompatible: "Oui",
      voipUsage: item.usage.includes("administration") ? "Réception" : "Bureau",
    };
  }

  if (item.categorySlug === "logiciels") {
    return {
      ...common,
      licenseType: "Bureautique",
      licenseDuration: "1 an",
      usersCount: "1",
      devicesCount: "1",
      platform: "Windows",
      activation: "Clé digitale",
      softwareUsage: item.usage.includes("school") ? "École" : "Entreprise",
    };
  }

  return {
    ...common,
    accessoryType: item.categorySlug === "multimedia" ? "Casque" : item.categorySlug === "peripheriques" ? "Clavier" : "Câble",
    connectivity: item.categorySlug === "multimedia" ? "USB" : "RJ45",
    compatibility: item.usage.includes("enterprise") ? "PC" : "Réseau",
    cableCategory: "Cat6",
    shielding: "UTP",
    cableLength: "30m",
    color: "Noir",
    connectorType: "RJ45",
  };
}

export const catalogueProducts: CatalogProduct[] = [
  product({
    id: "hp-probook-450-g10",
    name: "HP ProBook 450 G10",
    slug: "hp-probook-450-g10",
    categorySlug: "pc-portables",
    brandSlug: "hp",
    image: catalogueImages.laptop,
    price: 6490,
    stockStatus: "in_stock",
    isPromo: false,
    isNew: true,
    isBestSeller: true,
    rating: 4.7,
    reviewCount: 64,
    specs: ["15.6 pouces FHD", "Core i5", "16 Go RAM", "512 Go SSD"],
    attributes: {
      processor: "Intel Core i5",
      processorGeneration: "13e génération",
      ram: "16 Go",
      storage: "512 Go SSD",
      graphics: "Intel Iris Xe",
      screenSize: "15.6 pouces",
      resolution: "Full HD",
      touch: "Non",
      os: "Windows 11 Pro",
      battery: "10 h",
      weight: "1.5 à 2 kg",
    },
    usage: ["office", "enterprise", "school"],
    warranty: "12 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-06-04",
    salesRank: 8,
  }),
  product({
    id: "dell-latitude-5440",
    name: "Dell Latitude 5440",
    slug: "dell-latitude-5440",
    categorySlug: "pc-portables",
    brandSlug: "dell",
    image: catalogueImages.laptop,
    price: 7490,
    oldPrice: 8190,
    stockStatus: "in_stock",
    isPromo: true,
    isNew: false,
    isBestSeller: true,
    rating: 4.6,
    reviewCount: 58,
    specs: ["14 pouces FHD", "Core i5", "16 Go", "512 Go SSD"],
    attributes: {
      processor: "Intel Core i5",
      processorGeneration: "12e génération",
      ram: "16 Go",
      storage: "512 Go SSD",
      graphics: "Intel Iris Xe",
      screenSize: "14 pouces",
      resolution: "Full HD",
      touch: "Non",
      os: "Windows 11 Pro",
      battery: "12 h",
      weight: "Moins de 1.5 kg",
    },
    usage: ["office", "enterprise", "administration"],
    warranty: "24 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-05-19",
    salesRank: 12,
  }),
  product({
    id: "lenovo-thinkpad-e16",
    name: "Lenovo ThinkPad E16",
    slug: "lenovo-thinkpad-e16",
    categorySlug: "pc-portables",
    brandSlug: "lenovo",
    image: catalogueImages.laptop,
    price: 8190,
    stockStatus: "on_order",
    isPromo: false,
    isNew: true,
    isBestSeller: false,
    rating: 4.5,
    reviewCount: 33,
    specs: ["16 pouces WUXGA", "Core i7", "16 Go", "1 To SSD"],
    attributes: {
      processor: "Intel Core i7",
      processorGeneration: "13e génération",
      ram: "16 Go",
      storage: "1 To SSD",
      graphics: "Intel Iris Xe",
      screenSize: "16 pouces",
      resolution: "WUXGA",
      touch: "Non",
      os: "Windows 11 Pro",
      battery: "10 h",
      weight: "1.5 à 2 kg",
    },
    usage: ["enterprise", "administration"],
    warranty: "24 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-06-10",
    salesRank: 31,
  }),
  product({
    id: "asus-tuf-a15",
    name: "ASUS TUF A15",
    slug: "asus-tuf-a15",
    categorySlug: "pc-portables",
    brandSlug: "asus",
    image: catalogueImages.laptop,
    price: 9990,
    oldPrice: 11490,
    stockStatus: "in_stock",
    isPromo: true,
    isNew: false,
    isBestSeller: true,
    rating: 4.8,
    reviewCount: 92,
    specs: ["15.6 pouces", "Ryzen 7", "32 Go", "NVIDIA RTX"],
    attributes: {
      processor: "AMD Ryzen 7",
      processorGeneration: "14e génération",
      ram: "32 Go",
      storage: "1 To SSD",
      graphics: "NVIDIA RTX",
      screenSize: "15.6 pouces",
      resolution: "2.5K",
      touch: "Non",
      os: "Windows 11 Home",
      battery: "8 h",
      weight: "Plus de 2 kg",
    },
    usage: ["gaming", "home"],
    warranty: "12 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-04-28",
    salesRank: 10,
  }),
  product({
    id: "hp-elitedesk-800-g9",
    name: "HP EliteDesk 800 G9",
    slug: "hp-elitedesk-800-g9",
    categorySlug: "pc-bureau",
    brandSlug: "hp",
    image: catalogueImages.desktop,
    price: 6990,
    stockStatus: "in_stock",
    isPromo: false,
    isNew: true,
    isBestSeller: false,
    rating: 4.5,
    reviewCount: 28,
    specs: ["Core i7", "16 Go RAM", "512 Go SSD", "Windows Pro"],
    attributes: {
      processor: "Intel Core i7",
      ram: "16 Go",
      storage: "512 Go SSD",
      os: "Windows 11 Pro",
    },
    usage: ["office", "enterprise", "administration"],
    warranty: "36 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-05-22",
    salesRank: 42,
  }),
  product({
    id: "dell-optiplex-7010",
    name: "Dell OptiPlex 7010",
    slug: "dell-optiplex-7010",
    categorySlug: "pc-bureau",
    brandSlug: "dell",
    image: catalogueImages.desktop,
    price: 6290,
    stockStatus: "on_order",
    isPromo: false,
    isNew: false,
    isBestSeller: true,
    rating: 4.6,
    reviewCount: 44,
    specs: ["Core i5", "16 Go", "512 Go SSD", "Format compact"],
    attributes: {
      processor: "Intel Core i5",
      ram: "16 Go",
      storage: "512 Go SSD",
      os: "Windows 11 Pro",
    },
    usage: ["office", "school", "administration"],
    warranty: "24 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-03-10",
    salesRank: 19,
  }),
  product({
    id: "lenovo-thinkcentre-m70q",
    name: "Lenovo ThinkCentre M70q",
    slug: "lenovo-thinkcentre-m70q",
    categorySlug: "pc-bureau",
    brandSlug: "lenovo",
    image: catalogueImages.desktop,
    price: 4890,
    oldPrice: 5290,
    stockStatus: "in_stock",
    isPromo: true,
    isNew: false,
    isBestSeller: false,
    rating: 4.4,
    reviewCount: 22,
    specs: ["Mini PC", "Core i5", "8 Go", "256 Go SSD"],
    attributes: {
      processor: "Intel Core i5",
      ram: "8 Go",
      storage: "256 Go SSD",
      os: "Windows 11 Pro",
    },
    usage: ["office", "school"],
    warranty: "12 mois",
    condition: "refurbished",
    deliveryAvailable: true,
    createdAt: "2026-02-18",
    salesRank: 54,
  }),
  product({
    id: "asus-expertcenter-aio",
    name: "ASUS ExpertCenter AIO",
    slug: "asus-expertcenter-aio",
    categorySlug: "all-in-one",
    brandSlug: "asus",
    image: catalogueImages.aio,
    price: 5890,
    stockStatus: "in_stock",
    isPromo: false,
    isNew: true,
    isBestSeller: false,
    rating: 4.4,
    reviewCount: 19,
    specs: ["23.8 pouces", "Core i5", "8 Go RAM", "SSD"],
    attributes: {
      processor: "Intel Core i5",
      ram: "8 Go",
      storage: "512 Go SSD",
      resolution: "Full HD",
      touch: "Non",
    },
    usage: ["office", "school"],
    warranty: "12 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-06-02",
    salesRank: 61,
  }),
  product({
    id: "lenovo-thinkcentre-aio",
    name: "Lenovo ThinkCentre AIO",
    slug: "lenovo-thinkcentre-aio",
    categorySlug: "all-in-one",
    brandSlug: "lenovo",
    image: catalogueImages.aio,
    price: 6490,
    stockStatus: "on_order",
    isPromo: false,
    isNew: false,
    isBestSeller: true,
    rating: 4.5,
    reviewCount: 26,
    specs: ["23.8 pouces", "Core i5", "16 Go", "512 Go SSD"],
    attributes: {
      processor: "Intel Core i5",
      ram: "16 Go",
      storage: "512 Go SSD",
      resolution: "Full HD",
      touch: "Oui",
    },
    usage: ["office", "enterprise"],
    warranty: "24 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-04-14",
    salesRank: 37,
  }),
  product({
    id: "tp-link-archer-ax55",
    name: "TP-Link Archer AX55",
    slug: "tp-link-archer-ax55",
    categorySlug: "reseaux-connectivite",
    brandSlug: "tp-link",
    image: catalogueImages.router,
    price: 890,
    oldPrice: 1090,
    stockStatus: "in_stock",
    isPromo: true,
    isNew: false,
    isBestSeller: true,
    rating: 4.8,
    reviewCount: 128,
    specs: ["Routeur", "Wi-Fi 6", "Gigabit", "Dual band"],
    attributes: {
      networkType: "Routeur",
      ports: "4 ports",
      poe: "Non",
      speed: "Gigabit",
      wifi: "Wi-Fi 6",
      band: "Dual band",
      rackable: "Non",
      manageable: "Non manageable",
      networkUsage: "Usage maison",
    },
    usage: ["home", "office"],
    warranty: "12 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-05-12",
    salesRank: 2,
  }),
  product({
    id: "tp-link-eap610",
    name: "TP-Link EAP610",
    slug: "tp-link-eap610",
    categorySlug: "reseaux-connectivite",
    brandSlug: "tp-link",
    image: catalogueImages.router,
    price: 1490,
    stockStatus: "in_stock",
    isPromo: false,
    isNew: true,
    isBestSeller: true,
    rating: 4.7,
    reviewCount: 46,
    specs: ["Point d'accès", "Wi-Fi 6", "PoE", "Plafond"],
    attributes: {
      networkType: "Point d'accès",
      ports: "4 ports",
      poe: "Oui",
      speed: "Gigabit",
      wifi: "Wi-Fi 6",
      band: "Dual band",
      rackable: "Non",
      manageable: "Manageable",
      networkUsage: "Usage pro",
    },
    usage: ["enterprise", "school", "office"],
    warranty: "24 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-06-08",
    salesRank: 14,
  }),
  product({
    id: "d-link-dgs-1210-24",
    name: "D-Link DGS-1210-24",
    slug: "d-link-dgs-1210-24",
    categorySlug: "reseaux-connectivite",
    brandSlug: "d-link",
    image: catalogueImages.switch,
    price: 5190,
    stockStatus: "in_stock",
    isPromo: false,
    isNew: false,
    isBestSeller: true,
    rating: 4.7,
    reviewCount: 31,
    specs: ["Switch", "24 ports", "Gigabit", "Manageable"],
    attributes: {
      networkType: "Switch",
      ports: "24 ports",
      poe: "Non",
      speed: "Gigabit",
      wifi: "Wi-Fi 5",
      band: "Dual band",
      rackable: "Oui",
      manageable: "Manageable",
      networkUsage: "Usage pro",
    },
    usage: ["enterprise", "administration"],
    warranty: "24 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-03-28",
    salesRank: 18,
  }),
  product({
    id: "d-link-dgs-1100-24pv2",
    name: "D-Link DGS-1100-24PV2",
    slug: "d-link-dgs-1100-24pv2",
    categorySlug: "reseaux-connectivite",
    brandSlug: "d-link",
    image: catalogueImages.switch,
    price: 2890,
    oldPrice: 3290,
    stockStatus: "on_order",
    isPromo: true,
    isNew: false,
    isBestSeller: false,
    rating: 4.6,
    reviewCount: 23,
    specs: ["Switch PoE", "24 ports", "Gigabit", "Rackable"],
    attributes: {
      networkType: "Switch",
      ports: "24 ports",
      poe: "Oui",
      speed: "Gigabit",
      wifi: "Wi-Fi 5",
      band: "Dual band",
      rackable: "Oui",
      manageable: "Manageable",
      networkUsage: "Usage pro",
    },
    usage: ["enterprise", "school"],
    warranty: "24 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-04-03",
    salesRank: 29,
  }),
  product({
    id: "network-rack-18u",
    name: "Baie réseau 18U 600x600",
    slug: "baie-reseau-18u-600x600",
    categorySlug: "baies-reseau-cablage",
    brandSlug: "d-link",
    image: catalogueImages.rack,
    price: 2490,
    stockStatus: "in_stock",
    isPromo: false,
    isNew: false,
    isBestSeller: true,
    rating: 4.5,
    reviewCount: 18,
    specs: ["18U", "600x600", "Rackable", "Ventilation"],
    attributes: {
      networkType: "Baie réseau",
      ports: "24 ports",
      poe: "Non",
      speed: "Gigabit",
      wifi: "Wi-Fi 5",
      band: "Dual band",
      rackable: "Oui",
      manageable: "Non manageable",
      networkUsage: "Usage pro",
    },
    usage: ["enterprise", "administration"],
    warranty: "12 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-01-24",
    salesRank: 21,
  }),
  product({
    id: "hikvision-ds-2cd2143g2",
    name: "Hikvision DS-2CD2143G2",
    slug: "hikvision-ds-2cd2143g2",
    categorySlug: "securite-cameras",
    brandSlug: "hikvision",
    image: catalogueImages.camera,
    price: 1290,
    stockStatus: "in_stock",
    isPromo: false,
    isNew: true,
    isBestSeller: true,
    rating: 4.8,
    reviewCount: 73,
    specs: ["Caméra IP", "4MP", "IR 30 m", "PoE"],
    attributes: {
      securityType: "Caméra IP",
      resolution: "4MP",
      nightVision: "30 m",
      placement: "Intérieur / extérieur",
      poe: "Oui",
      ptz: "Non",
      audio: "Oui",
      storage: "MicroSD",
      recorderCompatibility: "NVR",
    },
    usage: ["enterprise", "home", "school"],
    warranty: "24 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-06-01",
    salesRank: 7,
  }),
  product({
    id: "dahua-ipc-hdw1230",
    name: "Dahua IPC-HDW1230T1",
    slug: "dahua-ipc-hdw1230t1",
    categorySlug: "securite-cameras",
    brandSlug: "dahua",
    image: catalogueImages.camera,
    price: 649,
    oldPrice: 790,
    stockStatus: "in_stock",
    isPromo: true,
    isNew: false,
    isBestSeller: true,
    rating: 4.6,
    reviewCount: 42,
    specs: ["Caméra IP", "2MP", "IR 30 m", "PoE"],
    attributes: {
      securityType: "Caméra IP",
      resolution: "2MP",
      nightVision: "30 m",
      placement: "Intérieur / extérieur",
      poe: "Oui",
      ptz: "Non",
      audio: "Non",
      storage: "NVR",
      recorderCompatibility: "NVR",
    },
    usage: ["home", "office"],
    warranty: "12 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-02-11",
    salesRank: 11,
  }),
  product({
    id: "hikvision-nvr-8ch",
    name: "Hikvision NVR 8 canaux",
    slug: "hikvision-nvr-8-canaux",
    categorySlug: "securite-cameras",
    brandSlug: "hikvision",
    image: catalogueImages.camera,
    price: 2290,
    stockStatus: "on_order",
    isPromo: false,
    isNew: false,
    isBestSeller: false,
    rating: 4.5,
    reviewCount: 21,
    specs: ["NVR", "8 canaux", "PoE", "4K"],
    attributes: {
      securityType: "NVR",
      resolution: "8MP",
      nightVision: "100 m",
      placement: "Intérieur",
      poe: "Oui",
      ptz: "Oui",
      audio: "Oui",
      storage: "NVR",
      recorderCompatibility: "NVR",
    },
    usage: ["enterprise", "administration"],
    warranty: "24 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-01-09",
    salesRank: 46,
  }),
  product({
    id: "hp-laserjet-pro-4103fdw",
    name: "HP LaserJet Pro MFP 4103fdw",
    slug: "hp-laserjet-pro-mfp-4103fdw",
    categorySlug: "impression",
    brandSlug: "hp",
    image: catalogueImages.printer,
    price: 2690,
    stockStatus: "in_stock",
    isPromo: false,
    isNew: false,
    isBestSeller: true,
    rating: 4.5,
    reviewCount: 38,
    specs: ["Laser", "Monochrome", "Wi-Fi", "Recto-verso"],
    attributes: {
      printerType: "Laser",
      colorMode: "Monochrome",
      wifi: "Oui",
      duplex: "Oui",
      scanner: "Oui",
      adf: "Oui",
      paperFormat: "A4",
      printSpeed: "40 ppm",
      consumables: "Toner",
    },
    usage: ["office", "enterprise", "administration"],
    warranty: "12 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-03-15",
    salesRank: 17,
  }),
  product({
    id: "epson-ecotank-l3250",
    name: "Epson EcoTank L3250",
    slug: "epson-ecotank-l3250",
    categorySlug: "impression",
    brandSlug: "epson",
    image: catalogueImages.printer,
    price: 1890,
    oldPrice: 2190,
    stockStatus: "in_stock",
    isPromo: true,
    isNew: false,
    isBestSeller: true,
    rating: 4.6,
    reviewCount: 51,
    specs: ["Jet d'encre", "Couleur", "Wi-Fi", "Bouteilles"],
    attributes: {
      printerType: "Jet d'encre",
      colorMode: "Couleur",
      wifi: "Oui",
      duplex: "Non",
      scanner: "Oui",
      adf: "Non",
      paperFormat: "A4",
      printSpeed: "20 ppm",
      consumables: "Bouteilles d'encre",
    },
    usage: ["home", "office", "school"],
    warranty: "12 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-04-19",
    salesRank: 13,
  }),
  product({
    id: "epson-tm-t20",
    name: "Epson TM-T20",
    slug: "epson-tm-t20",
    categorySlug: "impression",
    brandSlug: "epson",
    image: catalogueImages.printer,
    price: 1490,
    stockStatus: "on_order",
    isPromo: false,
    isNew: true,
    isBestSeller: false,
    rating: 4.4,
    reviewCount: 17,
    specs: ["Thermique", "Ticket", "USB", "Commerce"],
    attributes: {
      printerType: "Thermique",
      colorMode: "Monochrome",
      wifi: "Non",
      duplex: "Non",
      scanner: "Non",
      adf: "Non",
      paperFormat: "Ticket",
      printSpeed: "30 ppm",
      consumables: "Rouleaux thermiques",
    },
    usage: ["office", "enterprise"],
    warranty: "12 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-06-09",
    salesRank: 48,
  }),
  product({
    id: "kingston-nvme-ssd-1tb",
    name: "Kingston NVMe SSD 1 To",
    slug: "kingston-nvme-ssd-1to",
    categorySlug: "stockage",
    brandSlug: "kingston",
    image: catalogueImages.ssd,
    price: 899,
    oldPrice: 1099,
    stockStatus: "in_stock",
    isPromo: true,
    isNew: false,
    isBestSeller: true,
    rating: 4.9,
    reviewCount: 88,
    specs: ["1 To", "PCIe 4.0", "NVMe", "PC portable"],
    attributes: {
      accessoryType: "SSD",
      connectivity: "USB-C",
      compatibility: "PC",
      capacity: "1 To",
      color: "Noir",
      brand: "Kingston",
    },
    usage: ["home", "office", "gaming"],
    warranty: "36 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-02-02",
    salesRank: 6,
  }),
  product({
    id: "logitech-h390",
    name: "Logitech H390 USB",
    slug: "logitech-h390-usb",
    categorySlug: "multimedia",
    brandSlug: "logitech",
    image: catalogueImages.headset,
    price: 390,
    stockStatus: "in_stock",
    isPromo: false,
    isNew: false,
    isBestSeller: true,
    rating: 4.4,
    reviewCount: 53,
    specs: ["Casque", "USB", "Micro", "Réduction bruit"],
    attributes: {
      accessoryType: "Casque",
      connectivity: "USB",
      compatibility: "PC",
      color: "Noir",
      brand: "Logitech",
    },
    usage: ["office", "school", "home"],
    warranty: "12 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-01-30",
    salesRank: 15,
  }),
  product({
    id: "yealink-sip-t31p",
    name: "Yealink SIP-T31P",
    slug: "yealink-sip-t31p",
    categorySlug: "telephonie",
    brandSlug: "yealink",
    image: catalogueImages.phone,
    price: 780,
    stockStatus: "in_stock",
    isPromo: false,
    isNew: false,
    isBestSeller: true,
    rating: 4.6,
    reviewCount: 29,
    specs: ["Téléphone IP", "PoE", "HD Voice", "Bureau"],
    attributes: {
      accessoryType: "Téléphone IP",
      connectivity: "RJ45",
      compatibility: "VoIP",
      poe: "Oui",
      color: "Noir",
      brand: "Yealink",
    },
    usage: ["office", "enterprise", "administration"],
    warranty: "12 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-02-20",
    salesRank: 16,
  }),
  product({
    id: "apc-back-ups-1000va",
    name: "APC Back-UPS 1000VA",
    slug: "apc-back-ups-1000va",
    categorySlug: "onduleurs-energie",
    brandSlug: "apc",
    image: catalogueImages.ups,
    price: 1890,
    stockStatus: "in_stock",
    isPromo: false,
    isNew: false,
    isBestSeller: true,
    rating: 4.7,
    reviewCount: 36,
    specs: ["1000VA", "Batterie", "Protection", "Bureau"],
    attributes: {
      accessoryType: "Onduleur",
      power: "100W",
      capacity: "1 To",
      compatibility: "PC",
      color: "Noir",
      brand: "APC",
    },
    usage: ["office", "enterprise"],
    warranty: "24 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-01-12",
    salesRank: 20,
  }),
  product({
    id: "apc-easy-ups-1600va",
    name: "APC Easy UPS 1600VA",
    slug: "apc-easy-ups-1600va",
    categorySlug: "onduleurs-energie",
    brandSlug: "apc",
    image: catalogueImages.ups,
    price: 2990,
    oldPrice: 3390,
    stockStatus: "on_order",
    isPromo: true,
    isNew: false,
    isBestSeller: false,
    rating: 4.6,
    reviewCount: 24,
    specs: ["1600VA", "Réseau", "Serveur", "Protection"],
    attributes: {
      accessoryType: "Onduleur",
      power: "100W",
      capacity: "1 To",
      compatibility: "Réseau",
      color: "Noir",
      brand: "APC",
    },
    usage: ["enterprise", "administration"],
    warranty: "24 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-03-02",
    salesRank: 38,
  }),
  product({
    id: "logitech-mx-keys-business",
    name: "Logitech MX Keys Business",
    slug: "logitech-mx-keys-business",
    categorySlug: "peripheriques",
    brandSlug: "logitech",
    image: catalogueImages.accessories,
    price: 1190,
    stockStatus: "in_stock",
    isPromo: false,
    isNew: true,
    isBestSeller: false,
    rating: 4.7,
    reviewCount: 40,
    specs: ["Clavier", "Bluetooth", "USB-C", "Bureautique"],
    attributes: {
      accessoryType: "Clavier",
      connectivity: "Bluetooth",
      compatibility: "PC",
      power: "30W",
      color: "Noir",
      brand: "Logitech",
    },
    usage: ["office", "enterprise", "home"],
    warranty: "12 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-06-12",
    salesRank: 25,
  }),
  product({
    id: "tp-link-cat6-cable-30m",
    name: "Câble réseau Cat6 UTP 30m",
    slug: "cable-reseau-cat6-utp-30m",
    categorySlug: "accessoires",
    brandSlug: "tp-link",
    image: catalogueImages.accessories,
    price: 299,
    oldPrice: 349,
    stockStatus: "in_stock",
    isPromo: true,
    isNew: false,
    isBestSeller: true,
    rating: 4.5,
    reviewCount: 76,
    specs: ["Cat6", "30 m", "RJ45", "Bleu"],
    attributes: {
      accessoryType: "Câble",
      connectivity: "RJ45",
      compatibility: "Réseau",
      cableLength: "30 m",
      color: "Bleu",
      brand: "TP-Link",
    },
    usage: ["home", "office", "enterprise"],
    warranty: "6 mois",
    condition: "new",
    deliveryAvailable: true,
    createdAt: "2026-01-18",
    salesRank: 9,
  }),
  product({
    id: "suite-bureautique-pro",
    name: "Suite bureautique Pro",
    slug: "suite-bureautique-pro",
    categorySlug: "logiciels",
    brandSlug: "hp",
    image: catalogueImages.software,
    price: 1290,
    stockStatus: "on_order",
    isPromo: false,
    isNew: true,
    isBestSeller: false,
    rating: 4.3,
    reviewCount: 14,
    specs: ["Licence", "Bureautique", "1 an", "Support"],
    attributes: {
      softwareType: "Bureautique",
      licenseDuration: "1 an",
      compatibility: "PC",
    },
    usage: ["office", "enterprise", "school", "administration"],
    warranty: "12 mois",
    condition: "new",
    deliveryAvailable: false,
    createdAt: "2026-06-15",
    salesRank: 65,
  }),
  product({
    id: "asus-vivobook-occasion",
    name: "ASUS VivoBook reconditionné",
    slug: "asus-vivobook-reconditionne",
    categorySlug: "pc-portables",
    brandSlug: "asus",
    image: catalogueImages.laptop,
    price: 3490,
    stockStatus: "out_of_stock",
    isPromo: false,
    isNew: false,
    isBestSeller: false,
    rating: 4.1,
    reviewCount: 12,
    specs: ["15.6 pouces", "Ryzen 5", "8 Go", "256 Go SSD"],
    attributes: {
      processor: "AMD Ryzen 5",
      processorGeneration: "12e génération",
      ram: "8 Go",
      storage: "256 Go SSD",
      graphics: "AMD Radeon",
      screenSize: "15.6 pouces",
      resolution: "Full HD",
      touch: "Non",
      os: "Windows 11 Home",
      battery: "8 h",
      weight: "1.5 à 2 kg",
    },
    usage: ["home", "school"],
    warranty: "6 mois",
    condition: "refurbished",
    deliveryAvailable: false,
    createdAt: "2026-01-02",
    salesRank: 88,
  }),
];

export const catalogueCategoryMap = catalogueCategories.reduce<
  Record<string, CatalogCategory>
>((accumulator, category) => {
  accumulator[category.slug] = category;
  return accumulator;
}, {});

export const filterableStockStatuses: StockStatus[] = [
  "in_stock",
  "on_order",
  "out_of_stock",
];

export function getCategoryBySlug(slug: string) {
  return catalogueCategoryMap[slug];
}

export function getProductsByCategorySlug(slug: string) {
  return catalogueProducts.filter((product) => product.categorySlug === slug);
}

export function getProductBySlug(slug: string) {
  return catalogueProducts.find((product) => product.slug === slug);
}
