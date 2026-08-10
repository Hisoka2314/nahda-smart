import { PrismaPg } from "@prisma/adapter-pg";
import {
  CustomerLevel,
  CustomerSource,
  CustomerType,
  DeliveryMethod,
  DepotType,
  FilterInputType,
  OrderStatus,
  PaymentMethod,
  PrismaClient,
  ProductCondition,
  ProductStatus,
  QuoteStatus,
  StockMovementType,
  SupplierType,
} from "@prisma/client";
import {
  advancedCategorySpecificFilters,
  catalogueCategories,
  catalogueProducts,
  categorySpecificFilters,
  commonAttributeFilters,
} from "../data/catalogue";
import { brandSeeds } from "../data/brands";
import type { AttributeFilter, CatalogProduct } from "../types/catalogue";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL est requis pour exécuter le seed Prisma.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const adminEmail = process.env.ADMIN_EMAIL ?? "admin@nahdasmart.ma";
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
const placeholderAdminHash = "$2b$12$replace-with-a-secure-hash";
const hasUsableAdminHash =
  typeof adminPasswordHash === "string" &&
  adminPasswordHash.trim().length > 24 &&
  adminPasswordHash !== placeholderAdminHash &&
  adminPasswordHash.startsWith("scrypt:");

const stockByStatus: Record<CatalogProduct["stockStatus"], number> = {
  in_stock: 12,
  on_order: 0,
  out_of_stock: 0,
};

const conditionMap: Record<CatalogProduct["condition"], ProductCondition> = {
  new: ProductCondition.NEW,
  used: ProductCondition.USED,
  refurbished: ProductCondition.REFURBISHED,
};

const statusMap: Record<CatalogProduct["stockStatus"], ProductStatus> = {
  in_stock: ProductStatus.PUBLISHED,
  on_order: ProductStatus.ON_ORDER,
  out_of_stock: ProductStatus.OUT_OF_STOCK,
};

async function main() {
  const [mainDepot, showroom] = await Promise.all([
    prisma.depot.upsert({
      where: { id: "seed-main-depot" },
      update: {
        name: "Dépôt principal",
        type: DepotType.MAIN_DEPOT,
        address: "Casablanca, zone logistique placeholder",
        isActive: true,
      },
      create: {
        id: "seed-main-depot",
        name: "Dépôt principal",
        type: DepotType.MAIN_DEPOT,
        address: "Casablanca, zone logistique placeholder",
        managerName: "Responsable stock",
      },
    }),
    prisma.depot.upsert({
      where: { id: "seed-showroom" },
      update: {
        name: "Showroom",
        type: DepotType.SHOWROOM,
        address: "Casablanca, Maarif",
        isActive: true,
      },
      create: {
        id: "seed-showroom",
        name: "Showroom",
        type: DepotType.SHOWROOM,
        address: "Casablanca, Maarif",
        managerName: "Responsable showroom",
      },
    }),
  ]);

  const admin = hasUsableAdminHash
    ? await prisma.adminUser.upsert({
        where: { email: adminEmail },
        update: {
          name: "Admin Nahda Smart",
          role: "SUPER_ADMIN",
          active: true,
          passwordHash: adminPasswordHash,
        },
        create: {
          name: "Admin Nahda Smart",
          email: adminEmail,
          passwordHash: adminPasswordHash,
          role: "SUPER_ADMIN",
        },
      })
    : null;

  const brandBySlug = new Map<string, string>();
  for (const brand of brandSeeds) {
    const saved = await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {
        name: brand.name,
        logoPath: null,
        isActive: true,
        isOfficialAsset: false,
      },
      create: {
        name: brand.name,
        slug: brand.slug,
        logoPath: null,
        isActive: true,
        isOfficialAsset: false,
      },
    });
    brandBySlug.set(saved.slug, saved.id);
  }

  const categoryBySlug = new Map<string, string>();
  for (const [index, category] of catalogueCategories.entries()) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        bannerUrl: category.bannerImage,
        order: index + 1,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        bannerUrl: category.bannerImage,
        order: index + 1,
        isActive: true,
      },
    });
    categoryBySlug.set(saved.slug, saved.id);
  }

  const filterAttributesByCategory = await seedFilters(categoryBySlug);
  const productBySlug = await seedProducts(
    brandBySlug,
    categoryBySlug,
    filterAttributesByCategory,
    mainDepot.id,
    showroom.id,
  );

  const customers = await seedCustomers();
  await seedOrders(customers, productBySlug);
  await seedQuotes(customers, productBySlug);
  await seedSuppliers(productBySlug);
  await seedBanners();

  await prisma.adminLog.deleteMany({
    where: {
      action: "SEED_DATABASE",
      entity: "SYSTEM",
      NOT: { id: "seed-admin-log" },
    },
  });

  await prisma.adminLog.upsert({
    where: { id: "seed-admin-log" },
    update: {
      adminId: admin?.id,
      action: "SEED_DATABASE",
      entity: "SYSTEM",
      metadata: {
        source: "prisma/seed.ts",
        note: "Seed initial Nahda Smart backend foundation.",
        adminSeeded: Boolean(admin),
      },
    },
    create: {
      id: "seed-admin-log",
      adminId: admin?.id,
      action: "SEED_DATABASE",
      entity: "SYSTEM",
      metadata: {
        source: "prisma/seed.ts",
        note: "Seed initial Nahda Smart backend foundation.",
        adminSeeded: Boolean(admin),
      },
    },
  });

  if (!admin) {
    console.warn(
      "ADMIN_PASSWORD_HASH absent ou placeholder : aucun AdminUser seedé.",
    );
  }
}

