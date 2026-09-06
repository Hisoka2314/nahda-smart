// Creation des categories manquantes et reclassement des produits importes.
//
// Utilisation :
//   node scripts/reclasser-catalogue.mjs [inventaire.csv] [--apply]
//
// Sans --apply, le script se contente d'un rapport : aucune ecriture.
//
// Le code famille de chaque reference dit dans quelle categorie elle tombe
// (scripts/lib/familles.mjs), et sa designation quelle marque lui revient
// (scripts/lib/marques.mjs). Le script ne cree ni ne supprime aucun produit :
// il ne fait que les ranger.
//
// Le CSV est facultatif. Sans lui, le script lit les familles dans
// scripts/lib/classement.mjs, qui est versionne, et prend le nom du produit
// en base comme designation. C'est ce qui lui permet de tourner sur le
// serveur : le CSV d'inventaire ne quitte pas le poste du magasin, et le
// deploiement echouait sur un ENOENT.
//
// Les deux sources donnent le meme resultat -- verifie sur les 364 references
// en stock, zero ecart. Passer le CSV reste utile juste apres un inventaire,
// quand des references viennent d'apparaitre et que classement.mjs n'a pas
// encore ete regenere.
//
// A relancer apres toute modification de l'une ou l'autre table.

import { readFileSync } from "node:fs";
import crypto from "node:crypto";
import pg from "pg";
import {
  CATEGORIES_SUPPLEMENTAIRES,
  categoriePourFamille,
} from "./lib/familles.mjs";
import { detecterMarque } from "./lib/marques.mjs";
import { FAMILLE_PAR_REFERENCE } from "./lib/classement.mjs";

const arguments_ = process.argv.slice(2);
const apply = arguments_.includes("--apply");
const csvPath = arguments_.find((a) => !a.startsWith("--"));

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

const inventaire = new Map();

if (csvPath) {
  const lignes = readFileSync(csvPath, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const entetes = decouperLigneCsv(lignes[0]).map((h) => h.trim().toLowerCase());

  for (const ligne of lignes.slice(1)) {
    const cellules = decouperLigneCsv(ligne);
    const e = Object.fromEntries(entetes.map((h, i) => [h, (cellules[i] ?? "").trim()]));
    // La designation est retenue avec la famille : quelques references ne se
    // classent que par leur libelle (voir AJUSTEMENTS_PAR_DESIGNATION).
    if (e.reference) {
      inventaire.set(e.reference.toUpperCase(), {
        famille: e.famille,
        designation: e.designation ?? "",
      });
    }
  }
} else {
  // Pas de CSV : les familles viennent du module versionne, et la designation
  // sera le nom du produit en base, renseigne plus bas.
  for (const [reference, famille] of Object.entries(FAMILLE_PAR_REFERENCE)) {
    inventaire.set(reference, { famille, designation: null });
  }
}

console.log(
  csvPath
    ? `Familles lues dans ${csvPath} (${inventaire.size} references).`
    : `Familles lues dans scripts/lib/classement.mjs (${inventaire.size} references).`,
);

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

const stats = { creees: 0, deplaces: 0, inchanges: 0, horsInventaire: 0, marquesCorrigees: 0 };
const mouvements = new Map();
const corrections = [];

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

  const { rows: marques } = await client.query(`SELECT id, name FROM "Brand"`);
  const parMarque = new Map(marques.map((m) => [m.name.toUpperCase(), m]));

  const { rows: produits } = await client.query(`
    SELECT p.id, p.sku, p.name, c.slug AS actuelle, c.name AS actuelle_nom,
           b.name AS marque_actuelle
      FROM "Product" p
      JOIN "Category" c ON c.id = p."categoryId"
      LEFT JOIN "Brand" b ON b.id = p."brandId"`);

  for (const produit of produits) {
    const article = inventaire.get(produit.sku.toUpperCase());

    if (article === undefined) {
      stats.horsInventaire += 1;
      continue;
    }

    // Sans CSV, le nom du produit tient lieu de designation : l'import l'a
    // tire de la designation d'inventaire, et le classement y lit la meme
    // chose.
    const designation = article.designation ?? produit.name;

    // --- marque ------------------------------------------------------------
    //
    // Meme raison que la categorie : la designation la porte, et la table qui
    // la lit a evolue. Une cartouche Podium annoncee de marque HP est une
    // affirmation fausse sur une fiche produit, il faut pouvoir la rattraper
    // sans reimporter.
    const marqueVoulue = detecterMarque(designation);

    if (marqueVoulue !== produit.marque_actuelle) {
      const cible = parMarque.get(marqueVoulue.toUpperCase());

      if (cible) {
        stats.marquesCorrigees += 1;
        corrections.push(
          `${produit.sku.padEnd(18)} ${produit.marque_actuelle ?? "?"} -> ${marqueVoulue}`,
        );

        if (apply) {
          await client.query(
            `UPDATE "Product" SET "brandId" = $2, "updatedAt" = NOW() WHERE id = $1`,
            [produit.id, cible.id],
          );
        }
      }
    }

    const voulue = categoriePourFamille(article.famille, designation);

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
  console.log(`Marques corrigees        : ${stats.marquesCorrigees}`);

  if (corrections.length > 0) {
    console.log("\nMarques :");
    corrections.forEach((c) => console.log(`   ${c}`));
  }

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
