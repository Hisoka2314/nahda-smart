export type BrandAsset = {
  id: string;
  name: string;
  slug: string;
  logoPath?: string;
  fallbackLabel: string;
  isActive: boolean;
  isOfficialAsset: boolean;
  allowAdminUpload: boolean;
  sortOrder: number;
  updatedAt: string;
};

type BrandSeed = Pick<
  BrandAsset,
  "id" | "name" | "slug" | "fallbackLabel" | "sortOrder"
>;

export const brandSeeds = [
  { id: "brand-hp", name: "HP", slug: "hp", fallbackLabel: "HP", sortOrder: 10 },
  { id: "brand-dell", name: "Dell", slug: "dell", fallbackLabel: "Dell", sortOrder: 20 },
  { id: "brand-lenovo", name: "Lenovo", slug: "lenovo", fallbackLabel: "Lenovo", sortOrder: 30 },
  { id: "brand-asus", name: "ASUS", slug: "asus", fallbackLabel: "ASUS", sortOrder: 40 },
  { id: "brand-tp-link", name: "TP-Link", slug: "tp-link", fallbackLabel: "TP-Link", sortOrder: 50 },
  { id: "brand-d-link", name: "D-Link", slug: "d-link", fallbackLabel: "D-Link", sortOrder: 60 },
  { id: "brand-hikvision", name: "Hikvision", slug: "hikvision", fallbackLabel: "Hikvision", sortOrder: 70 },
  { id: "brand-dahua", name: "Dahua", slug: "dahua", fallbackLabel: "Dahua", sortOrder: 80 },
  { id: "brand-epson", name: "Epson", slug: "epson", fallbackLabel: "Epson", sortOrder: 90 },
  { id: "brand-logitech", name: "Logitech", slug: "logitech", fallbackLabel: "Logitech", sortOrder: 100 },
  { id: "brand-yealink", name: "Yealink", slug: "yealink", fallbackLabel: "Yealink", sortOrder: 110 },
  { id: "brand-apc", name: "APC", slug: "apc", fallbackLabel: "APC", sortOrder: 120 },
  { id: "brand-kingston", name: "Kingston", slug: "kingston", fallbackLabel: "Kingston", sortOrder: 130 },
] satisfies BrandSeed[];

export const managedBrandAssets: BrandAsset[] = brandSeeds.map((brand) => ({
  ...brand,
  logoPath: undefined,
  isActive: true,
  isOfficialAsset: false,
  allowAdminUpload: true,
  updatedAt: "2026-06-19",
}));

export const activeBrandAssets = managedBrandAssets
  .filter((brand) => brand.isActive)
  .sort((first, second) => first.sortOrder - second.sortOrder);

export const trustedBrands = activeBrandAssets.map((brand) => brand.name);

export const brandAssets = activeBrandAssets;

export const brandAssetMap = activeBrandAssets.reduce<Record<string, BrandAsset>>(
  (accumulator, brand) => {
    accumulator[brand.name] = brand;
    return accumulator;
  },
  {},
);

export const brandSlugMap = activeBrandAssets.reduce<Record<string, BrandAsset>>(
  (accumulator, brand) => {
    accumulator[brand.slug] = brand;
    return accumulator;
  },
  {},
);
