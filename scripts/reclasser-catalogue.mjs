// Creation des categories manquantes et reclassement des produits importes.
//
// Utilisation :
//   node scripts/reclasser-catalogue.mjs <inventaire.csv> [--apply]
//
// Sans --apply, le script se contente d'un rapport : aucune ecriture.
//
// Le CSV fournit le code famille de chaque reference ; la cartographie de
// scripts/lib/familles.mjs dit dans quelle categorie il tombe. Le script ne
// cree ni ne supprime aucun produit : il ne fait que les ranger.
//
// A relancer apres toute modification de la cartographie.

import { readFileSync } from "node:fs";
import crypto from "node:crypto";
import pg from "pg";
import {
  CATEGORIES_SUPPLEMENTAIRES,
  categoriePourFamille,
} from "./lib/familles.mjs";

const [, , csvPath, ...flags] = process.argv;
const apply = flags.includes("--apply");

if (!csvPath) {
  console.error("Usage : node scripts/reclasser-catalogue.mjs <inventaire.csv> [--apply]");
  process.exit(1);
}

const databaseUrl =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!databaseUrl) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

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

const inventaire = new Map();
for (const ligne of lignes.slice(1)) {
  const cellules = decouperLigneCsv(ligne);
  const e = Object.fromEntries(entetes.map((h, i) => [h, (cellules[i] ?? "").trim()]));
  if (e.reference) inventaire.set(e.reference.toUpperCase(), e.famille);
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

const stats = { creees: 0, deplaces: 0, inchanges: 0, horsInventaire: 0 };
const mouvements = new Map();

try {
  if (apply) await client.query("BEGIN");

  // --- categories manquantes ---------------------------------------------
  for (const categorie of CATEGORIES_SUPPLEMENTAIRES) {
    const { rows } = await client.query(`SELECT id FROM "Category" WHERE slug = $1`, [
      categorie.slug,
    ]);

    if (rows.length > 0) continue;

    stats.creees += 1;

    if (apply) {
      await client.query(
        `INSERT INTO "Category" (id, name, slug, description, "bannerUrl", "order", "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())`,
        [
          crypto.randomUUID(),
          categorie.name,
          categorie.slug,
          categorie.description,
          categorie.bannerUrl,
          categorie.order,
        ],
      );
    }
  }

  // En simulation les nouvelles categories n'existent pas encore : on ne peut
  // donc pas resoudre leur identifiant, mais on sait deja quoi deplacer.
  const { rows: cats } = await client.query(`SELECT id, slug, name FROM "Category"`);
  const parSlug = new Map(cats.map((c) => [c.slug, c]));

  const { rows: produits } = await client.query(`
    SELECT p.id, p.sku, p.name, c.slug AS actuelle, c.name AS actuelle_nom
      FROM "Product" p JOIN "Category" c ON c.id = p."categoryId"`);

  for (const produit of produits) {
    const famille = inventaire.get(produit.sku.toUpperCase());

    if (famille === undefined) {
      stats.horsInventaire += 1;
      continue;
    }

    const voulue = categoriePourFamille(famille);

    if (voulue === produit.actuelle) {
      stats.inchanges += 1;
      continue;
    }

    stats.deplaces += 1;
    const cle = `${produit.actuelle} -> ${voulue}`;
    mouvements.set(cle, (mouvements.get(cle) ?? 0) + 1);

    if (apply) {
      const cible = parSlug.get(voulue);
      if (!cible) throw new Error(`Categorie absente : ${voulue}`);

      await client.query(
        `UPDATE "Product" SET "categoryId" = $2, "updatedAt" = NOW() WHERE id = $1`,
        [produit.id, cible.id],
      );
    }
  }

  if (apply) await client.query("COMMIT");

  console.log(apply ? "=== RECLASSEMENT APPLIQUE ===" : "=== SIMULATION (ajouter --apply) ===");
  console.log(`Categories creees        : ${stats.creees}`);
  console.log(`Produits deplaces        : ${stats.deplaces}`);
  console.log(`Deja bien ranges         : ${stats.inchanges}`);
  console.log(`Hors inventaire (ignores): ${stats.horsInventaire}`);

  if (mouvements.size > 0) {
    console.log("\nDeplacements :");
    for (const [cle, n] of [...mouvements].sort((a, b) => b[1] - a[1])) {
      console.log(`   ${String(n).padStart(4)}  ${cle}`);
    }
  }

  if (apply) {
    const { rows: repartition } = await client.query(`
      SELECT c.name, count(p.id)::int n
        FROM "Category" c LEFT JOIN "Product" p ON p."categoryId" = c.id AND p.status <> 'ARCHIVED'
       GROUP BY c.id ORDER BY n DESC`);
    console.log("\nRepartition finale :");
    repartition
      .filter((r) => r.n > 0)
      .forEach((r) => console.log(`   ${String(r.n).padStart(4)}  ${r.name}`));
    console.log("\nPensez a redemarrer le service : systemctl restart nahda");
  }
} catch (erreur) {
  if (apply) await client.query("ROLLBACK").catch(() => {});
  console.error("Interrompu :", erreur.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
