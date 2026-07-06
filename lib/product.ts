import {
  catalogueCategoryMap,
  catalogueImages,
  catalogueProducts,
  getProductBySlug as getCatalogueProductBySlug,
} from "@/data/catalogue";
import {
  audienceLabels,
  conditionLabels,
  deliveryModeLabels,
  getBrandName,
  getCategoryName,
  purchaseTypeLabels,
  rangeLabels,
  stockLocationLabels,
  stockStatusLabels,
  usageLabels,
  warrantyProviderLabels,
} from "@/lib/catalogue";
import {
  buildProductWhatsappUrl,
  NAHDA_WHATSAPP_NUMBER,
} from "@/lib/contact";
import type { CatalogProduct } from "@/types/catalogue";

export { NAHDA_WHATSAPP_NUMBER };

type TechnicalItem = {
  label: string;
  value: string;
};

export type TechnicalSection = {
  title: string;
  items: TechnicalItem[];
};

export function getProductBySlug(slug: string) {
  return getCatalogueProductBySlug(slug);
}

export function getProductGallery(product: CatalogProduct) {
  const category = catalogueCategoryMap[product.categorySlug];
  const fallbackImages = [
    product.image,
    category?.bannerImage,
    category?.image,
    catalogueImages.accessories,
  ];

  return Array.from(
    new Set(fallbackImages.filter((image): image is string => Boolean(image))),
  ).slice(0, 4);
}

export function getProductHighlights(product: CatalogProduct) {
  const highlights = new Set<string>();

  product.specs.slice(0, 5).forEach((spec) => highlights.add(spec));
  highlights.add(stockStatusLabels[product.stockStatus]);
  highlights.add(product.warranty);

  if (product.b2bQuoteCompatible) {
    highlights.add("Compatible devis B2B");
  }

  return Array.from(highlights).slice(0, 7);
}

export function getProductDescription(product: CatalogProduct) {
  const categoryName = getCategoryName(product.categorySlug).toLowerCase();
  const usages = product.usage.map((usage) => usageLabels[usage]).join(", ");

  return `${product.name} est une solution ${categoryName} sélectionnée pour les besoins ${usages.toLowerCase()} au Maroc. Elle convient aux clients qui veulent un produit fiable, simple à déployer et accompagné par une équipe capable de confirmer la disponibilité, la livraison et les options de devis avant validation.`;
}

export function getProductRecommendedUsage(product: CatalogProduct) {
  return product.usage.map((usage) => usageLabels[usage]).join(", ");
}

export function getSimilarProducts(product: CatalogProduct, limit = 8) {
  return catalogueProducts
    .filter(
      (item) =>
        item.slug !== product.slug && item.categorySlug === product.categorySlug,
    )
    .sort((first, second) => second.rating - first.rating)
    .slice(0, limit);
}

export function getAccessoryProducts(product: CatalogProduct, limit = 8) {
  const accessoryCategories = new Set([
    "accessoires",
    "peripheriques",
    "stockage",
    "baies-reseau-cablage",
    "multimedia",
  ]);

  if (product.categorySlug === "reseaux-connectivite") {
    accessoryCategories.add("baies-reseau-cablage");
  }

  if (product.categorySlug === "pc-portables") {
    accessoryCategories.add("onduleurs-energie");
  }

  return catalogueProducts
    .filter(
      (item) =>
        item.slug !== product.slug && accessoryCategories.has(item.categorySlug),
    )
    .sort((first, second) => first.salesRank - second.salesRank)
    .slice(0, limit);
}

export function getRecentlyViewedProducts(product: CatalogProduct, limit = 8) {
  return catalogueProducts
    .filter((item) => item.slug !== product.slug)
    .sort((first, second) => first.salesRank - second.salesRank)
    .slice(0, limit);
}

export function buildWhatsappUrl(
  product: CatalogProduct,
  productUrl: string,
  whatsappNumber?: string,
) {
  return buildProductWhatsappUrl({
    name: product.name,
    slug: product.slug,
    path: productUrl,
    whatsappNumber,
  });
}

