import { ProductCondition, ProductStatus, Prisma } from "@prisma/client";
import {
  catalogueImages,
  catalogueProducts,
} from "@/data/catalogue";
import {
  getBrandName,
  getCategoryName,
  toProductCardProduct,
} from "@/lib/catalogue";
import type {
  AttributeValue,
  CatalogProduct,
  ProductAudience,
  ProductCondition as UiProductCondition,
  ProductRange,
  ProductUsage,
  PurchaseType,
  StockLocation,
  StockStatus,
  WarrantyProvider,
} from "@/types/catalogue";
import type { Product } from "@/types/product";

export const publicProductInclude = {
  brand: true,
  category: true,
  images: { orderBy: { order: "asc" } },
  stocks: { include: { depot: true } },
  attributeValues: {
    include: {
      attribute: true,
      option: true,
    },
  },
} satisfies Prisma.ProductInclude;

export type PrismaPublicProduct = Prisma.ProductGetPayload<{
  include: typeof publicProductInclude;
}>;

const conditionMap: Record<ProductCondition, UiProductCondition> = {
  NEW: "new",
  USED: "used",
  REFURBISHED: "refurbished",
};

export function prismaProductToCatalogProduct(
  product: PrismaPublicProduct,
  options: { includeDetails?: boolean } = {},
): CatalogProduct {
  const attributes = buildAttributes(product);
  const price = Number(product.promoPrice ?? product.priceSell);
  const oldPrice = product.promoPrice ? Number(product.priceSell) : undefined;
  const stockQuantity = product.stocks.reduce(
    (sum, stock) => sum + stock.quantity,
    0,
  );
  const stockStatus = mapStockStatus(product);
  const usage = inferUsage(product, attributes);
  const warranty = `${product.warrantyMonths || 12} mois`;
  const series = getAttributeString(attributes, "series") ?? inferSeries(product);
  const range = inferRange(product, price);
  const deliveryAvailable = stockStatus !== "out_of_stock";
  const categorySlug = product.category.slug;
  const fallback = catalogueProducts.find((item) => item.slug === product.slug);

  return {
    id: product.sku,
    name: product.name,
    slug: product.slug,
    ...(options.includeDetails
      ? {
          description: product.description,
          shortDescription: product.shortDescription ?? undefined,
          images: product.images.map((image) => image.url),
          technicalSpecs: lireCaracteristiques(product.technicalDescription),
        }
      : {}),
    categorySlug,
    categoryName: product.category.name,
    brandSlug: product.brand.slug,
    brandName: product.brand.name,
    brandLogoPath: product.brand.logoPath ?? undefined,
    brandIsOfficialAsset: product.brand.isOfficialAsset,
    image:
      product.images[0]?.url ??
      fallback?.image ??
      imageForProductCategory(categorySlug),
    price,
    oldPrice,
    stockStatus,
    stockQuantity,
    isPromo: product.isPromo || Boolean(product.promoPrice),
    isNew: product.isNew,
    isBestSeller: product.isBestSeller,
    // 0 quand le produit n'a aucun avis approuve : l'ancien repli sur 4.6
    // affichait une note inventee, et le nombre d'avis annonce ne
    // correspondait a rien de reel.
    rating: Number(product.rating ?? 0),
    reviewCount: product.reviewCount,
    specs: buildSpecs(product, attributes, fallback),
    attributes,
    usage,
    warranty,
    warrantyProvider: inferWarrantyProvider(product.warrantyMonths),
    condition: conditionMap[product.condition],
    deliveryAvailable,
    stockLocation: inferStockLocation(product, stockStatus),
    deliveryModes: deliveryAvailable ? ["delivery", "pickup"] : ["pickup"],
    purchaseTypes: inferPurchaseTypes(product, price),
    audiences: inferAudiences(usage, price),
    range,
    series,
    b2bQuoteCompatible:
      price >= 1000 ||
      usage.includes("enterprise") ||
      usage.includes("administration"),
    isRecommended: product.isRecommended || Number(product.rating ?? 0) >= 4.6,
    createdAt: product.createdAt.toISOString(),
    salesRank: product.isBestSeller ? 1 : fallback?.salesRank ?? 50,
  };
}

export function prismaProductToProductCard(product: PrismaPublicProduct): Product {
  return toProductCardProduct(prismaProductToCatalogProduct(product));
}

