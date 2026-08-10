import type { MetadataRoute } from "next";
import { getPrismaClient } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";

// Regenere avec la meme cadence que les pages ISR produit/categorie.
export const revalidate = 300;

const staticPaths: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/catalogue", changeFrequency: "daily", priority: 0.9 },
  { path: "/a-propos", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/magasins", changeFrequency: "monthly", priority: 0.6 },
  { path: "/demande-devis", changeFrequency: "monthly", priority: 0.7 },
  { path: "/garantie-sav", changeFrequency: "yearly", priority: 0.4 },
  { path: "/livraison-retour", changeFrequency: "yearly", priority: 0.4 },
  { path: "/conditions-generales", changeFrequency: "yearly", priority: 0.2 },
  { path: "/politique-confidentialite", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = staticPaths.map((entry) => ({
    url: absoluteUrl(entry.path),
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  try {
    const db = getPrismaClient();
    const [categories, products] = await Promise.all([
      db.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      db.product.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5000,
      }),
    ]);

    for (const category of categories) {
      entries.push({
        url: absoluteUrl(`/categorie/${category.slug}`),
        lastModified: category.updatedAt,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    for (const product of products) {
      entries.push({
        url: absoluteUrl(`/produit/${product.slug}`),
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // Base indisponible : on sert au moins les pages statiques plutot qu'une
    // erreur, un sitemap partiel valant mieux qu'aucun sitemap.
  }

  return entries;
}