export function getTechnicalSections(product: CatalogProduct): TechnicalSection[] {
  return [
    section("Général", [
      item("SKU", product.id.toUpperCase()),
      item("Marque", getBrandName(product.brandSlug)),
      item("Catégorie", getCategoryName(product.categorySlug)),
      item("Série", product.series),
      item("Gamme", rangeLabels[product.range]),
      item("État", conditionLabels[product.condition]),
      item("Stock", stockStatusLabels[product.stockStatus]),
      item("Dépôt", stockLocationLabels[product.stockLocation]),
      item("Usage recommandé", getProductRecommendedUsage(product)),
      item("Destiné à", product.audiences.map((audience) => audienceLabels[audience])),
      item(
        "Type d'achat",
        product.purchaseTypes.map((purchaseType) => purchaseTypeLabels[purchaseType]),
      ),
    ]),
    section("Performance", [
      attr(product, "processor", "Processeur"),
      attr(product, "cpuModel", "Modèle CPU"),
      attr(product, "exactCpu", "CPU exact"),
      attr(product, "processorGeneration", "Génération CPU"),
      attr(product, "cpuSeries", "Série CPU"),
      attr(product, "cpuCores", "Nombre de coeurs"),
      attr(product, "graphics", "Carte graphique"),
      attr(product, "dedicatedGpu", "GPU dédié"),
      attr(product, "chipsetGeneration", "Chipset / génération"),
    ]),
    section("Mémoire & stockage", [
      attr(product, "ram", "RAM"),
      attr(product, "ramExpandable", "RAM extensible"),
      attr(product, "maxRam", "RAM maximale"),
      attr(product, "ramSlots", "Slots RAM"),
      attr(product, "storage", "Stockage"),
      attr(product, "storageCapacity", "Capacité"),
      attr(product, "storageType", "Type stockage"),
      attr(product, "storageFormat", "Format stockage"),
      attr(product, "storageInterface", "Interface"),
      attr(product, "ssdSlots", "Slots SSD"),
      attr(product, "storageSlots", "Slots stockage"),
      attr(product, "readSpeed", "Vitesse lecture"),
      attr(product, "writeSpeed", "Vitesse écriture"),
      attr(product, "endurance", "Endurance"),
      attr(product, "heatsink", "Dissipateur"),
    ]),
    section("Écran", [
      attr(product, "screenSize", "Taille écran"),
      attr(product, "aioScreenSize", "Taille écran All-in-One"),
      attr(product, "resolution", "Résolution"),
      attr(product, "panelType", "Type écran"),
      attr(product, "brightness", "Luminosité"),
      attr(product, "colorCoverage", "Couverture couleur"),
      attr(product, "touch", "Tactile"),
      attr(product, "screenIncluded", "Écran inclus"),
    ]),
    section("Réseau", [
      attr(product, "networkType", "Type produit"),
      attr(product, "ports", "Ports"),
      attr(product, "rj45Ports", "Ports RJ45"),
      attr(product, "sfpPorts", "Ports SFP / SFP+"),
      attr(product, "speed", "Vitesse"),
      attr(product, "portSpeed", "Vitesse ports"),
      attr(product, "poe", "PoE"),
      attr(product, "poeType", "Type PoE"),
      attr(product, "poeBudget", "Budget PoE"),
      attr(product, "poePowerPerPort", "Puissance PoE par port"),
      attr(product, "wifi", "Wi-Fi"),
      attr(product, "wifiStandard", "Standard Wi-Fi"),
      attr(product, "band", "Bandes"),
      attr(product, "wifiBands", "Bandes Wi-Fi"),
      attr(product, "manageable", "Manageable"),
      attr(product, "manageableBool", "Manageable"),
      attr(product, "managementLevel", "Niveau management"),
      attr(product, "rackable", "Rackable"),
      attr(product, "cloudManaged", "Cloud managed"),
      attr(product, "controllerCompatibility", "Contrôleur compatible"),
      attr(product, "networkAudience", "Usage réseau"),
      attr(product, "vpn", "VPN"),
      attr(product, "cellular", "4G/5G"),
    ]),
    section("Sécurité & caméras", [
      attr(product, "securityType", "Type"),
      attr(product, "cameraResolution", "Résolution caméra"),
      attr(product, "lens", "Objectif"),
      attr(product, "viewingAngle", "Angle de vue"),
      attr(product, "nightVisionDistance", "Vision nocturne"),
      attr(product, "cameraPlacement", "Installation"),
      attr(product, "protectionIndex", "Indice protection"),
      attr(product, "vandalProof", "Anti-vandale"),
      attr(product, "ptz", "PTZ"),
      attr(product, "audioType", "Audio"),
      attr(product, "detection", "Détection"),
      attr(product, "compression", "Compression"),
      attr(product, "videoStorage", "Stockage vidéo"),
      attr(product, "channels", "Canaux NVR/DVR"),
      attr(product, "brandCompatibility", "Compatibilité marque"),
    ]),
    section("Impression", [
      attr(product, "printerType", "Type imprimante"),
      attr(product, "printColorMode", "Couleur / monochrome"),
      attr(product, "functions", "Fonctions"),
      attr(product, "ethernet", "Ethernet"),
      attr(product, "usb", "USB"),
      attr(product, "autoDuplex", "Recto-verso automatique"),
      attr(product, "scanner", "Scanner"),
      attr(product, "adf", "ADF"),
      attr(product, "printFormat", "Format papier"),
      attr(product, "printSpeedPpm", "Vitesse impression"),
      attr(product, "dpi", "Résolution"),
      attr(product, "monthlyDuty", "Cycle mensuel"),
      attr(product, "consumableType", "Consommable"),
      attr(product, "consumableReference", "Référence consommable"),
      attr(product, "costPerPage", "Coût par page"),
    ]),
    section("Connectique", [
      attr(product, "portsDetailed", "Connectique détaillée"),
      attr(product, "connectivity", "Connectique"),
      attr(product, "connectorType", "Connecteur"),
      attr(product, "bluetooth", "Bluetooth"),
      attr(product, "webcam", "Webcam"),
      attr(product, "securityFeatures", "Sécurité"),
      attr(product, "keyboard", "Clavier"),
      attr(product, "chargerType", "Chargeur"),
      attr(product, "chargerPower", "Puissance chargeur"),
      attr(product, "battery", "Autonomie"),
      attr(product, "batteryWh", "Batterie"),
      attr(product, "weight", "Poids"),
    ]),
    section("Garantie & service", [
      item("Garantie", product.warranty),
      item("Origine garantie", warrantyProviderLabels[product.warrantyProvider]),
      item(
        "Livraison",
        product.deliveryModes.map((deliveryMode) => deliveryModeLabels[deliveryMode]),
      ),
      item("Devis B2B", product.b2bQuoteCompatible ? "Oui" : "Non"),
      attr(product, "refurbGrade", "Grade occasion/reconditionné"),
      attr(product, "batteryHealth", "État batterie"),
      attr(product, "cosmeticCondition", "État esthétique"),
    ]),
  ].filter((group) => group.items.length > 0);
}

function section(title: string, items: Array<TechnicalItem | null>) {
  return {
    title,
    items: items.filter((entry): entry is TechnicalItem => Boolean(entry)),
  };
}

function attr(product: CatalogProduct, key: string, label: string) {
  const value = product.attributes[key];

  if (value === undefined || value === null || value === "") {
    return null;
  }

  return item(label, value);
}

function item(label: string, value: string | number | boolean | string[]) {
  const formatted = formatAttributeValue(value);

  if (!formatted) {
    return null;
  }

  return {
    label,
    value: formatted,
  };
}

function formatAttributeValue(value: string | number | boolean | string[]) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "Oui" : "Non";
  }

  return String(value);
}