async function seedFilters(categoryBySlug: Map<string, string>) {
  const result = new Map<string, Map<string, string>>();

  for (const category of catalogueCategories) {
    const categoryId = categoryBySlug.get(category.slug);
    if (!categoryId) continue;

    const primaryFilters = uniqueFilters([
      ...(categorySpecificFilters[category.slug] ?? []),
      ...commonAttributeFilters,
    ]);
    const advancedFilters = uniqueFilters(
      advancedCategorySpecificFilters[category.slug] ?? [],
      new Set(primaryFilters.map((filter) => filter.key)),
    );

    const primaryGroup = await upsertFilterGroup({
      categoryId,
      name: "Filtres principaux",
      slug: "filtres-principaux",
      order: 1,
      defaultOpen: true,
      isAdvanced: false,
    });
    const advancedGroup = await upsertFilterGroup({
      categoryId,
      name: "Filtres avancés",
      slug: "filtres-avances",
      order: 2,
      defaultOpen: false,
      isAdvanced: true,
    });

    const attrMap = new Map<string, string>();
    for (const [index, filter] of primaryFilters.entries()) {
      const saved = await upsertFilterAttribute({
        filter,
        categoryId,
        groupId: primaryGroup.id,
        order: index + 1,
        isAdvanced: false,
      });
      attrMap.set(saved.slug, saved.id);
    }

    for (const [index, filter] of advancedFilters.entries()) {
      const saved = await upsertFilterAttribute({
        filter,
        categoryId,
        groupId: advancedGroup.id,
        order: index + 1,
        isAdvanced: true,
      });
      attrMap.set(saved.slug, saved.id);
    }

    result.set(category.slug, attrMap);
  }

  return result;
}

async function upsertFilterGroup(input: {
  categoryId: string;
  name: string;
  slug: string;
  order: number;
  defaultOpen: boolean;
  isAdvanced: boolean;
}) {
  return prisma.filterGroup.upsert({
    where: {
      categoryId_slug: {
        categoryId: input.categoryId,
        slug: input.slug,
      },
    },
    update: {
      name: input.name,
      order: input.order,
      defaultOpen: input.defaultOpen,
      isAdvanced: input.isAdvanced,
      visible: true,
    },
    create: {
      categoryId: input.categoryId,
      name: input.name,
      slug: input.slug,
      order: input.order,
      defaultOpen: input.defaultOpen,
      isAdvanced: input.isAdvanced,
      visible: true,
    },
  });
}

