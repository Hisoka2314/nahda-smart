import {
  advancedCategorySpecificFilters,
  audienceOptions,
  catalogueCategories,
  categorySpecificFilters,
  commonAttributeFilters,
  conditionOptions,
  deliveryModeOptions,
  purchaseTypeOptions,
  rangeOptions,
  seriesOptions,
  stockLocationOptions,
  stockOptions,
  usageOptions,
  warrantyOptions,
  warrantyProviderOptions,
} from "@/data/catalogue";
import type {
  AttributeFilter,
  FilterAttribute,
  FilterGroup,
  FilterInputType,
  FilterOption,
} from "@/types/catalogue";

type FilterGroupPreset = {
  id: string;
  name: string;
  order: number;
  defaultOpen: boolean;
  isAdvanced: boolean;
  keys: string[];
  defaultOpenKeys?: string[];
};

type CatalogueFilterGroupsParams = {
  categorySlug?: string;
  selectedCategorySlugs?: string[];
  includeCategoryFilter?: boolean;
};

const globalCategorySlug = "global";

export const globalFilterGroups: FilterGroup[] = [
  systemGroup({
    id: "global-price",
    name: "Budget",
    order: 1,
    defaultOpen: true,
    isAdvanced: false,
    attributes: [
      systemAttribute("price", "Prix (DH)", "numeric-range", 1, {
        defaultOpen: true,
        unit: "DH",
      }),
    ],
  }),
  systemGroup({
    id: "global-selection",
    name: "Sélection principale",
    order: 2,
    defaultOpen: true,
    isAdvanced: false,
    attributes: [
      systemAttribute("category", "Catégorie", "search-list", 1),
      systemAttribute("brand", "Marque", "search-list", 2, { searchable: true }),
      systemAttribute("stock", "Disponibilité", "checkbox", 3, {
        options: stockOptions,
      }),
    ],
  }),
  systemGroup({
    id: "global-commercial",
    name: "Achat & disponibilité",
    order: 3,
    defaultOpen: false,
    isAdvanced: true,
    attributes: [
      systemAttribute("stockLocation", "Stock par dépôt / magasin", "checkbox", 1, {
        options: stockLocationOptions,
      }),
      systemAttribute("deliveryMode", "Livraison / retrait", "checkbox", 2, {
        options: deliveryModeOptions,
      }),
      systemAttribute("purchaseType", "Type d'achat", "checkbox", 3, {
        options: purchaseTypeOptions,
      }),
      systemAttribute("audience", "Produit destiné à", "checkbox", 4, {
        options: audienceOptions,
      }),
      systemAttribute("range", "Gamme", "checkbox", 5, {
        options: rangeOptions,
      }),
      systemAttribute("series", "Série produit", "search-list", 6, {
        options: seriesOptions,
        searchable: true,
      }),
    ],
  }),
  systemGroup({
    id: "global-product-labels",
    name: "Labels produits",
    order: 4,
    defaultOpen: false,
    isAdvanced: true,
    attributes: [
      systemAttribute("promo", "Produits en promotion", "boolean", 1),
      systemAttribute("b2b", "Compatible devis B2B", "boolean", 2),
      systemAttribute("new", "Nouveauté", "boolean", 3),
      systemAttribute("best", "Meilleure vente", "boolean", 4),
      systemAttribute("recommended", "Produit recommandé", "boolean", 5),
    ],
  }),
  systemGroup({
    id: "global-quality",
    name: "Qualité & usage",
    order: 5,
    defaultOpen: false,
    isAdvanced: true,
    attributes: [
      systemAttribute("warrantyProvider", "Type de garantie", "checkbox", 1, {
        options: warrantyProviderOptions,
      }),
      systemAttribute("warranty", "Durée garantie", "checkbox", 2, {
        options: warrantyOptions,
      }),
      systemAttribute("condition", "État", "checkbox", 3, {
        options: conditionOptions,
      }),
      systemAttribute("usage", "Usage", "checkbox", 4, {
        options: usageOptions,
      }),
      systemAttribute("rating", "Note client", "radio", 5),
    ],
  }),
];

