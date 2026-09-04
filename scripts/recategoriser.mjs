// Reclassement des produits deja importes.
//
// Utilisation :
//   node scripts/recategoriser.mjs <fichier.csv> [--apply]
//
// Sans --apply, le script se contente d'un rapport : aucune ecriture.
//
// L'import d'inventaire est idempotent : il ignore les references deja en
// base. Une correction de la table FAMILLE_VERS_CATEGORIE ne rattrape donc pas
// les produits deja crees. Ce script relit le CSV d'inventaire, reapplique la
// cartographie a jour, et deplace ce qui doit l'etre.
//
// Les familles ecartees (herboristerie) sont archivees plutot que supprimees :
// elles disparaissent de la boutique et du back-office actif, mais restent en
// base si le magasin decide plus tard de leur ouvrir une categorie.

import { readFileSync } from "node:fs";
import pg from "pg";

const [, , csvPath, ...flags] = process.argv;
const apply = flags.includes("--apply");

if (!csvPath) {
  console.error("Usage : node scripts/recategoriser.mjs <fichier.csv> [--apply]");
  process.exit(1);
}

const databaseUrl =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!databaseUrl) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

// La cartographie fait foi dans import-inventory.mjs : on la lit la-bas plutot
// que d'en tenir une deuxieme copie, qui divergerait a la premiere correction.
const source = readFileSync("scripts/import-inventory.mjs", "utf8");

function extraireBloc(nom, ouvrant, fermant) {
  const debut = source.indexOf(nom);
  if (debut < 0) throw new Error(`${nom} introuvable dans import-inventory.mjs`);
  const a = source.indexOf(ouvrant, debut);
  const b = source.indexOf(fermant, a);
  return source.slice(a, b + 1);
}

const FAMILLE_VERS_CATEGORIE = Object.fromEntries(
  [...extraireBloc("const FAMILLE_VERS_CATEGORIE", "{", "}").matchAll(/(\w+):\s*"([a-z-]+)"/g)].map(
    (m) => [m[1], m[2]],
  ),
);

const FAMILLES_IGNOREES = new Set(
  [...extraireBloc("const FAMILLES_IGNOREES", "[", "]").matchAll(/"(\w+)"/g)].map((m) => m[1]),
);

const CATEGORIE_PAR_DEFAUT = "accessoires";

function decouperLigneCsv(ligne) {
  const cellules = [];
  let courant = "";
  let dansGuillemets = false;

  for (let i = 0; i < ligne.length; i += 1) {
    const c = ligne[i];

    if (dansGuillemets) {
      if (c === '"' && ligne[i + 1] === '"') { courant += '"'; i += 1; }
      else if (c === '"') dansGuillemets = false;
      else courant += c;
    } else if (c === '"') dansGuillemets = true;
    else if (c === ",") { cellules.push(courant); courant = ""; }
    else courant += c;
  }

  cellules.push(courant);
  return cellules;
}

const lignes = readFileSync(csvPath, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
const entetes = decouperLigneCsv(lignes[0]).map((h) => h.trim().toLowerCase());
const familleParSku = new Map();

for (const ligne of lignes.slice(1)) {
  const cellules = decouperLigneCsv(ligne);
  const enr = Object.fromEntries(entetes.map((h, i) => [h, (cellules[i] ?? "").trim()]));
  if (enr.reference) familleParSku.set(enr.reference.toUpperCase(), enr.famille.toUpperCase());
}

console.log(`Cartographie lue : ${Object.keys(FAMILLE_VERS_CATEGORIE).length} familles`);
console.log(`Familles ecartees : ${[...FAMILLES_IGNOREES].join(", ") || "aucune"}`);
console.log(`References au CSV : ${familleParSku.size}\n`);

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

try {
  const categories = new Map(
    (await client.query('SELECT slug, id, name FROM "Category"')).rows.map((r) => [
      r.slug,
      { id: r.id, nom: r.name },
    ]),
  );

  const { rows: produits } = await client.query(`
    SELECT p.id, p.sku, p.name, p.status, c.slug AS actuelle, c.name AS actuelle_nom
      FROM "Product" p JOIN "Category" c ON c.id = p."categoryId"`);

  const deplacements = [];
  const archivages = [];

  for (const p of produits) {
    const famille = familleParSku.get(p.sku.toUpperCase());
    if (!famille) continue;

    if (FAMILLES_IGNOREES.has(famille)) {
      if (p.status !== "ARCHIVED") archivages.push({ ...p, famille });
      continue;
    }

    const attendue = FAMILLE_VERS_CATEGORIE[famille] ?? CATEGORIE_PAR_DEFAUT;
    if (attendue !== p.actuelle) deplacements.push({ ...p, famille, attendue });
  }

  console.log(apply ? "=== RECLASSEMENT APPLIQUE ===" : "=== SIMULATION (ajouter --apply) ===");
  console.log(`Produits a deplacer : ${deplacements.length}`);
  console.log(`Produits a archiver : ${archivages.length}\n`);

  const parMouvement = new Map();
  for (const d of deplacements) {
    const cle = `${d.actuelle_nom} -> ${categories.get(d.attendue)?.nom ?? d.attendue}`;
    if (!parMouvement.has(cle)) parMouvement.set(cle, []);
    parMouvement.get(cle).push(d);
  }

  for (const [mouvement, liste] of [...parMouvement].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${String(liste.length).padStart(4)}  ${mouvement}`);
    liste.slice(0, 3).forEach((d) => console.log(`        ${d.sku.padEnd(18)} ${d.name.slice(0, 46)}`));
  }

  if (archivages.length > 0) {
    console.log("\n  A archiver :");
    archivages.forEach((a) => console.log(`        ${a.sku.padEnd(18)} ${a.name}`));
  }

  if (apply) {
    for (const d of deplacements) {
      const cible = categories.get(d.attendue);
      if (!cible) continue;
      await client.query(
        `UPDATE "Product" SET "categoryId" = $2, "updatedAt" = NOW() WHERE id = $1`,
        [d.id, cible.id],
      );
    }

    if (archivages.length > 0) {
      await client.query(
        `UPDATE "Product" SET status = 'ARCHIVED', "updatedAt" = NOW() WHERE id = ANY($1)`,
        [archivages.map((a) => a.id)],
      );
    }

    console.log("\nTermine. Redemarrez le service pour vider le cache des pages :");
    console.log("  systemctl restart nahda");
  }
} catch (erreur) {
  console.error("Interrompu :", erreur.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
