// Import des fiches techniques constructeur depuis Icecat.
//
// Utilisation :
//   node scripts/import-fiches-icecat.mjs [--apply] [--app-key CLE] [--limit N]
//
// Sans --apply, le script se contente d'un rapport : aucune ecriture.
//
// Icecat ne sert pas qu'a des photos : chaque fiche porte les caracteristiques
// completes redigees par le constructeur, en francais, groupees par theme
// (connectivite, reseau, alimentation, dimensions...). C'est la recherche
// produit faite a la source, et elle vaut mieux que ce qu'on devine d'une
// designation de magasin.
//
// Ce qui est ecrit :
//   - technicalDescription : les caracteristiques, en JSON, rendues sur la
//     page produit dans un bloc "Fiche constructeur".
//   - description : le texte du constructeur, quand il en fournit un.
//   - shortDescription : le resume constructeur, qui tient en une ligne.
//
// Le nom du produit n'est jamais touche : c'est la reference du magasin.

import { readFileSync } from "node:fs";
import pg from "pg";
import { caracteristiques, chercherFiche } from "./lib/icecat.mjs";

const flags = process.argv.slice(2);

function option(nom, defaut = undefined) {
  const i = flags.indexOf(nom);
  return i >= 0 && flags[i + 1] && !flags[i + 1].startsWith("--") ? flags[i + 1] : defaut;
}

const apply = flags.includes("--apply");
const appKey = option("--app-key", process.env.ICECAT_APP_KEY);
const limite = Number(option("--limit", "0")) || Infinity;

const databaseUrl =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!databaseUrl) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

// On ne repasse pas sur les fiches deja renseignees : le script est
// relancable, et une fiche corrigee a la main ne doit pas etre ecrasee.
//
// --refaire leve cette garde, pour retrouver le texte constructeur quand une
// reecriture generale des descriptions l'a recouvert.
const refaire = flags.includes("--refaire");

const { rows: produits } = await client.query(`
  SELECT p.id, p.sku, p.name, p."warrantyMonths", b.name AS marque
    FROM "Product" p JOIN "Brand" b ON b.id = p."brandId"
   WHERE p.status <> 'ARCHIVED'
     AND b.name <> 'Générique'
     AND ${refaire
       ? `p."technicalDescription" IS NOT NULL AND p."technicalDescription" <> ''`
       : `(p."technicalDescription" IS NULL OR p."technicalDescription" = '')`}
   ORDER BY p."priceSell" DESC, p.name`);

console.log(apply ? "=== IMPORT APPLIQUE ===" : "=== SIMULATION (ajouter --apply pour ecrire) ===");
console.log(`Produits de marque sans fiche technique : ${produits.length}`);
console.log("Interrogation d'Icecat, quelques minutes...");
console.log();

const stats = {
  examines: 0, trouves: 0, caracteristiques: 0,
  compatible: 0, sansReference: 0, absent: 0, restreint: 0, reseau: 0,
};
const marquesRestreintes = new Set();
const reussites = [];

try {
  for (const produit of produits) {
    if (stats.examines >= limite) break;
    stats.examines += 1;

    const resultat = await chercherFiche(produit, appKey);

    if (!resultat.fiche) {
      const cle = { compatible: "compatible", "sans-reference": "sansReference",
        absent: "absent", restreint: "restreint", reseau: "reseau" }[resultat.motif];
      if (cle) stats[cle] += 1;
      if (resultat.motif === "restreint") marquesRestreintes.add(produit.marque);
      continue;
    }

    const groupes = caracteristiques(resultat.fiche);
    const info = resultat.fiche.GeneralInfo ?? {};
    const resume = info.SummaryDescription ?? {};

    const nbLignes = groupes.reduce((n, g) => n + g.lignes.length, 0);
    if (nbLignes === 0 && !resume.LongSummaryDescription) {
      stats.absent += 1;
      continue;
    }

    stats.trouves += 1;
    stats.caracteristiques += nbLignes;
    if (reussites.length < 25) {
      reussites.push({ sku: produit.sku, nom: produit.name, reference: resultat.reference, n: nbLignes });
    }

    if (!apply) continue;

    const champs = [produit.id, JSON.stringify(groupes)];
    let sql = `UPDATE "Product" SET "technicalDescription" = $2, "updatedAt" = NOW()`;

    // Le texte du constructeur remplace le notre : il decrit le produit, la
    // ou le notre se contentait de rappeler la marque et la garantie.
    const longue = resume.LongSummaryDescription?.trim();
    if (longue && longue.length > 80) {
      // Le texte constructeur finit rarement par un point : "Quantite: 1
      // piece(s)" suivi de notre phrase donnait une seule phrase illisible.
      // Il contient aussi des suites de points ("(RFC1577/2225),....") qu'on
      // ramene a des points de suspension.
      const propre = longue.replace(/,?\s*\.{2,}/g, "…").replace(/\s{2,}/g, " ").trim();
      const ponctue = /[.!?…]$/.test(propre) ? propre : `${propre}.`;

      champs.push(
        `${ponctue} Garantie ${produit.warrantyMonths} mois. Livraison partout au Maroc, ` +
          `retrait possible en magasin.`,
      );
      sql += `, description = $${champs.length}`;
    }

    const courte = resume.ShortSummaryDescription?.trim();
    if (courte && courte.length > 10) {
      champs.push(courte.slice(0, 180));
      sql += `, "shortDescription" = $${champs.length}`;
    }

    await client.query(`${sql} WHERE id = $1`, champs);
  }
} catch (erreur) {
  console.error("Interrompu :", erreur.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

for (const r of reussites) {
  console.log(`OK  ${r.sku.padEnd(18)} ${r.nom.slice(0, 44).padEnd(44)} [${r.reference}] ${r.n} caracteristiques`);
}

console.log();
console.log(`Produits examines           : ${stats.examines}`);
console.log(`Fiches techniques recuperees: ${stats.trouves}`);
console.log(`Caracteristiques enregistrees: ${stats.caracteristiques}`);
console.log(`Sans reference exploitable  : ${stats.sansReference}`);
console.log(`Absents du catalogue Icecat : ${stats.absent}`);
console.log(`Consommables compatibles    : ${stats.compatible}`);
console.log(`Bloques (compte requis)     : ${stats.restreint}`);
console.log(`Erreurs reseau              : ${stats.reseau}`);

if (marquesRestreintes.size > 0) {
  console.log();
  console.log(`Marques exigeant une cle Full Icecat : ${[...marquesRestreintes].join(", ")}`);
}
