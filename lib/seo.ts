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

// Le site n'est indexable que sur un vrai nom de domaine : ni les
// environnements de preversion, ni un serveur encore joignable par son IP
// seule ne doivent concurrencer le site de production dans les resultats.
export function isIndexable(): boolean {
  // Interrupteur manuel : utile sur une adresse provisoire (sous-domaine
  // gratuit en attendant l'achat du vrai domaine) pour eviter que Google ne
  // reference une URL qui sera abandonnee. A definir avant "npm run build".
  if (process.env.SEO_NOINDEX === "1") return false;

  let host: string;

  try {
    host = new URL(getSiteUrl()).hostname.toLowerCase();
  } catch {
    return false;
  }

  if (host === "localhost" || host.endsWith(".local")) return false;

  // Adresse IP nue : cas d'un VPS mis en service avant le branchement du
  // domaine. Le site tourne, mais il ne doit pas etre reference ainsi.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  if (host.startsWith("[") || host.includes(":")) return false;

  // Un domaine reel comporte au moins un point (exemple.ma).
  return host.includes(".");
}
