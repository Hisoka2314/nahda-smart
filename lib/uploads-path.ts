import path from "node:path";

// Emplacement des fichiers televerses depuis le back-office (images produits,
// logos de marques, bannieres de categories).
//
// Par defaut public/uploads, pratique en developpement. En production on le
// place hors du depot via UPLOADS_DIR, pour que les images survivent aux mises
// a jour du code.
//
// Un lien symbolique depuis public/uploads ne convient pas : Turbopack refuse
// les liens qui sortent de la racine du projet et le build echoue avec
// "Symlink ... points out of the filesystem root". D'ou ce chemin configurable.
//
// Ces fichiers ne sont jamais servis par Next.js directement : ils passent par
// la route app/uploads/[...path], qui valide le type et le chemin.
export function getUploadsRoot(): string {
  const configured = process.env.UPLOADS_DIR?.trim();

  if (configured) {
    return path.normalize(path.resolve(configured));
  }

  return path.normalize(path.join(process.cwd(), "public", "uploads"));
}