const categoryFilterPresets: Record<string, FilterGroupPreset[]> = {
  "pc-portables": [
    {
      id: "pc-portables-essentials",
      name: "Essentiels PC portable",
      order: 10,
      defaultOpen: true,
      isAdvanced: false,
      keys: [
        "processor",
        "ram",
        "storageCapacity",
        "graphics",
        "screenSize",
        "processorGeneration",
        "storageType",
        "resolution",
        "system",
        "keyboard",
        "portsDetailed",
        "wifiStandard",
      ],
      defaultOpenKeys: ["processor", "ram", "storageCapacity", "graphics", "screenSize"],
    },
    {
      id: "pc-portables-advanced",
      name: "Détails avancés PC portable",
      order: 11,
      defaultOpen: false,
      isAdvanced: true,
      keys: [
        "cpuModel",
        "cpuSeries",
        "cpuCores",
        "ramExpandable",
        "maxRam",
        "ramSlots",
        "ssdSlots",
        "panelType",
        "brightness",
        "colorCoverage",
        "webcam",
        "securityFeatures",
        "bluetooth",
        "batteryWh",
        "chargerType",
        "chargerPower",
        "refurbGrade",
        "batteryHealth",
        "cosmeticCondition",
        "touch",
        "battery",
        "weight",
        "os",
        "storage",
      ],
    },
  ],
  "reseaux-connectivite": [
    {
      id: "network-essentials",
      name: "Essentiels réseaux",
      order: 10,
      defaultOpen: true,
      isAdvanced: false,
      keys: [
        "networkType",
        "ports",
        "speed",
        "poe",
        "poeBudget",
        "wifiStandard",
        "manageableBool",
        "rackable",
        "sfpPorts",
        "cloudManaged",
        "networkAudience",
      ],
      defaultOpenKeys: ["networkType", "ports", "speed", "poe"],
    },
    {
      id: "network-advanced",
      name: "Détails réseaux avancés",
      order: 11,
      defaultOpen: false,
      isAdvanced: true,
      keys: [
        "rj45Ports",
        "portSpeed",
        "poeType",
        "poePowerPerPort",
        "manageable",
        "managementLevel",
        "vlan",
        "qos",
        "fanless",
        "controllerCompatibility",
        "wifi",
        "wifiBands",
        "band",
        "antennas",
        "coverage",
        "usersRecommended",
        "networkUsage",
        "vpn",
        "cellular",
      ],
    },
  ],
  "securite-cameras": [
    {
      id: "security-essentials",
      name: "Essentiels sécurité",
      order: 10,
      defaultOpen: true,
      isAdvanced: false,
      keys: [
        "securityType",
        "resolution",
        "cameraResolution",
        "nightVision",
        "nightVisionDistance",
        "placement",
        "cameraPlacement",
        "poe",
        "ptz",
        "audio",
        "audioType",
        "detection",
        "storage",
        "videoStorage",
        "protectionIndex",
      ],
      defaultOpenKeys: ["securityType", "cameraResolution", "nightVisionDistance", "poe"],
    },
    {
      id: "security-advanced",
      name: "Détails caméras avancés",
      order: 11,
      defaultOpen: false,
      isAdvanced: true,
      keys: [
        "lens",
        "viewingAngle",
        "vandalProof",
        "wifi",
        "compression",
        "wdr",
        "onvif",
        "channels",
        "diskCapacity",
        "brandCompatibility",
        "recorderCompatibility",
      ],
    },
  ],
  impression: [
    {
      id: "printing-essentials",
      name: "Essentiels impression",
      order: 10,
      defaultOpen: true,
      isAdvanced: false,
      keys: [
        "printerType",
        "colorMode",
        "printColorMode",
        "wifi",
        "ethernet",
        "duplex",
        "autoDuplex",
        "scanner",
        "adf",
        "paperFormat",
        "printFormat",
        "printSpeed",
        "printSpeedPpm",
        "consumables",
        "consumableType",
      ],
      defaultOpenKeys: ["printerType", "colorMode", "wifi", "duplex"],
    },
    {
      id: "printing-advanced",
      name: "Détails impression avancés",
      order: 11,
      defaultOpen: false,
      isAdvanced: true,
      keys: [
        "functions",
        "usb",
        "dpi",
        "monthlyDuty",
        "consumableReference",
        "costPerPage",
        "printUsage",
      ],
    },
  ],
  "pc-bureau": [
    {
      id: "desktop-essentials",
      name: "Essentiels PC bureau",
      order: 10,
      defaultOpen: true,
      isAdvanced: false,
      keys: ["desktopFormat", "exactCpu", "ramExpandable", "ramSlots", "storageSlots", "dedicatedGpu"],
      defaultOpenKeys: ["desktopFormat", "exactCpu", "ramExpandable"],
    },
    {
      id: "desktop-advanced",
      name: "Détails PC bureau avancés",
      order: 11,
      defaultOpen: false,
      isAdvanced: true,
      keys: [
        "chipsetGeneration",
        "psuPower",
        "wifi",
        "bluetooth",
        "screenIncluded",
        "desktopUsage",
        "upgradeable",
      ],
    },
  ],
  "all-in-one": [
    {
      id: "aio-essentials",
      name: "Essentiels All-in-One",
      order: 10,
      defaultOpen: true,
      isAdvanced: false,
      keys: ["desktopFormat", "exactCpu", "aioScreenSize", "ramExpandable", "screenIncluded"],
      defaultOpenKeys: ["desktopFormat", "exactCpu", "aioScreenSize"],
    },
    {
      id: "aio-advanced",
      name: "Détails All-in-One avancés",
      order: 11,
      defaultOpen: false,
      isAdvanced: true,
      keys: [
        "chipsetGeneration",
        "ramSlots",
        "storageSlots",
        "dedicatedGpu",
        "psuPower",
        "wifi",
        "bluetooth",
        "desktopUsage",
        "upgradeable",
      ],
    },
  ],
};