// Les caracteristiques constructeur sont stockees en JSON dans
// technicalDescription : le champ est libre, et un back-office peut y avoir
// saisi du texte a la main. On ne rend donc quelque chose que si la forme
// attendue est bien la.
function lireCaracteristiques(
  brut: string | null,
): { groupe: string; lignes: [string, string][] }[] | undefined {
  if (!brut?.trim().startsWith("[")) return undefined;

  try {
    const donnees: unknown = JSON.parse(brut);

    if (!Array.isArray(donnees)) return undefined;

    const groupes = donnees.flatMap((entree) => {
      if (typeof entree !== "object" || entree === null) return [];

      const { groupe, lignes } = entree as { groupe?: unknown; lignes?: unknown };

      if (typeof groupe !== "string" || !Array.isArray(lignes)) return [];

      const paires = lignes.flatMap((ligne) =>
        Array.isArray(ligne) && ligne.length >= 2
          ? [[String(ligne[0]), String(ligne[1])] as [string, string]]
          : [],
      );

      return paires.length > 0 ? [{ groupe, lignes: paires }] : [];
    });

    return groupes.length > 0 ? groupes : undefined;
  } catch {
    return undefined;
  }
}

function buildAttributes(product: PrismaPublicProduct) {
  const attributes: Record<string, AttributeValue> = {};

  for (const value of product.attributeValues) {
    const key = value.attribute.slug;
    const optionValue = value.option?.value;
    const parsedValue =
      optionValue ??
      value.valueString ??
      value.valueNumber ??
      value.valueBoolean ??
      value.valueJson ??
      undefined;

    if (parsedValue === undefined || parsedValue === null) continue;
    const normalizedValue = normalizeAttributeValue(parsedValue);

    if (normalizedValue === undefined) continue;

    const current = attributes[key];
    if (current === undefined) {
      attributes[key] = normalizedValue;
      continue;
    }

    attributes[key] = Array.isArray(current)
      ? [...current, String(normalizedValue)]
      : [String(current), String(normalizedValue)];
  }

  return attributes;
}

function normalizeAttributeValue(
  value: Prisma.JsonValue | Prisma.Decimal | string | number | boolean,
): AttributeValue | undefined {
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }

  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }

  if (value === null) {
    return undefined;
  }

  return value;
}

function mapStockStatus(product: PrismaPublicProduct): StockStatus {
  // Le statut decide par l'administrateur prime sur le compteur de stock.
  // Sans cette garde, un produit marque en rupture depuis le back-office
  // restait "en stock" sur le site tant qu'un depot affichait une quantite :
  // le client pouvait l'ajouter au panier et ne decouvrait le refus qu'a la
  // validation de sa commande, ou createWebsiteOrder le rejette.
  if (product.status === ProductStatus.OUT_OF_STOCK) return "out_of_stock";
  if (product.status === ProductStatus.ON_ORDER) return "on_order";

  // Seuls les depots actifs comptent : du stock immobilise dans un depot
  // desactive n'est pas vendable, et reserveStockForOrderItems l'ignore deja.
  const sellableStock = product.stocks.reduce(
    (sum, stock) => (stock.depot.isActive ? sum + stock.quantity : sum),
    0,
  );

  return sellableStock > 0 ? "in_stock" : "out_of_stock";
}

function inferStockLocation(
  product: PrismaPublicProduct,
  stockStatus: StockStatus,
): StockLocation {
  if (stockStatus === "on_order") return "on_order";

  const bestStock = [...product.stocks].sort(
    (first, second) => second.quantity - first.quantity,
  )[0];

  if (bestStock?.depot.type === "SHOWROOM") return "showroom";

  return "main_depot";
}

function buildSpecs(
  product: PrismaPublicProduct,
  attributes: Record<string, AttributeValue>,
  fallback?: CatalogProduct,
) {
  const values = [
    getAttributeString(attributes, "screenSize") ??
      getAttributeString(attributes, "aioScreenSize"),
    getAttributeString(attributes, "processor") ??
      getAttributeString(attributes, "exactCpu") ??
      getAttributeString(attributes, "networkType") ??
      getAttributeString(attributes, "printerType") ??
      getAttributeString(attributes, "storageType"),
    getAttributeString(attributes, "ram"),
    getAttributeString(attributes, "storage") ??
      getAttributeString(attributes, "storageCapacity"),
    getAttributeString(attributes, "speed") ??
      getAttributeString(attributes, "portSpeed") ??
      getAttributeString(attributes, "cameraResolution"),
  ].filter(Boolean) as string[];

  if (values.length > 0) return Array.from(new Set(values)).slice(0, 5);
  if (fallback?.specs.length) return fallback.specs;

  // Le resume redige separe ses caracteristiques par une puce ; l'ancien
  // decoupage sur la seule virgule rendait donc toute la ligne en un seul bloc,
  // et "Ecran 24 pouces • Definition FHD • Connectique HDMI, VGA" s'affichait
  // comme une unique etiquette illisible.
  return product.shortDescription
    ? product.shortDescription
        .split(/\s*•\s*/)
        .flatMap((bloc) => (bloc.includes("•") ? [] : [bloc]))
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 5)
    : [getBrandName(product.brand.slug), getCategoryName(product.category.slug)];
}