async function upsertFilterAttribute(input: {
  filter: AttributeFilter;
  categoryId: string;
  groupId: string;
  order: number;
  isAdvanced: boolean;
}) {
  const type = inferFilterType(input.filter);
  const saved = await prisma.filterAttribute.upsert({
    where: {
      categoryId_slug: {
        categoryId: input.categoryId,
        slug: input.filter.key,
      },
    },
    update: {
      groupId: input.groupId,
      label: input.filter.label,
      type,
      searchable: Boolean(input.filter.searchable),
      filterable: true,
      visible: true,
      order: input.order,
    },
    create: {
      categoryId: input.categoryId,
      groupId: input.groupId,
      label: input.filter.label,
      slug: input.filter.key,
      type,
      searchable: Boolean(input.filter.searchable),
      filterable: true,
      visible: true,
      order: input.order,
    },
  });

  for (const [index, option] of input.filter.options.entries()) {
    await prisma.filterOption.upsert({
      where: {
        attributeId_value: {
          attributeId: saved.id,
          value: option.value,
        },
      },
      update: {
        label: option.label,
        order: option.order ?? index + 1,
        visible: true,
      },
      create: {
        attributeId: saved.id,
        label: option.label,
        value: option.value,
        order: option.order ?? index + 1,
        visible: true,
      },
    });
  }

  return saved;
}

async function seedProducts(
  brandBySlug: Map<string, string>,
  categoryBySlug: Map<string, string>,
  filterAttributesByCategory: Map<string, Map<string, string>>,
  mainDepotId: string,
  showroomId: string,
) {
  const productBySlug = new Map<string, string>();

  for (const product of catalogueProducts) {
    const brandId = brandBySlug.get(product.brandSlug);
    const categoryId = categoryBySlug.get(product.categorySlug);

    if (!brandId || !categoryId) continue;

    const regularPrice = product.oldPrice ?? product.price;
    const promoPrice = product.isPromo ? product.price : null;
    const priceBuy = Math.round(product.price * 0.78);

    const saved = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        sku: createSku(product),
        brandId,
        categoryId,
        shortDescription: product.specs.join(" • "),
        description: buildProductDescription(product),
        technicalDescription: product.specs.join("\n"),
        priceBuy,
        priceSell: regularPrice,
        promoPrice,
        margin: regularPrice - priceBuy,
        warrantyMonths: parseWarranty(product.warranty),
        condition: conditionMap[product.condition],
        status: statusMap[product.stockStatus],
        isPromo: product.isPromo,
        isNew: product.isNew,
        isRecommended: product.isRecommended,
        isBestSeller: product.isBestSeller,
      },
      create: {
        name: product.name,
        slug: product.slug,
        sku: createSku(product),
        brandId,
        categoryId,
        shortDescription: product.specs.join(" • "),
        description: buildProductDescription(product),
        technicalDescription: product.specs.join("\n"),
        priceBuy,
        priceSell: regularPrice,
        promoPrice,
        margin: regularPrice - priceBuy,
        warrantyMonths: parseWarranty(product.warranty),
        condition: conditionMap[product.condition],
        status: statusMap[product.stockStatus],
        isPromo: product.isPromo,
        isNew: product.isNew,
        isRecommended: product.isRecommended,
        isBestSeller: product.isBestSeller,
        // rating / reviewCount volontairement non semes : ils sont calcules
        // depuis les avis reellement approuves (syncProductRatingFromReviews).
        seoTitle: product.name,
        seoDescription: product.specs.join(", "),
      },
    });

    productBySlug.set(product.slug, saved.id);

    await prisma.productImage.deleteMany({ where: { productId: saved.id } });
    await prisma.productImage.create({
      data: {
        productId: saved.id,
        url: product.image,
        alt: product.name,
        order: 1,
      },
    });

    await seedProductAttributeValues(
      saved.id,
      product,
      filterAttributesByCategory.get(product.categorySlug),
    );

    await seedProductStocks(saved.id, product, mainDepotId, showroomId);
  }

  return productBySlug;
}

