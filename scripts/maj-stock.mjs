// Mise a jour des quantites en stock depuis un inventaire.
//
// Utilisation :
//   node scripts/maj-stock.mjs <fichier.csv> [--apply]
//
// Sans --apply, le script se contente d'un rapport : aucune ecriture.
//
// Le CSV attendu porte deux colonnes : reference,quantite
//
// Attention en le produisant depuis le tableur d'inventaire : une reference
// peut y figurer sur plusieurs lignes, chacune ne portant qu'une partie de
// l'information. PNE1 avait son stock theorique sur une ligne et son comptage
// physique sur une autre : garder la premiere occurrence perdait le comptage
// et declarait l'article en rupture. Il faut fusionner les lignes d'une meme
// reference, pas en choisir une.
//
// A jouer apres chaque comptage mensuel. Contrairement a l'import
// d'inventaire, ce script ne cree aucun produit : il ne fait que corriger les
// quantites des references qu'il reconnait.
//
// Une quantite a zero est une information, pas une absence : le produit reste
// en ligne et bascule en "Rupture", avec le bouton "Sur commande". C'est
// voulu, la fiche continue d'exister pour le referencement et le client peut
// toujours demander l'article.

import { readFileSync } from "node:fs";
import pg from "pg";

const [, , csvPath, ...flags] = process.argv;
const apply = flags.includes("--apply");

if (!csvPath) {
  console.error("Usage : node scripts/maj-stock.mjs <fichier.csv> [--apply]");
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

const texte = readFileSync(csvPath, "utf8").replace(/^﻿/, "");
const lignes = texte.split(/\r?\n/).filter(Boolean);
const entetes = decouperLigneCsv(lignes[0]).map((h) => h.trim().toLowerCase());

const attendues = lignes.slice(1).map((ligne) => {
  const cellules = decouperLigneCsv(ligne);
  const enregistrement = Object.fromEntries(
    entetes.map((h, i) => [h, (cellules[i] ?? "").trim()]),
  );
  return {
    reference: enregistrement.reference,
    quantite: Math.max(0, Number(enregistrement.quantite) || 0),
  };
});

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

const stats = { lues: attendues.length, introuvables: 0, inchanges: 0, modifies: 0, vers0: 0, depuis0: 0 };
const introuvables = [];
const passagesEnRupture = [];

try {
  const depot = (
    await client.query(
      `SELECT id, name FROM "Depot" WHERE "isActive" ORDER BY (type = 'MAIN_DEPOT') DESC LIMIT 1`,
    )
  ).rows[0];

  if (!depot) throw new Error("Aucun depot actif.");

  const { rows: produits } = await client.query(`
    SELECT p.id, p.sku, p.name, p.status,
           COALESCE(SUM(s.quantity), 0)::int AS stock
      FROM "Product" p
      LEFT JOIN "Stock" s ON s."productId" = p.id
     GROUP BY p.id`);

  const parSku = new Map(produits.map((p) => [p.sku.toUpperCase(), p]));

  if (apply) await client.query("BEGIN");

  for (const attendue of attendues) {
    if (!attendue.reference) continue;

    const produit = parSku.get(attendue.reference.toUpperCase());

    if (!produit) {
      stats.introuvables += 1;
      if (introuvables.length < 12) introuvables.push(attendue.reference);
      continue;
    }

    if (produit.stock === attendue.quantite) {
      stats.inchanges += 1;
      continue;
    }

    stats.modifies += 1;

    if (attendue.quantite === 0 && produit.stock > 0) {
      stats.vers0 += 1;
      if (passagesEnRupture.length < 15) {
        passagesEnRupture.push(`${produit.sku.padEnd(18)} ${produit.name.slice(0, 44)}`);
      }
    }
    if (attendue.quantite > 0 && produit.stock === 0) stats.depuis0 += 1;

    if (apply) {
      await client.query(
        `INSERT INTO "Stock" (id, "productId", "depotId", quantity, "lowStockThreshold")
         VALUES (gen_random_uuid()::text, $1, $2, $3, 3)
         ON CONFLICT ("productId", "depotId")
         DO UPDATE SET quantity = EXCLUDED.quantity`,
        [produit.id, depot.id, attendue.quantite],
      );
    }
  }

  if (apply) await client.query("COMMIT");

  console.log(apply ? "=== STOCK MIS A JOUR ===" : "=== SIMULATION (ajouter --apply pour ecrire) ===");
  console.log(`Depot                    : ${depot.name}`);
  console.log(`Lignes lues              : ${stats.lues}`);
  console.log(`Quantites corrigees      : ${stats.modifies}`);
  console.log(`  passages en rupture    : ${stats.vers0}`);
  console.log(`  retours en stock       : ${stats.depuis0}`);
  console.log(`Deja a jour              : ${stats.inchanges}`);
  console.log(`References introuvables  : ${stats.introuvables}`);

  if (introuvables.length > 0) {
    console.log(`   ${introuvables.join(", ")}${stats.introuvables > introuvables.length ? " ..." : ""}`);
  }

  if (passagesEnRupture.length > 0) {
    console.log();
    console.log("Produits qui passent en rupture :");
    passagesEnRupture.forEach((l) => console.log(`   ${l}`));
    if (stats.vers0 > passagesEnRupture.length) {
      console.log(`   ... et ${stats.vers0 - passagesEnRupture.length} autres`);
    }
  }
} catch (erreur) {
  if (apply) await client.query("ROLLBACK").catch(() => {});
  console.error("Interrompu :", erreur.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