const defaultAdvancedPreset = (categorySlug: string): FilterGroupPreset[] => [
  {
    id: `${categorySlug}-technical`,
    name: "Filtres techniques",
    order: 10,
    defaultOpen: true,
    isAdvanced: false,
    keys: [],
    defaultOpenKeys: [],
  },
];

export function getCatalogueFilterGroups({
  categorySlug,
  selectedCategorySlugs = [],
  includeCategoryFilter = true,
}: CatalogueFilterGroupsParams) {
  const globalGroups = globalFilterGroups
    .map((group) =>
      includeCategoryFilter
        ? group
        : {
            ...group,
            attributes: group.attributes.filter(
              (attribute) => attribute.slug !== "category",
            ),
          },
    )
    .filter((group) => group.attributes.length > 0);
  const targetCategorySlugs = categorySlug
    ? [categorySlug]
    : selectedCategorySlugs.length > 0
      ? selectedCategorySlugs
      : [];
  const categoryGroups = targetCategorySlugs.flatMap((slug) =>
    buildCategoryFilterGroups(slug),
  );

  return mergeGroups([...globalGroups, ...categoryGroups]);
}

export function flattenFilterAttributes(groups: FilterGroup[]) {
  return groups
    .flatMap((group) => group.attributes)
    .filter((attribute) => attribute.visible && attribute.filterable)
    .sort((first, second) => first.order - second.order);
}

export function buildCategoryFilterGroups(categorySlug: string) {
  const filters = getMergedAttributeFilters(categorySlug);
  const filterMap = new Map(filters.map((filter) => [filter.key, filter]));
  const presets =
    categoryFilterPresets[categorySlug] ?? defaultAdvancedPreset(categorySlug);
  const consumedKeys = new Set<string>();
  const groups = presets
    .map((preset) => {
      const keys = preset.keys.length > 0 ? preset.keys : filters.map((filter) => filter.key);
      const attributes = keys
        .map((key, index) => {
          const filter = filterMap.get(key);

          if (!filter) {
            return null;
          }

          consumedKeys.add(filter.key);

          return filterToAttribute(filter, {
            categorySlug,
            groupId: preset.id,
            order: index + 1,
            defaultOpen:
              preset.defaultOpenKeys?.includes(filter.key) ?? preset.defaultOpen,
            showEmptyOptions: !preset.isAdvanced,
          });
        })
        .filter(Boolean) as FilterAttribute[];

      return {
        id: preset.id,
        categorySlug,
        name: preset.name,
        order: preset.order,
        defaultOpen: preset.defaultOpen,
        isAdvanced: preset.isAdvanced,
        attributes,
      };
    })
    .filter((group) => group.attributes.length > 0);

  const remainingFilters = filters.filter((filter) => !consumedKeys.has(filter.key));

  if (remainingFilters.length > 0) {
    groups.push({
      id: `${categorySlug}-more`,
      categorySlug,
      name: "Filtres avancés complémentaires",
      order: 99,
      defaultOpen: false,
      isAdvanced: true,
      attributes: remainingFilters.map((filter, index) =>
        filterToAttribute(filter, {
          categorySlug,
          groupId: `${categorySlug}-more`,
          order: index + 1,
          defaultOpen: false,
          showEmptyOptions: false,
        }),
      ),
    });
  }

  return groups;
}