async function seedProductAttributeValues(
  productId: string,
  product: CatalogProduct,
  attributes?: Map<string, string>,
) {
  if (!attributes) return;

  await prisma.productAttributeValue.deleteMany({ where: { productId } });

  for (const [slug, attributeId] of attributes.entries()) {
    const rawValue = getAttributeValue(product, slug);
    if (rawValue === undefined || rawValue === null || rawValue === "") continue;

    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) {
      const stringValue = String(value);
      const option = await prisma.filterOption.findUnique({
        where: {
          attributeId_value: {
            attributeId,
            value: stringValue,
          },
        },
      });

      await prisma.productAttributeValue.create({
        data: {
          productId,
          attributeId,
          optionId: option?.id,
          valueString: typeof value === "string" ? value : undefined,
          valueNumber: typeof value === "number" ? value : undefined,
          valueBoolean: typeof value === "boolean" ? value : undefined,
          valueJson: Array.isArray(rawValue) ? rawValue : undefined,
        },
      });
    }
  }
}

async function seedProductStocks(
  productId: string,
  product: CatalogProduct,
  mainDepotId: string,
  showroomId: string,
) {
  const totalQuantity = stockByStatus[product.stockStatus];
  const mainQuantity = Math.max(0, totalQuantity - 2);
  const showroomQuantity = Math.min(totalQuantity, 2);

  await prisma.stock.upsert({
    where: {
      productId_depotId: {
        productId,
        depotId: mainDepotId,
      },
    },
    update: {
      quantity: mainQuantity,
      lowStockThreshold: 3,
    },
    create: {
      productId,
      depotId: mainDepotId,
      quantity: mainQuantity,
      lowStockThreshold: 3,
    },
  });

  await prisma.stock.upsert({
    where: {
      productId_depotId: {
        productId,
        depotId: showroomId,
      },
    },
    update: {
      quantity: showroomQuantity,
      lowStockThreshold: 2,
    },
    create: {
      productId,
      depotId: showroomId,
      quantity: showroomQuantity,
      lowStockThreshold: 2,
    },
  });
}

async function seedCustomers() {
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { id: "seed-customer-maroc-info" },
      update: {
        name: "Société Maroc Info",
        phone: "0612345678",
        email: "achat@marocinfo.ma",
        city: "Casablanca",
        type: CustomerType.COMPANY,
        source: CustomerSource.WEBSITE,
        level: CustomerLevel.B2B,
        organizationName: "Société Maroc Info",
      },
      create: {
        id: "seed-customer-maroc-info",
        name: "Société Maroc Info",
        phone: "0612345678",
        email: "achat@marocinfo.ma",
        city: "Casablanca",
        address: "Maarif, Casablanca",
        type: CustomerType.COMPANY,
        source: CustomerSource.WEBSITE,
        level: CustomerLevel.B2B,
        organizationName: "Société Maroc Info",
      },
    }),
    prisma.customer.upsert({
      where: { id: "seed-customer-lycee" },
      update: {
        name: "Lycée Al Manar",
        phone: "0623456789",
        city: "Rabat",
        type: CustomerType.SCHOOL,
        source: CustomerSource.RECOMMENDATION,
        level: CustomerLevel.B2B,
        organizationName: "Lycée Al Manar",
      },
      create: {
        id: "seed-customer-lycee",
        name: "Lycée Al Manar",
        phone: "0623456789",
        city: "Rabat",
        address: "Agdal, Rabat",
        type: CustomerType.SCHOOL,
        source: CustomerSource.RECOMMENDATION,
        level: CustomerLevel.B2B,
        organizationName: "Lycée Al Manar",
      },
    }),
    prisma.customer.upsert({
      where: { id: "seed-customer-particulier" },
      update: {
        name: "Client Particulier",
        phone: "0634567890",
        city: "Marrakech",
        type: CustomerType.INDIVIDUAL,
        source: CustomerSource.WHATSAPP,
        level: CustomerLevel.NEW,
      },
      create: {
        id: "seed-customer-particulier",
        name: "Client Particulier",
        phone: "0634567890",
        city: "Marrakech",
        address: "Adresse client placeholder",
        type: CustomerType.INDIVIDUAL,
        source: CustomerSource.WHATSAPP,
        level: CustomerLevel.NEW,
      },
    }),
  ]);

  return {
    company: customers[0],
    school: customers[1],
    individual: customers[2],
  };
}

