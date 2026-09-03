// Application des prix de vente sur le catalogue importe depuis l'inventaire.
//
// Utilisation :
//   node scripts/import-prices.mjs <fichier.csv> [--apply]
//
// Sans --apply, le script se contente d'un rapport : aucune ecriture.
//
// Le CSV attendu porte les colonnes :
//   reference,nom,prix_achat,prix_vente,prix_promo,garantie,publier
//
// Regles appliquees :
//   - La reference est la cle de rapprochement : elle correspond au SKU pose
//     par scripts/import-inventory.mjs. Une reference inconnue est signalee,
//     jamais creee ici : ce script tarife, il n'ajoute pas de produit.
//   - margin est stockee en dirhams (priceSell - priceBuy), comme le fait
//     lib/services/admin-products.ts. Pas en pourcentage.
//   - Un produit ne passe PUBLISHED que si publier=1 ET prix de vente > 0.
//     Un prix de vente nul sur un produit en ligne afficherait "0 DH" en
//     boutique : la garde est volontairement redondante avec le CSV.
//   - Le statut n'est jamais retrograde : un produit deja PUBLISHED, ON_ORDER
//     ou OUT_OF_STOCK garde son statut, seuls les prix sont mis a jour. Les
//     decisions prises depuis le back-office priment sur un reimport.
//   - Idempotent : relancable, seules les lignes reellement differentes sont
//     ecrites.

import { readFileSync } from "node:fs";
import pg from "pg";

const [, , csvPath, ...flags] = process.argv;
const apply = flags.includes("--apply");

if (!csvPath) {
  console.error("Usage : node scripts/import-prices.mjs <fichier.csv> [--apply]");
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

function lireCsv(texte) {
  const lignes = texte.replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const entetes = decouperLigneCsv(lignes[0]).map((h) => h.trim().toLowerCase());

  return lignes.slice(1).map((ligne) => {
    const cellules = decouperLigneCsv(ligne);
    return Object.fromEntries(entetes.map((h, i) => [h, (cellules[i] ?? "").trim()]));
  });
}

function nombre(valeur) {
  if (valeur === "" || valeur === undefined) return null;
  const n = Number(valeur.replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

const lignes = lireCsv(readFileSync(csvPath, "utf8"));
const client = new pg.Client({ connectionString: databaseUrl });

const stats = {
  lues: lignes.length,
  sansPrix: 0,
  introuvables: 0,
  inchanges: 0,
  tarifes: 0,
  publies: 0,
  statutPreserve: 0,
};

const introuvables = [];
const preserves = [];

try {
  await client.connect();

  const { rows: produits } = await client.query(
    `SELECT id, sku, name, status, "priceBuy", "priceSell", "promoPrice",
            "warrantyMonths", margin
       FROM "Product"`,
  );

  // Index insensible a la casse : les references d'inventaire sont saisies a
  // la main, la casse n'est pas fiable alors que la valeur l'est.
  const parSku = new Map(produits.map((p) => [p.sku.toUpperCase(), p]));

  if (apply) await client.query("BEGIN");

  for (const ligne of lignes) {
    const reference = (ligne.reference ?? "").trim();
    if (!reference) continue;

    const produit = parSku.get(reference.toUpperCase());

    if (!produit) {
      stats.introuvables += 1;
      if (introuvables.length < 15) introuvables.push(reference);
      continue;
    }

    const prixAchat = nombre(ligne.prix_achat);
    const prixVente = nombre(ligne.prix_vente);
    const prixPromo = nombre(ligne.prix_promo);
    const garantie = nombre(ligne.garantie);

    if (prixVente === null || prixVente <= 0) {
      stats.sansPrix += 1;
      continue;
    }

    const nouveauAchat = prixAchat ?? Number(produit.priceBuy);
    const nouvelleGarantie = garantie ?? produit.warrantyMonths;
    const nouvelleMarge = Math.round((prixVente - nouveauAchat) * 100) / 100;

    // ON_ORDER et OUT_OF_STOCK sont des decisions commerciales prises depuis
    // le back-office : un reimport de prix ne doit pas les effacer.
    const publiable = ligne.publier === "1";
    const dejaDecide = produit.status !== "DRAFT";
    const nouveauStatut = publiable && !dejaDecide ? "PUBLISHED" : produit.status;

    if (publiable && dejaDecide && produit.status !== "PUBLISHED") {
      stats.statutPreserve += 1;
      if (preserves.length < 10) preserves.push(`${produit.sku} (${produit.status})`);
    }

    const identique =
      Number(produit.priceBuy) === nouveauAchat &&
      Number(produit.priceSell) === prixVente &&
      Number(produit.promoPrice ?? 0) === (prixPromo ?? 0) &&
      produit.warrantyMonths === nouvelleGarantie &&
      produit.status === nouveauStatut;

    if (identique) {
      stats.inchanges += 1;
      continue;
    }

    stats.tarifes += 1;
    if (nouveauStatut === "PUBLISHED" && produit.status !== "PUBLISHED") {
      stats.publies += 1;
    }

    if (apply) {
      await client.query(
        `UPDATE "Product"
            SET "priceBuy" = $2,
                "priceSell" = $3,
                "promoPrice" = $4,
                "isPromo" = $5,
                "warrantyMonths" = $6,
                margin = $7,
                status = $8,
                "updatedAt" = NOW()
          WHERE id = $1`,
        [
          produit.id,
          nouveauAchat,
          prixVente,
          prixPromo,
          prixPromo !== null && prixPromo > 0,
          nouvelleGarantie,
          nouvelleMarge,
          nouveauStatut,
        ],
      );
    }
  }

  if (apply) await client.query("COMMIT");
} catch (erreur) {
  if (apply) await client.query("ROLLBACK").catch(() => {});
  console.error("Import interrompu :", erreur.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

console.log(apply ? "=== IMPORT APPLIQUE ===" : "=== SIMULATION (ajouter --apply pour ecrire) ===");
console.log(`Lignes lues                     : ${stats.lues}`);
console.log(`Produits tarifes                : ${stats.tarifes}`);
console.log(`  dont mis en ligne             : ${stats.publies}`);
console.log(`Deja a jour                     : ${stats.inchanges}`);
console.log(`Sans prix de vente (ignores)    : ${stats.sansPrix}`);
console.log(`References introuvables         : ${stats.introuvables}`);

if (introuvables.length > 0) {
  console.log(`   ${introuvables.join(", ")}${stats.introuvables > introuvables.length ? " ..." : ""}`);
}

if (stats.statutPreserve > 0) {
  console.log(`Statut back-office preserve     : ${stats.statutPreserve}`);
  console.log(`   ${preserves.join(", ")}`);
}