function getMergedAttributeFilters(categorySlug: string) {
  if (categorySpecificFilters[categorySlug]) {
    return mergeAttributeFilters(
      categorySpecificFilters[categorySlug],
      advancedCategorySpecificFilters[categorySlug],
    );
  }

  if (categorySlug === "pc-bureau" || categorySlug === "all-in-one") {
    return mergeAttributeFilters(
      categorySpecificFilters["pc-portables"].slice(0, 7),
      advancedCategorySpecificFilters[categorySlug],
    );
  }

  if (categorySlug === "baies-reseau-cablage") {
    return mergeAttributeFilters(
      categorySpecificFilters["reseaux-connectivite"],
      advancedCategorySpecificFilters["baies-reseau-cablage"],
    );
  }

  if (
    ["multimedia", "peripheriques", "stockage", "telephonie", "onduleurs-energie"].includes(
      categorySlug,
    )
  ) {
    return mergeAttributeFilters(
      categorySpecificFilters.accessoires,
      advancedCategorySpecificFilters[categorySlug],
    );
  }

  return mergeAttributeFilters(
    commonAttributeFilters,
    advancedCategorySpecificFilters[categorySlug],
  );
}

function mergeAttributeFilters(...groups: Array<AttributeFilter[] | undefined>) {
  const merged = new Map<string, AttributeFilter>();

  groups
    .flatMap((group) => group ?? [])
    .forEach((filter) => {
      const current = merged.get(filter.key);

      if (!current) {
        merged.set(filter.key, filter);
        return;
      }

      const optionMap = new Map(
        current.options.map((option) => [option.value, option]),
      );
      filter.options.forEach((option) => optionMap.set(option.value, option));
      merged.set(filter.key, {
        ...current,
        ...filter,
        options: Array.from(optionMap.values()),
        searchable: current.searchable || filter.searchable,
        tone: filter.tone ?? current.tone,
      });
    });

  return Array.from(merged.values());
}

function systemGroup({
  id,
  name,
  order,
  defaultOpen,
  isAdvanced,
  attributes,
}: Omit<FilterGroup, "categorySlug">): FilterGroup {
  return {
    id,
    categorySlug: globalCategorySlug,
    name,
    order,
    defaultOpen,
    isAdvanced,
    attributes: attributes.map((attribute) => ({
      ...attribute,
      groupId: id,
      categorySlug: globalCategorySlug,
    })),
  };
}

function systemAttribute(
  slug: string,
  label: string,
  type: FilterInputType,
  order: number,
  options: Partial<FilterAttribute> & { options?: FilterOption[] } = {},
): FilterAttribute {
  return {
    id: `${globalCategorySlug}-${slug}`,
    groupId: globalCategorySlug,
    categorySlug: globalCategorySlug,
    label,
    slug,
    type,
    unit: options.unit,
    filterable: true,
    searchable: options.searchable ?? false,
    visible: options.visible ?? true,
    order,
    options: toDynamicOptions(slug, options.options ?? []),
    defaultOpen: options.defaultOpen ?? false,
    source: "system",
    paramKey: slug,
  };
}

function filterToAttribute(
  filter: AttributeFilter,
  {
    categorySlug,
    groupId,
    order,
    defaultOpen,
    showEmptyOptions,
  }: {
    categorySlug: string;
    groupId: string;
    order: number;
    defaultOpen: boolean;
    showEmptyOptions: boolean;
  },
): FilterAttribute {
  return {
    id: `${categorySlug}-${filter.key}`,
    groupId,
    categorySlug,
    label: filter.label,
    slug: filter.key,
    type: filter.searchable ? "search-list" : "checkbox",
    filterable: true,
    searchable: filter.searchable ?? false,
    visible: true,
    order,
    options: toDynamicOptions(filter.key, filter.options),
    defaultOpen,
    showEmptyOptions,
    source: "product-attribute",
    paramKey: `attr_${filter.key}`,
  };
}

function toDynamicOptions(slug: string, options: FilterOption[]) {
  return options.map((option, index) => ({
    ...option,
    id: option.id ?? `${slug}-${option.value}`.toLowerCase().replace(/\s+/g, "-"),
    order: option.order ?? index + 1,
  }));
}

function mergeGroups(groups: FilterGroup[]) {
  const merged = new Map<string, FilterGroup>();

  groups.forEach((group) => {
    const current = merged.get(group.id);

    if (!current) {
      merged.set(group.id, group);
      return;
    }

    const attributes = new Map(
      current.attributes.map((attribute) => [attribute.slug, attribute]),
    );
    group.attributes.forEach((attribute) => attributes.set(attribute.slug, attribute));
    merged.set(group.id, {
      ...current,
      attributes: Array.from(attributes.values()).sort(
        (first, second) => first.order - second.order,
      ),
    });
  });

  return Array.from(merged.values()).sort((first, second) => first.order - second.order);
}

export const categoryFilterConfigs = catalogueCategories.map((category) => ({
  id: `category-${category.slug}`,
  name: category.name,
  slug: category.slug,
  filterGroups: buildCategoryFilterGroups(category.slug),
}));