async function seedOrders(
  customers: Awaited<ReturnType<typeof seedCustomers>>,
  productBySlug: Map<string, string>,
) {
  const productId = productBySlug.get("tp-link-archer-ax55");
  if (!productId) return;

  await prisma.order.upsert({
    where: { orderNumber: "CMD-2026-0001" },
    update: {
      status: OrderStatus.PENDING_CONFIRMATION,
      subtotal: 890,
      deliveryFee: 30,
      total: 920,
      items: {
        deleteMany: {},
        create: {
          productId,
          quantity: 1,
          unitPrice: 890,
          totalPrice: 890,
        },
      },
    },
    create: {
      orderNumber: "CMD-2026-0001",
      customerId: customers.company.id,
      status: OrderStatus.PENDING_CONFIRMATION,
      deliveryMethod: DeliveryMethod.HOME_DELIVERY,
      paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
      subtotal: 890,
      deliveryFee: 30,
      total: 920,
      customerNote: "Commande seed en attente de confirmation.",
      items: {
        create: {
          productId,
          quantity: 1,
          unitPrice: 890,
          totalPrice: 890,
        },
      },
      statusHistory: {
        create: {
          status: OrderStatus.PENDING_CONFIRMATION,
          note: "Commande seed créée depuis le site.",
        },
      },
    },
  });
}

async function seedQuotes(
  customers: Awaited<ReturnType<typeof seedCustomers>>,
  productBySlug: Map<string, string>,
) {
  const productId = productBySlug.get("hp-probook-450-g10");

  await prisma.quote.upsert({
    where: { quoteNumber: "DEV-2026-0001" },
    update: {
      status: QuoteStatus.NEW,
      message: "Besoin de 12 PC portables pour salle informatique.",
      organizationName: "Lycée Al Manar",
      urgency: "Projet planifié",
      needType: "Solution complète",
      budget: 80000,
      items: {
        deleteMany: {},
        create: {
          productId,
          productName: "HP ProBook 450 G10",
          quantity: 12,
          unitPrice: 6490,
          totalPrice: 77880,
        },
      },
    },
    create: {
      quoteNumber: "DEV-2026-0001",
      customerId: customers.school.id,
      status: QuoteStatus.NEW,
      message: "Besoin de 12 PC portables pour salle informatique.",
      organizationName: "Lycée Al Manar",
      urgency: "Projet planifié",
      needType: "Solution complète",
      budget: 80000,
      total: 77880,
      items: {
        create: {
          productId,
          productName: "HP ProBook 450 G10",
          quantity: 12,
          unitPrice: 6490,
          totalPrice: 77880,
        },
      },
    },
  });
}

