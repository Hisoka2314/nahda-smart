"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  Filter,
  Grid2X2,
  List,
  RotateCcw,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { ProductCard } from "@/components/product/product-card";
import { CatalogueProductRow } from "@/components/catalogue/catalogue-product-row";
import { brandSlugMap } from "@/data/brands";
import {
  catalogueCategories,
  catalogueProducts,
  audienceOptions,
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
import {
  flattenFilterAttributes,
  getCatalogueFilterGroups,
} from "@/data/filter-definitions";
import {
  audienceLabels,
  conditionLabels,
  deliveryModeLabels,
  getBrandName,
  purchaseTypeLabels,
  rangeLabels,
  stockLocationLabels,
  toProductCardProduct,
  usageLabels,
  warrantyProviderLabels,
} from "@/lib/catalogue";
import { cn, formatMad } from "@/lib/utils";
import type {
  CatalogProduct,
  CatalogCategory,
  FilterAttribute as DynamicFilterAttribute,
  FilterGroup as DynamicFilterGroup,
  FilterOption,
  ProductAudience,
  ProductUsage,
  ProductViewMode,
  SortKey,
} from "@/types/catalogue";

type QueryReader = {
  get: (key: string) => string | null;
};

type CataloguePageClientProps = {
  categorySlug?: string;
  products?: CatalogProduct[];
  categories?: CatalogCategory[];
  filterGroups?: DynamicFilterGroup[];
};

type Chip = {
  key: string;
  label: string;
  onRemove: () => void;
};

const sortOptions: Array<{ label: string; value: SortKey }> = [
  { label: "Pertinence", value: "relevance" },
  { label: "Prix croissant", value: "price-asc" },
  { label: "Prix décroissant", value: "price-desc" },
  { label: "Nouveautés", value: "newest" },
  { label: "Meilleures ventes", value: "best-sellers" },
  { label: "Promotions", value: "promotions" },
];

const ratingOptions: FilterOption[] = [
  { label: "4 étoiles et plus", value: "4" },
  { label: "4.5 étoiles et plus", value: "4.5" },
];

const filterKeys = [
  "min",
  "max",
  "brand",
  "category",
  "stock",
  "promo",
  "warranty",
  "condition",
  "usage",
  "rating",
  "delivery",
  "stockLocation",
  "deliveryMode",
  "purchaseType",
  "audience",
  "range",
  "series",
  "warrantyProvider",
  "b2b",
  "new",
  "best",
  "recommended",
] as const;

const productLimitStep = 12;
const emptySearchParams = new URLSearchParams();

export function CataloguePageClient({
  categorySlug,
  products = catalogueProducts,
  categories = catalogueCategories,
  filterGroups,
}: CataloguePageClientProps) {
  const searchParams = useSearchParams() ?? emptySearchParams;
  const router = useRouter();
  const pathname = usePathname() ?? "/catalogue";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(productLimitStep);

  const currentCategory = categorySlug
    ? categories.find((category) => category.slug === categorySlug)
    : undefined;

  const baseProducts = useMemo(() => {
    const query = (searchParams.get("q") ?? "").trim().toLowerCase();
    const scopedProducts = categorySlug
      ? products.filter((product) => product.categorySlug === categorySlug)
      : products;

    if (!query) {
      return scopedProducts;
    }

    return scopedProducts.filter((product) => productMatchesQuery(product, query));
  }, [categorySlug, products, searchParams]);

  const brandOptions = useMemo(() => {
    // Le nom porte par le produit vient de la base : c'est la seule source qui
    // connaisse les marques ajoutees depuis l'inventaire. Le repli sur le slug
    // affichait "Msi", "Benq" ou "Generique" des qu'une marque manquait au
    // catalogue statique, c'est-a-dire pour la quasi-totalite d'entre elles.
    const parSlug = new Map<string, string>();

    for (const product of baseProducts) {
      if (!parSlug.has(product.brandSlug)) {
        parSlug.set(
          product.brandSlug,
          product.brandName ?? brandSlugMap[product.brandSlug]?.name ?? getBrandName(product.brandSlug),
        );
      }
    }

    return Array.from(parSlug, ([value, label]) => ({ label, value })).sort(
      (first, second) => first.label.localeCompare(second.label, "fr"),
    );
  }, [baseProducts]);

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        label: category.name,
        value: category.slug,
      })),
    [categories],
  );

  const sort = getSortKey(searchParams.get("sort"));
  const view = getViewMode(searchParams.get("view"));
  const selectedBrands = getMulti(searchParams, "brand");
  const selectedCategories = getMulti(searchParams, "category");
  const selectedStock = getMulti(searchParams, "stock");
  const selectedStockLocations = getMulti(searchParams, "stockLocation");
  const selectedDeliveryModes = getMulti(searchParams, "deliveryMode");
  const selectedPurchaseTypes = getMulti(searchParams, "purchaseType");
  const selectedAudiences = getMulti(searchParams, "audience");
  const selectedRanges = getMulti(searchParams, "range");
  const selectedSeries = getMulti(searchParams, "series");
  const selectedWarrantyProviders = getMulti(searchParams, "warrantyProvider");
  const selectedWarranty = getMulti(searchParams, "warranty");
  const selectedCondition = getMulti(searchParams, "condition");
  const selectedUsage = getMulti(searchParams, "usage");
  const promoOnly = searchParams.get("promo") === "1";
  const deliveryOnly = searchParams.get("delivery") === "1";
  const b2bOnly = searchParams.get("b2b") === "1";
  const newOnly = searchParams.get("new") === "1";
  const bestOnly = searchParams.get("best") === "1";
  const recommendedOnly = searchParams.get("recommended") === "1";
  const ratingMin = Number(searchParams.get("rating") ?? 0);
  const priceMin = searchParams.get("min") ?? "";
  const priceMax = searchParams.get("max") ?? "";
  const dynamicFilterGroups = useMemo(
    () =>
      filterGroups ??
      getCatalogueFilterGroups({
        categorySlug,
        selectedCategorySlugs: selectedCategories,
        includeCategoryFilter: !categorySlug,
      }),
    [categorySlug, filterGroups, selectedCategories],
  );
  const allFilterAttributes = useMemo(
    () => flattenFilterAttributes(dynamicFilterGroups),
    [dynamicFilterGroups],
  );
  const attributeFilters = useMemo(
    () =>
      allFilterAttributes.filter(
        (attribute) => attribute.source === "product-attribute",
      ),
    [allFilterAttributes],
  );

  const filteredProducts = useMemo(() => {
    const min = Number(priceMin);
    const max = Number(priceMax);

    return baseProducts
      .filter((product) => {
        if (!categorySlug && selectedCategories.length > 0) {
          if (!selectedCategories.includes(product.categorySlug)) {
            return false;
          }
        }

        if (selectedBrands.length > 0 && !selectedBrands.includes(product.brandSlug)) {
          return false;
        }

        // Le filtre expose deux valeurs ("available" / "out_of_stock") alors
        // que le produit porte trois statuts : on ramene le statut a la
        // disponibilite avant comparaison.
        const availability =
          product.stockStatus === "out_of_stock" ? "out_of_stock" : "available";

        if (selectedStock.length > 0 && !selectedStock.includes(availability)) {
          return false;
        }

        if (
          selectedStockLocations.length > 0 &&
          !selectedStockLocations.includes(product.stockLocation)
        ) {
          return false;
        }

        if (
          selectedDeliveryModes.length > 0 &&
          !selectedDeliveryModes.some((mode) => product.deliveryModes.includes(mode as never))
        ) {
          return false;
        }

        if (
          selectedPurchaseTypes.length > 0 &&
          !selectedPurchaseTypes.some((type) => product.purchaseTypes.includes(type as never))
        ) {
          return false;
        }

        if (
          selectedAudiences.length > 0 &&
          !selectedAudiences.some((audience) =>
            product.audiences.includes(audience as ProductAudience),
          )
        ) {
          return false;
        }

        if (selectedRanges.length > 0 && !selectedRanges.includes(product.range)) {
          return false;
        }

        if (selectedSeries.length > 0 && !selectedSeries.includes(product.series)) {
          return false;
        }

        if (
          selectedWarrantyProviders.length > 0 &&
          !selectedWarrantyProviders.includes(product.warrantyProvider)
        ) {
          return false;
        }

        if (promoOnly && !product.isPromo) {
          return false;
        }

        if (deliveryOnly && !product.deliveryAvailable) {
          return false;
        }

        if (b2bOnly && !product.b2bQuoteCompatible) {
          return false;
        }

        if (newOnly && !product.isNew) {
          return false;
        }

        if (bestOnly && !product.isBestSeller) {
          return false;
        }

        if (recommendedOnly && !product.isRecommended) {
          return false;
        }

        if (selectedWarranty.length > 0 && !selectedWarranty.includes(product.warranty)) {
          return false;
        }

        if (
          selectedCondition.length > 0 &&
          !selectedCondition.includes(product.condition)
        ) {
          return false;
        }

        if (
          selectedUsage.length > 0 &&
          !selectedUsage.some((usage) =>
            product.usage.includes(usage as ProductUsage),
          )
        ) {
          return false;
        }

        if (Number.isFinite(min) && priceMin !== "" && product.price < min) {
          return false;
        }

        if (Number.isFinite(max) && priceMax !== "" && product.price > max) {
          return false;
        }

        if (Number.isFinite(ratingMin) && ratingMin > 0 && product.rating < ratingMin) {
          return false;
        }

        return attributeFilters.every((filter) => {
          const selectedValues = getMulti(searchParams, `attr_${filter.slug}`);

          if (selectedValues.length === 0) {
            return true;
          }

          return attributeMatches(product, filter.slug, selectedValues);
        });
      })
      .sort((first, second) => sortProducts(first, second, sort));
  }, [
    attributeFilters,
    baseProducts,
    categorySlug,
    deliveryOnly,
    priceMax,
    priceMin,
    promoOnly,
    ratingMin,
    searchParams,
    selectedBrands,
    selectedCategories,
    selectedCondition,
    selectedAudiences,
    selectedDeliveryModes,
    selectedPurchaseTypes,
    selectedRanges,
    selectedSeries,
    selectedStock,
    selectedStockLocations,
    selectedUsage,
    selectedWarranty,
    selectedWarrantyProviders,
    sort,
    b2bOnly,
    bestOnly,
    newOnly,
    recommendedOnly,
  ]);

  const chips = buildChips({
    attributeFilters,
    categoryOptions,
    includeCategoryChips: !categorySlug,
    params: searchParams,
    removeParamValue,
    setParam,
  });

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const pageTitle = currentCategory?.name ?? "Catalogue Nahda Smart";
  const pageDescription =
    currentCategory?.description ??
    "Explorez les produits informatiques, réseau, sécurité, impression, accessoires et solutions B2B disponibles pour le marché marocain.";
  const bannerImage = currentCategory?.bannerImage ?? "/generated/hero-tech-premium.png";

  function buildUrl(nextParams: URLSearchParams) {
    const params = nextParams.toString();
    return params ? `${pathname}?${params}` : pathname;
  }

  function updateParams(nextParams: URLSearchParams) {
    setVisibleCount(productLimitStep);
    router.replace(buildUrl(nextParams), { scroll: false });
  }

  function setParam(key: string, value: string | null) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (!value) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }

    updateParams(nextParams);
  }

  function setMulti(key: string, values: string[]) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (values.length === 0) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, values.join(","));
    }

    updateParams(nextParams);
  }

  function toggleMulti(key: string, value: string) {
    const values = getMulti(searchParams, key);
    const nextValues = values.includes(value)
      ? values.filter((current) => current !== value)
      : [...values, value];

    setMulti(key, nextValues);
  }

  function removeParamValue(key: string, value: string) {
    const nextValues = getMulti(searchParams, key).filter(
      (current) => current !== value,
    );
    setMulti(key, nextValues);
  }

  function clearFilters() {
    const nextParams = new URLSearchParams(searchParams.toString());
    const attributeKeys = Array.from(nextParams.keys()).filter((key) =>
      key.startsWith("attr_"),
    );

    [...filterKeys, ...attributeKeys].forEach((key) => nextParams.delete(key));
    updateParams(nextParams);
  }

  function renderFiltersPanel() {
    const categoryCounts = countOptions(baseProducts, categoryOptions, (product) => [
      product.categorySlug,
    ]);
    const brandCounts = countOptions(baseProducts, brandOptions, (product) => [
      product.brandSlug,
    ]);
    // Le filtre expose "available" / "out_of_stock" : les compteurs doivent
    // etre calcules sur cette meme cle, sinon "Disponible" reste a zero et
    // l'option est masquee, faisant disparaitre le groupe entier.
    const stockCounts = countOptions(baseProducts, stockOptions, (product) => [
      product.stockStatus === "out_of_stock" ? "out_of_stock" : "available",
    ]);
    const stockLocationCounts = countOptions(
      baseProducts,
      stockLocationOptions,
      (product) => [product.stockLocation],
    );
    const deliveryModeCounts = countOptions(
      baseProducts,
      deliveryModeOptions,
      (product) => product.deliveryModes,
    );
    const purchaseTypeCounts = countOptions(
      baseProducts,
      purchaseTypeOptions,
      (product) => product.purchaseTypes,
    );
    const audienceCounts = countOptions(
      baseProducts,
      audienceOptions,
      (product) => product.audiences,
    );
    const rangeCounts = countOptions(baseProducts, rangeOptions, (product) => [
      product.range,
    ]);
    const seriesCounts = countOptions(baseProducts, seriesOptions, (product) => [
      product.series,
    ]);
    const warrantyProviderCounts = countOptions(
      baseProducts,
      warrantyProviderOptions,
      (product) => [product.warrantyProvider],
    );
    const warrantyCounts = countOptions(baseProducts, warrantyOptions, (product) => [
      product.warranty,
    ]);
    const conditionCounts = countOptions(
      baseProducts,
      conditionOptions,
      (product) => [product.condition],
    );
    const usageCounts = countOptions(baseProducts, usageOptions, (product) =>
      product.usage,
    );
    const systemOptions: Record<string, FilterOption[]> = {
      category: categoryOptions,
      brand: brandOptions,
      stock: stockOptions,
      stockLocation: stockLocationOptions,
      deliveryMode: deliveryModeOptions,
      purchaseType: purchaseTypeOptions,
      audience: audienceOptions,
      range: rangeOptions,
      series: seriesOptions,
      warrantyProvider: warrantyProviderOptions,
      warranty: warrantyOptions,
      condition: conditionOptions,
      usage: usageOptions,
    };
    const systemSelected: Record<string, string[]> = {
      category: selectedCategories,
      brand: selectedBrands,
      stock: selectedStock,
      stockLocation: selectedStockLocations,
      deliveryMode: selectedDeliveryModes,
      purchaseType: selectedPurchaseTypes,
      audience: selectedAudiences,
      range: selectedRanges,
      series: selectedSeries,
      warrantyProvider: selectedWarrantyProviders,
      warranty: selectedWarranty,
      condition: selectedCondition,
      usage: selectedUsage,
    };
    const systemCounts: Record<string, Record<string, number>> = {
      category: categoryCounts,
      brand: brandCounts,
      stock: stockCounts,
      stockLocation: stockLocationCounts,
      deliveryMode: deliveryModeCounts,
      purchaseType: purchaseTypeCounts,
      audience: audienceCounts,
      range: rangeCounts,
      series: seriesCounts,
      warrantyProvider: warrantyProviderCounts,
      warranty: warrantyCounts,
      condition: conditionCounts,
      usage: usageCounts,
    };
    const booleanFilterState: Record<string, boolean> = {
      promo: promoOnly,
      b2b: b2bOnly,
      new: newOnly,
      best: bestOnly,
      recommended: recommendedOnly,
    };

    const renderGlobalFilterAttribute = (
      attribute: DynamicFilterAttribute,
      isAdvanced: boolean,
      defaultOpen: boolean,
    ) => {
      if (attribute.slug === "price") {
        return (
          <FilterGroup
            key={attribute.id}
            title={attribute.label}
            defaultOpen={attribute.defaultOpen ?? defaultOpen}
            tone="primary"
            activeCount={Number(Boolean(priceMin)) + Number(Boolean(priceMax))}
          >
            <div className="grid min-w-0 grid-cols-2 gap-2">
              <label className="grid min-w-0 gap-1.5 text-xs font-bold text-neutral-600">
                Min
                <input
                  value={priceMin}
                  inputMode="numeric"
                  type="number"
                  min={0}
                  placeholder="0"
                  className="focus-ring h-10 min-w-0 rounded-control border border-border-soft px-3 text-sm text-nahda-ink shadow-sm"
                  onChange={(event) => setParam("min", event.target.value)}
                />
              </label>
              <label className="grid min-w-0 gap-1.5 text-xs font-bold text-neutral-600">
                Max
                <input
                  value={priceMax}
                  inputMode="numeric"
                  type="number"
                  min={0}
                  placeholder="20000"
                  className="focus-ring h-10 min-w-0 rounded-control border border-border-soft px-3 text-sm text-nahda-ink shadow-sm"
                  onChange={(event) => setParam("max", event.target.value)}
                />
              </label>
            </div>
          </FilterGroup>
        );
      }

      if (attribute.type === "boolean") {
        return null;
      }

      if (attribute.slug === "category" && categorySlug) {
        return null;
      }

      if (attribute.slug === "rating") {
        return (
          <FilterGroup
            key={attribute.id}
            title={attribute.label}
            tone={isAdvanced ? "advanced" : "primary"}
            defaultOpen={attribute.defaultOpen ?? defaultOpen}
            activeCount={searchParams.get("rating") ? 1 : 0}
          >
            <RadioList
              options={ratingOptions}
              value={searchParams.get("rating") ?? ""}
              onChange={(value) =>
                setParam(
                  "rating",
                  searchParams.get("rating") === value ? null : value,
                )
              }
            />
          </FilterGroup>
        );
      }

      return (
        <CountedCheckboxGroup
          key={attribute.id}
          title={attribute.label}
          defaultOpen={attribute.defaultOpen ?? defaultOpen}
          searchable={attribute.searchable}
          showEmptyOptions={attribute.showEmptyOptions}
          tone={isAdvanced ? "advanced" : "primary"}
          options={systemOptions[attribute.slug] ?? attribute.options}
          selected={systemSelected[attribute.slug] ?? []}
          counts={systemCounts[attribute.slug] ?? {}}
          onToggle={(value) => toggleMulti(attribute.slug, value)}
        />
      );
    };

    const renderGlobalFilterGroup = (group: (typeof dynamicFilterGroups)[number]) => {
      if (group.id === "global-product-labels") {
        const activeCount = group.attributes.filter(
          (attribute) => booleanFilterState[attribute.slug],
        ).length;

        return (
          <FilterGroup
            key={group.id}
            title={group.name}
            tone="advanced"
            defaultOpen={group.defaultOpen}
            activeCount={activeCount}
          >
            <div className="grid gap-3">
              {group.attributes.map((attribute) => (
                <ToggleLine
                  key={attribute.id}
                  label={attribute.label}
                  checked={Boolean(booleanFilterState[attribute.slug])}
                  onChange={() =>
                    setParam(
                      attribute.slug,
                      booleanFilterState[attribute.slug] ? null : "1",
                    )
                  }
                />
              ))}
            </div>
          </FilterGroup>
        );
      }

      return group.attributes.map((attribute) =>
        renderGlobalFilterAttribute(attribute, group.isAdvanced, group.defaultOpen),
      );
    };

    const renderTechnicalFilterGroup = (
      group: (typeof dynamicFilterGroups)[number],
    ) => {
      // On ecarte les attributs qui n'afficheraient aucune option : sans cela
      // le titre du groupe restait visible au-dessus du vide (catalogue sans
      // produit, ou categorie dont aucun produit ne porte l'attribut), ce qui
      // donne l'impression d'un filtre casse. Un tableau d'elements JSX est
      // toujours "truthy", l'ancien filter(Boolean) ne retirait donc rien.
      const controls = group.attributes
        .filter((attribute) => attribute.source === "product-attribute")
        .map((attribute) => {
          const selected = getMulti(searchParams, `attr_${attribute.slug}`);
          const counts = countAttributeOptions(baseProducts, attribute);
          const visible = getVisibleOptions(
            attribute.options,
            counts,
            selected,
            attribute.showEmptyOptions,
          );

          if (visible.length === 0) return null;

          return (
            <CountedCheckboxGroup
              key={attribute.id}
              title={attribute.label}
              tone={group.isAdvanced ? "advanced" : "primary"}
              defaultOpen={attribute.defaultOpen ?? group.defaultOpen}
              searchable={attribute.searchable}
              showEmptyOptions={attribute.showEmptyOptions}
              options={attribute.options}
              selected={selected}
              counts={counts}
              onToggle={(value) => toggleMulti(`attr_${attribute.slug}`, value)}
            />
          );
        })
        .filter((control) => control !== null);

      if (controls.length === 0) {
        return null;
      }

      return (
        <div key={group.id} className="grid min-w-0 gap-3">
          <div className="flex min-w-0 items-center gap-2 rounded-[10px] border border-nahda-olive/[0.16] bg-nahda-olive-soft/70 px-3 py-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-nahda-olive" />
            <p className="min-w-0 break-words text-xs font-black uppercase text-nahda-olive-dark">
              {group.name}
            </p>
          </div>
          {controls}
        </div>
      );
    };

    const globalPrimaryGroups = dynamicFilterGroups.filter(
      (group) =>
        group.categorySlug === "global" &&
        ["global-price", "global-selection"].includes(group.id),
    );
    const technicalGroups = dynamicFilterGroups.filter(
      (group) => group.categorySlug !== "global",
    );
    const globalAdvancedGroups = dynamicFilterGroups.filter(
      (group) =>
        group.categorySlug === "global" &&
        !["global-price", "global-selection"].includes(group.id),
    );

    return (
      <div className="grid gap-4" data-testid="catalogue-filters">
        <div className="rounded-card bg-nahda-ink p-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-[#a8c84c]">
                Filtres
              </p>
              <p className="mt-1 text-sm text-white/[0.72]">
                {filteredProducts.length} produit
                {filteredProducts.length > 1 ? "s" : ""} trouvé
                {filteredProducts.length > 1 ? "s" : ""}
              </p>
            </div>
            <Filter size={22} className="text-[#a8c84c]" />
          </div>
        </div>

        {globalPrimaryGroups.map(renderGlobalFilterGroup)}

        {technicalGroups.map(renderTechnicalFilterGroup)}

        {globalAdvancedGroups.map(renderGlobalFilterGroup)}

        <Button variant="outline" className="hidden w-full lg:inline-flex" onClick={clearFilters}>
          <RotateCcw size={16} />
          Tout effacer
        </Button>
      </div>
    );
  }

  return (
    <main className="bg-background">
      <section className="relative overflow-hidden bg-nahda-ink text-white">
        <div className="absolute inset-0">
          <Image
            src={bannerImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,6,0.98)_0%,rgba(5,7,6,0.88)_48%,rgba(5,7,6,0.36)_100%)]" />
          <div className="absolute left-1/4 top-12 h-36 w-36 rounded-full bg-nahda-olive/[0.18] blur-3xl" />
        </div>
        <Container className="relative py-10 md:py-12">
          <nav className="flex flex-wrap items-center gap-2 text-sm font-bold text-white/[0.72]">
            <Link href="/" className="hover:text-white">
              Accueil
            </Link>
            <ChevronRight size={15} />
            <Link href="/catalogue" className="hover:text-white">
              Catalogue
            </Link>
            {currentCategory ? (
              <>
                <ChevronRight size={15} />
                <span className="text-[#a8c84c]">{currentCategory.name}</span>
              </>
            ) : null}
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_320px] lg:items-end">
            <div>
              <Badge variant="olive">
                {currentCategory?.eyebrow ?? "Boutique tech"}
              </Badge>
              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-5xl">
                {pageTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-white/[0.76]">
                {pageDescription}
              </p>
            </div>
            <div className="rounded-card border border-white/10 bg-white/[0.08] p-5 backdrop-blur">
              <p className="text-sm font-black text-[#a8c84c]">
                Sélection professionnelle
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <Stat value={baseProducts.length} label="produits" />
                <Stat value={brandOptions.length} label="marques" />
                <Stat value={attributeFilters.length} label="filtres" />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-8 md:py-10">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="hidden min-w-0 lg:block">
            <div className="sticky top-[154px] min-w-0 max-w-full rounded-card border border-border-soft bg-white p-4 shadow-card">
              {renderFiltersPanel()}
            </div>
          </aside>

          <section className="min-w-0">
            <div className="premium-card p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-sm font-black text-nahda-ink">
                    {filteredProducts.length} produit
                    {filteredProducts.length > 1 ? "s" : ""} trouvé
                    {filteredProducts.length > 1 ? "s" : ""}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    Affinez votre sélection par budget, marque, disponibilité
                    et caractéristiques techniques.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[auto_210px_auto] sm:items-center">
                  <Button
                    variant="outline"
                    className="justify-center lg:hidden"
                    onClick={() => setDrawerOpen(true)}
                  >
                    <SlidersHorizontal size={17} />
                    Filtres
                    {chips.length > 0 ? (
                      <span className="rounded-full bg-nahda-olive px-2 py-0.5 text-xs text-white">
                        {chips.length}
                      </span>
                    ) : null}
                  </Button>
                  <Select
                    aria-label="Trier les produits"
                    options={sortOptions}
                    value={sort}
                    onChange={(event) => setParam("sort", event.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={view === "grid" ? "secondary" : "outline"}
                      size="icon"
                      aria-label="Vue grille"
                      onClick={() => setParam("view", "grid")}
                    >
                      <Grid2X2 size={17} />
                    </Button>
                    <Button
                      variant={view === "list" ? "secondary" : "outline"}
                      size="icon"
                      aria-label="Vue liste"
                      onClick={() => setParam("view", "list")}
                    >
                      <List size={18} />
                    </Button>
                  </div>
                </div>
              </div>

              {chips.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-soft pt-4">
                  {chips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      className="inline-flex max-w-full items-center gap-2 rounded-[9px] bg-nahda-olive-soft px-3 py-2 text-xs font-black text-nahda-olive-dark transition hover:bg-[#dfecc8]"
                      onClick={chip.onRemove}
                    >
                      <span className="truncate">{chip.label}</span>
                      <X size={14} />
                    </button>
                  ))}
                  <button
                    type="button"
                    className="text-xs font-black text-neutral-500 transition hover:text-nahda-olive"
                    onClick={clearFilters}
                  >
                    Tout effacer
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-5" data-testid="catalogue-results">
              {filteredProducts.length === 0 ? (
                <EmptyState
                  title="Aucun résultat"
                  description="Aucun produit ne correspond à ces filtres. Essayez une marque, une plage de prix ou une disponibilité différente."
                  action={
                    <Button onClick={clearFilters}>
                      <RotateCcw size={16} />
                      Réinitialiser les filtres
                    </Button>
                  }
                />
              ) : view === "grid" ? (
                <div
                  className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                  data-testid="catalogue-grid"
                >
                  {visibleProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={toProductCardProduct(product)}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4" data-testid="catalogue-list">
                  {visibleProducts.map((product) => (
                    <CatalogueProductRow key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>

            {visibleProducts.length < filteredProducts.length ? (
              <div className="mt-8 flex justify-center">
                <Button
                  size="lg"
                  onClick={() =>
                    setVisibleCount((count) => count + productLimitStep)
                  }
                >
                  Charger plus
                  <ArrowRight size={18} />
                </Button>
              </div>
            ) : null}
          </section>
        </div>
      </Container>

      <Drawer
        open={drawerOpen}
        title="Filtres catalogue"
        side="right"
        onClose={() => setDrawerOpen(false)}
      >
        {renderFiltersPanel()}
        <div className="sticky bottom-0 -mx-5 mt-5 grid grid-cols-[1fr_1.25fr] gap-2 border-t border-border-soft bg-white/95 px-5 py-4 backdrop-blur lg:hidden">
          <Button variant="outline" onClick={clearFilters}>
            <RotateCcw size={16} />
            Réinitialiser
          </Button>
          <Button onClick={() => setDrawerOpen(false)}>
            Voir les produits
            <ArrowRight size={16} />
          </Button>
        </div>
      </Drawer>
    </main>
  );
}

function FilterGroup({
  title,
  children,
  defaultOpen = false,
  tone = "advanced",
  activeCount = 0,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  tone?: "primary" | "advanced";
  activeCount?: number;
}) {
  return (
    <details
      open={defaultOpen || activeCount > 0}
      className={cn(
        "min-w-0 rounded-card border bg-white px-3 py-2 shadow-sm",
        tone === "primary"
          ? "border-nahda-olive/[0.22]"
          : "border-border-soft",
      )}
    >
      <summary className="flex min-w-0 cursor-pointer list-none items-center justify-between gap-3 py-2 text-sm font-black text-nahda-ink">
        <span className="min-w-0 flex-1 break-words leading-5">{title}</span>
        {activeCount > 0 ? (
          <span className="shrink-0 rounded-full bg-nahda-olive px-2 py-0.5 text-[11px] text-white">
            {activeCount}
          </span>
        ) : null}
      </summary>
      <div className="min-w-0 border-t border-border-soft pt-3">{children}</div>
    </details>
  );
}

function CountedCheckboxGroup({
  title,
  options,
  selected,
  counts,
  onToggle,
  searchable = false,
  showEmptyOptions = false,
  defaultOpen = false,
  tone = "advanced",
}: {
  title: string;
  options: FilterOption[];
  selected: string[];
  counts: Record<string, number>;
  onToggle: (value: string) => void;
  searchable?: boolean;
  showEmptyOptions?: boolean;
  defaultOpen?: boolean;
  tone?: "primary" | "advanced";
}) {
  const visibleOptions = getVisibleOptions(
    options,
    counts,
    selected,
    showEmptyOptions,
  );

  if (visibleOptions.length === 0) {
    return null;
  }

  return (
    <FilterGroup
      title={title}
      defaultOpen={defaultOpen}
      tone={tone}
      activeCount={selected.length}
    >
      <CheckboxList
        options={visibleOptions}
        selected={selected}
        counts={counts}
        searchable={searchable || visibleOptions.length >= 8}
        onToggle={onToggle}
      />
    </FilterGroup>
  );
}

function CheckboxList({
  options,
  selected,
  counts,
  searchable = false,
  onToggle,
}: {
  options: FilterOption[];
  selected: string[];
  counts?: Record<string, number>;
  searchable?: boolean;
  onToggle: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) =>
        option.label.toLowerCase().includes(normalizedQuery),
      )
    : options;

  return (
    <div className="grid gap-2.5">
      {searchable ? (
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher dans les filtres..."
          className="focus-ring h-10 min-w-0 rounded-control border border-border-soft px-3 text-sm text-nahda-ink shadow-sm"
        />
      ) : null}
      {filteredOptions.map((option) => (
        <label
          key={option.value}
          className="flex min-w-0 cursor-pointer items-start gap-2.5 text-sm text-neutral-700"
        >
          <input
            type="checkbox"
            checked={selected.includes(option.value)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-nahda-olive"
            onChange={() => onToggle(option.value)}
          />
          <span className="min-w-0 flex-1 break-words leading-5">{option.label}</span>
          {counts ? (
            <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-black text-neutral-500">
              {counts[option.value] ?? 0}
            </span>
          ) : null}
        </label>
      ))}
      {filteredOptions.length === 0 ? (
        <p className="rounded-[8px] bg-surface-muted px-3 py-2 text-xs font-bold text-neutral-500">
          Aucun filtre trouvé
        </p>
      ) : null}
    </div>
  );
}

function RadioList({
  options,
  value,
  onChange,
}: {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2.5">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex min-w-0 cursor-pointer items-start gap-2.5 text-sm text-neutral-700"
        >
          <input
            type="radio"
            checked={value === option.value}
            className="mt-0.5 h-4 w-4 shrink-0 accent-nahda-olive"
            onChange={() => onChange(option.value)}
          />
          <span className="inline-flex min-w-0 items-start gap-1.5 break-words">
            <Star size={14} className="fill-[#f7b500] text-[#f7b500]" />
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}

function ToggleLine({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full min-w-0 items-center justify-between gap-3 text-left text-sm font-bold text-neutral-700"
      onClick={onChange}
    >
      <span className="min-w-0 flex-1 break-words leading-5">{label}</span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition",
          checked
            ? "border-nahda-olive bg-nahda-olive"
            : "border-border-soft bg-surface-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition",
            checked ? "left-6" : "left-1",
          )}
        />
      </span>
    </button>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[10px] border border-white/10 bg-white/[0.08] p-3">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase text-white/[0.6]">
        {label}
      </p>
    </div>
  );
}

function getMulti(params: QueryReader, key: string) {
  return (
    params
      .get(key)
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? []
  );
}

function getSortKey(value: string | null): SortKey {
  return sortOptions.some((option) => option.value === value)
    ? (value as SortKey)
    : "relevance";
}

function getViewMode(value: string | null): ProductViewMode {
  return value === "list" ? "list" : "grid";
}

function countOptions(
  products: CatalogProduct[],
  options: FilterOption[],
  getValues: (product: CatalogProduct) => string[],
) {
  const counts = Object.fromEntries(
    options.map((option) => [option.value, 0]),
  ) as Record<string, number>;

  products.forEach((product) => {
    const values = getValues(product).map(String);
    options.forEach((option) => {
      if (values.includes(option.value)) {
        counts[option.value] = (counts[option.value] ?? 0) + 1;
      }
    });
  });

  return counts;
}

function countAttributeOptions(
  products: CatalogProduct[],
  filter: DynamicFilterAttribute,
) {
  return countOptions(products, filter.options, (product) => {
    const value = product.attributes[filter.slug];

    if (Array.isArray(value)) {
      return value.map(String);
    }

    if (value === undefined || value === null) {
      return [];
    }

    return [String(value)];
  });
}

function getVisibleOptions(
  options: FilterOption[],
  counts: Record<string, number>,
  selected: string[],
  showEmptyOptions = false,
) {
  if (showEmptyOptions) {
    return options;
  }

  return options.filter(
    (option) => (counts[option.value] ?? 0) > 0 || selected.includes(option.value),
  );
}

function attributeMatches(
  product: CatalogProduct,
  attributeKey: string,
  selectedValues: string[],
) {
  const value = product.attributes[attributeKey];

  if (Array.isArray(value)) {
    return value.some((entry) => selectedValues.includes(String(entry)));
  }

  return selectedValues.includes(String(value));
}

function productMatchesQuery(product: CatalogProduct, query: string) {
  const haystack = [
    product.name,
    product.slug,
    product.brandSlug,
    product.categorySlug,
    product.specs.join(" "),
    Object.values(product.attributes).flat().join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function sortProducts(first: CatalogProduct, second: CatalogProduct, sort: SortKey) {
  if (sort === "price-asc") {
    return first.price - second.price;
  }

  if (sort === "price-desc") {
    return second.price - first.price;
  }

  if (sort === "newest") {
    return (
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    );
  }

  if (sort === "best-sellers") {
    return first.salesRank - second.salesRank;
  }

  if (sort === "promotions") {
    return Number(second.isPromo) - Number(first.isPromo) || first.salesRank - second.salesRank;
  }

  return first.salesRank - second.salesRank;
}

function buildChips({
  attributeFilters,
  categoryOptions,
  includeCategoryChips,
  params,
  removeParamValue,
  setParam,
}: {
  attributeFilters: DynamicFilterAttribute[];
  categoryOptions: FilterOption[];
  includeCategoryChips: boolean;
  params: QueryReader;
  removeParamValue: (key: string, value: string) => void;
  setParam: (key: string, value: string | null) => void;
}) {
  const chips: Chip[] = [];

  const pushMulti = (
    key: string,
    labelPrefix: string,
    options: FilterOption[],
    fallback?: (value: string) => string,
  ) => {
    getMulti(params, key).forEach((value) => {
      const optionLabel =
        options.find((option) => option.value === value)?.label ??
        fallback?.(value) ??
        value;
      chips.push({
        key: `${key}:${value}`,
        label: `${labelPrefix}: ${optionLabel}`,
        onRemove: () => removeParamValue(key, value),
      });
    });
  };

  if (params.get("min")) {
    chips.push({
      key: "min",
      label: `Prix min: ${formatMad(Number(params.get("min")))}`,
      onRemove: () => setParam("min", null),
    });
  }

  if (params.get("max")) {
    chips.push({
      key: "max",
      label: `Prix max: ${formatMad(Number(params.get("max")))}`,
      onRemove: () => setParam("max", null),
    });
  }

  if (includeCategoryChips) {
    pushMulti("category", "Catégorie", categoryOptions);
  }
  pushMulti("brand", "Marque", [], getBrandName);
  pushMulti(
    "stock",
    "Disponibilité",
    stockOptions,
    (value) => stockOptions.find((option) => option.value === value)?.label ?? value,
  );
  pushMulti("stockLocation", "Dépôt", stockLocationOptions, (value) =>
    stockLocationLabels[value as keyof typeof stockLocationLabels] ?? value,
  );
  pushMulti("deliveryMode", "Livraison", deliveryModeOptions, (value) =>
    deliveryModeLabels[value as keyof typeof deliveryModeLabels] ?? value,
  );
  pushMulti("purchaseType", "Achat", purchaseTypeOptions, (value) =>
    purchaseTypeLabels[value as keyof typeof purchaseTypeLabels] ?? value,
  );
  pushMulti("audience", "Destiné à", audienceOptions, (value) =>
    audienceLabels[value as keyof typeof audienceLabels] ?? value,
  );
  pushMulti("range", "Gamme", rangeOptions, (value) =>
    rangeLabels[value as keyof typeof rangeLabels] ?? value,
  );
  pushMulti("series", "Série", seriesOptions);
  pushMulti("warrantyProvider", "Garantie", warrantyProviderOptions, (value) =>
    warrantyProviderLabels[value as keyof typeof warrantyProviderLabels] ??
    value,
  );
  pushMulti("warranty", "Garantie", warrantyOptions);
  pushMulti("condition", "État", conditionOptions, (value) =>
    conditionLabels[value as keyof typeof conditionLabels] ?? value,
  );
  pushMulti("usage", "Usage", usageOptions, (value) =>
    usageLabels[value as keyof typeof usageLabels] ?? value,
  );

  if (params.get("promo") === "1") {
    chips.push({
      key: "promo",
      label: "Promotion",
      onRemove: () => setParam("promo", null),
    });
  }

  if (params.get("delivery") === "1") {
    chips.push({
      key: "delivery",
      label: "Livraison disponible",
      onRemove: () => setParam("delivery", null),
    });
  }

  if (params.get("b2b") === "1") {
    chips.push({
      key: "b2b",
      label: "Compatible devis B2B",
      onRemove: () => setParam("b2b", null),
    });
  }

  if (params.get("new") === "1") {
    chips.push({
      key: "new",
      label: "Nouveauté",
      onRemove: () => setParam("new", null),
    });
  }

  if (params.get("best") === "1") {
    chips.push({
      key: "best",
      label: "Meilleure vente",
      onRemove: () => setParam("best", null),
    });
  }

  if (params.get("recommended") === "1") {
    chips.push({
      key: "recommended",
      label: "Produit recommandé",
      onRemove: () => setParam("recommended", null),
    });
  }

  if (params.get("rating")) {
    chips.push({
      key: "rating",
      label: `Note: ${params.get("rating")}+`,
      onRemove: () => setParam("rating", null),
    });
  }

  attributeFilters.forEach((filter) => {
    pushMulti(`attr_${filter.slug}`, filter.label, filter.options);
  });

  return chips;
}
