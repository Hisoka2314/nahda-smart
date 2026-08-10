// URL publique du site : sert de base a metadataBase, au sitemap, aux balises
// canoniques et aux donnees structurees. Sans elle, les images Open Graph
// etaient resolues en relatif et aucun apercu ne s'affichait au partage.
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!raw) return "http://localhost:3000";

  return raw.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/"): string {
  return new URL(path, `${getSiteUrl()}/`).toString();
}

// Le site n'est indexable que sur un domaine de production : les
// environnements de preversion ne doivent pas concurrencer le vrai site.
export function isIndexable(): boolean {
  return !/localhost|127\.0\.0\.1|\.local(?::|$)/.test(getSiteUrl());
}