function inferUsage(
  product: PrismaPublicProduct,
  attributes: Record<string, AttributeValue>,
): ProductUsage[] {
  const categorySlug = product.category.slug;
  const text = `${product.name} ${product.shortDescription ?? ""} ${product.description ?? ""}`.toLowerCase();
  const usage = new Set<ProductUsage>();

  if (text.includes("gaming")) usage.add("gaming");
  if (text.includes("école") || text.includes("ecole")) usage.add("school");
  if (text.includes("administration")) usage.add("administration");
  if (text.includes("maison") || categorySlug === "accessoires") usage.add("home");
  if (text.includes("bureau") || categorySlug.includes("impression")) usage.add("office");
  if (
    text.includes("entreprise") ||
    text.includes("professionnel") ||
    categorySlug.includes("reseaux") ||
    categorySlug.includes("securite")
  ) {
    usage.add("enterprise");
  }

  const specificUsage =
    getAttributeString(attributes, "networkAudience") ??
    getAttributeString(attributes, "desktopUsage") ??
    getAttributeString(attributes, "printUsage") ??
    getAttributeString(attributes, "storageUsage");

  if (specificUsage?.toLowerCase().includes("maison")) usage.add("home");
  if (specificUsage?.toLowerCase().includes("école")) usage.add("school");
  if (specificUsage?.toLowerCase().includes("gaming")) usage.add("gaming");
  if (specificUsage?.toLowerCase().includes("entreprise")) usage.add("enterprise");

  if (usage.size === 0) usage.add("office");

  return Array.from(usage);
}

function inferAudiences(usage: ProductUsage[], price: number): ProductAudience[] {
  const audiences = new Set<ProductAudience>();

  if (usage.includes("home") || usage.includes("gaming")) audiences.add("individual");
  if (usage.includes("office") || usage.includes("enterprise")) audiences.add("company");
  if (usage.includes("school")) audiences.add("school");
  if (usage.includes("administration")) audiences.add("administration");
  if (price >= 300) audiences.add("reseller");

  return audiences.size ? Array.from(audiences) : ["company"];
}

function inferPurchaseTypes(
  product: PrismaPublicProduct,
  price: number,
): PurchaseType[] {
  return [
    "direct",
    ...(price >= 1000 ? ["quote" as const] : []),
    ...(product.isPromo ? ["bundle" as const] : []),
  ];
}

function inferRange(product: PrismaPublicProduct, price: number): ProductRange {
  if (price >= 8000) return "premium";
  if (price >= 3000 || product.category.slug.includes("reseaux")) return "professional";
  if (price >= 900) return "mid";

  return "entry";
}

function inferWarrantyProvider(months: number): WarrantyProvider {
  return months >= 24 ? "supplier" : "store";
}

function inferSeries(product: PrismaPublicProduct) {
  const name = product.name.toLowerCase();

  if (name.includes("latitude")) return "Latitude";
  if (name.includes("thinkpad")) return "ThinkPad";
  if (name.includes("elitebook")) return "EliteBook";
  if (name.includes("probook")) return "ProBook";
  if (name.includes("tuf")) return "TUF";
  if (name.includes("omada")) return "Omada";
  if (name.includes("unifi")) return "UniFi";
  if (name.includes("jetstream")) return "JetStream";
  if (name.includes("laserjet")) return "LaserJet";

  return "Professionnel";
}

function imageForProductCategory(categorySlug: string) {
  if (categorySlug.includes("portable")) return catalogueImages.laptop;
  if (categorySlug.includes("bureau")) return catalogueImages.desktop;
  if (categorySlug.includes("all-in-one")) return catalogueImages.aio;
  if (categorySlug.includes("reseaux")) return catalogueImages.router;
  if (categorySlug.includes("securite")) return catalogueImages.camera;
  if (categorySlug.includes("impression")) return catalogueImages.printer;
  if (categorySlug.includes("stockage")) return catalogueImages.ssd;
  if (categorySlug.includes("onduleurs")) return catalogueImages.ups;
  if (categorySlug.includes("telephonie")) return catalogueImages.phone;
  if (categorySlug.includes("baies")) return catalogueImages.rack;
  if (categorySlug.includes("multimedia")) return catalogueImages.headset;
  if (categorySlug.includes("logiciels")) return catalogueImages.software;

  return catalogueImages.accessories;
}

function getAttributeString(
  attributes: Record<string, AttributeValue>,
  key: string,
) {
  const value = attributes[key];

  if (Array.isArray(value)) return value.join(", ");
  if (value === undefined || value === null) return undefined;

  return String(value);
}