async function seedSuppliers(productBySlug: Map<string, string>) {
  const supplier = await prisma.supplier.upsert({
    where: { id: "seed-supplier-importateur" },
    update: {
      name: "Importateur Tech Maroc",
      type: SupplierType.IMPORTER,
      phone: "0522000000",
      city: "Casablanca",
    },
    create: {
      id: "seed-supplier-importateur",
      name: "Importateur Tech Maroc",
      type: SupplierType.IMPORTER,
      phone: "0522000000",
      email: "contact@importateur-tech.example",
      city: "Casablanca",
      notes: "Fournisseur seed placeholder.",
    },
  });

  const productId = productBySlug.get("d-link-switch-24-ports");
  if (!productId) return;

  await prisma.supplierPurchase.upsert({
    where: { id: "seed-purchase-001" },
    update: {
      total: 12500,
      paid: 7000,
      remaining: 5500,
      items: {
        deleteMany: {},
        create: {
          productId,
          quantity: 10,
          unitBuyPrice: 1250,
          total: 12500,
        },
      },
    },
    create: {
      id: "seed-purchase-001",
      supplierId: supplier.id,
      reference: "ACH-2026-0001",
      total: 12500,
      paid: 7000,
      remaining: 5500,
      date: new Date("2026-06-01"),
      notes: "Achat fournisseur seed.",
      items: {
        create: {
          productId,
          quantity: 10,
          unitBuyPrice: 1250,
          total: 12500,
        },
      },
    },
  });

  await prisma.stockMovement.create({
    data: {
      productId,
      depotId: "seed-main-depot",
      type: StockMovementType.IN,
      quantity: 10,
      reason: "Seed stock initial",
      reference: "ACH-2026-0001",
    },
  });
}

async function seedBanners() {
  await prisma.banner.upsert({
    where: { id: "seed-home-hero" },
    update: {
      title: "Équipez votre entreprise avec le meilleur de la technologie",
      subtitle:
        "Spécialiste informatique, réseaux, sécurité et télécommunication au Maroc.",
      imageUrl: "/generated/hero-tech-premium.svg",
      ctaLabel: "Découvrir les produits",
      ctaUrl: "/catalogue",
      active: true,
      order: 1,
    },
    create: {
      id: "seed-home-hero",
      title: "Équipez votre entreprise avec le meilleur de la technologie",
      subtitle:
        "Spécialiste informatique, réseaux, sécurité et télécommunication au Maroc.",
      imageUrl: "/generated/hero-tech-premium.svg",
      ctaLabel: "Découvrir les produits",
      ctaUrl: "/catalogue",
      active: true,
      order: 1,
    },
  });
}

function uniqueFilters(filters: AttributeFilter[], existing = new Set<string>()) {
  const unique: AttributeFilter[] = [];

  for (const filter of filters) {
    if (existing.has(filter.key)) continue;
    existing.add(filter.key);
    unique.push(filter);
  }

  return unique;
}

function inferFilterType(filter: AttributeFilter): FilterInputType {
  if (filter.searchable) return FilterInputType.SEARCH_LIST;
  if (filter.options.length === 2 && filter.options.every((option) => ["Oui", "Non"].includes(option.label))) {
    return FilterInputType.BOOLEAN;
  }
  return FilterInputType.CHECKBOX;
}

function createSku(product: CatalogProduct) {
  return product.id
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function parseWarranty(warranty: string) {
  const months = Number.parseInt(warranty, 10);
  return Number.isFinite(months) ? months : 12;
}

function buildProductDescription(product: CatalogProduct) {
  return `${product.name} - ${product.specs.join(", ")}. Produit préparé pour Nahda Smart avec disponibilité et prix à confirmer par l'équipe avant commande.`;
}

function getAttributeValue(product: CatalogProduct, slug: string) {
  if (slug in product.attributes) return product.attributes[slug];

  if (slug === "storageCapacity") {
    const storage = String(product.attributes.storage ?? "");
    return ["128 Go", "256 Go", "512 Go", "1 To", "2 To"].find((value) =>
      storage.includes(value),
    );
  }

  if (slug === "storageType") {
    const storage = String(product.attributes.storage ?? "");
    return ["NVMe", "SSD", "HDD"].find((value) =>
      storage.toLowerCase().includes(value.toLowerCase()),
    );
  }

  if (slug === "system") return product.attributes.os;
  if (slug === "printerWifi") return product.attributes.wifi;
  if (slug === "networkAudience") return product.attributes.networkUsage;
  if (slug === "cameraResolution") return product.attributes.resolution;
  if (slug === "detection") return product.attributes.detection;
  if (slug === "screenIncluded") return product.attributes.screenIncluded;

  return undefined;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
