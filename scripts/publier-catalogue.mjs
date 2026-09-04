// Masquage et remise en ligne du catalogue.
//
// Utilisation :
//   node scripts/publier-catalogue.mjs --masquer [--apply]
//   node scripts/publier-catalogue.mjs --publier [--apply]
//   node scripts/publier-catalogue.mjs --etat
//
// Sans --apply, le script se contente d'un rapport : aucune ecriture.
//
// Sert a retirer la boutique de la vue le temps de reprendre les visuels ou
// les fiches depuis le back-office, puis a tout remettre en ligne d'un coup.
//
// --masquer repasse en BROUILLON tout ce qui est publie, et note les
// references concernees dans un fichier. --publier relit ce fichier et ne
// republie que celles-la.
//
// Ce passage par un fichier n'est pas une precaution inutile : republier
// "tout ce qui a un prix" remettrait aussi en ligne les 367 produits dont le
// prix de vente n'est encore qu'une suggestion a valider. Seuls les produits
// reellement publies avant le masquage doivent revenir.
//
// Entre les deux, le back-office reste libre : un produit publie a la main
// depuis l'admin est simplement ajoute a la liste au prochain --masquer.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const flags = process.argv.slice(2);
const apply = flags.includes("--apply");
const masquer = flags.includes("--masquer");
const publier = flags.includes("--publier");
const etat = flags.includes("--etat");

if (!masquer && !publier && !etat) {
  console.error(
    "Usage :\n" +
      "  node scripts/publier-catalogue.mjs --masquer [--apply]\n" +
      "  node scripts/publier-catalogue.mjs --publier [--apply]\n" +
      "  node scripts/publier-catalogue.mjs --etat",
  );
  process.exit(1);
}

const env = existsSync(".env") ? readFileSync(".env", "utf8") : "";
const databaseUrl = process.env.DATABASE_URL ?? env.match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!databaseUrl) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

// A cote des sauvegardes : c'est un fichier d'exploitation, pas du code, et il
// doit survivre a un git pull.
const dossierEtat =
  process.env.BACKUP_DIR ?? env.match(/BACKUP_DIR="([^"]+)"/)?.[1] ?? path.join(process.cwd(), "tmp");
const fichierEtat = path.join(dossierEtat, "catalogue-masque.json");

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

async function repartition() {
  const { rows } = await client.query(
    `SELECT status, count(*)::int n FROM "Product" GROUP BY status ORDER BY n DESC`,
  );
  return rows.map((r) => `  ${r.status.padEnd(13)} ${r.n}`).join("\n");
}

try {
  if (etat) {
    console.log("Repartition actuelle :");
    console.log(await repartition());

    if (existsSync(fichierEtat)) {
      const enregistre = JSON.parse(readFileSync(fichierEtat, "utf8"));
      console.log(
        `\nMasquage enregistre le ${enregistre.date} : ${enregistre.skus.length} produits`,
      );
      console.log(`Fichier : ${fichierEtat}`);
    } else {
      console.log("\nAucun masquage enregistre.");
    }
  } else if (masquer) {
    const { rows } = await client.query(
      `SELECT sku FROM "Product" WHERE status = 'PUBLISHED' ORDER BY sku`,
    );

    console.log(apply ? "=== MASQUAGE APPLIQUE ===" : "=== SIMULATION (ajouter --apply) ===");
    console.log(`Produits a masquer : ${rows.length}`);

    if (rows.length === 0) {
      console.log("Rien a faire : aucun produit n'est publie.");
    } else if (apply) {
      mkdirSync(dossierEtat, { recursive: true });
      writeFileSync(
        fichierEtat,
        JSON.stringify({ date: new Date().toISOString(), skus: rows.map((r) => r.sku) }, null, 2),
        "utf8",
      );

      await client.query(
        `UPDATE "Product" SET status = 'DRAFT', "updatedAt" = NOW() WHERE status = 'PUBLISHED'`,
      );

      console.log(`Liste enregistree  : ${fichierEtat}`);
      console.log("\nLa boutique n'affiche plus aucun produit.");
      console.log("Le back-office reste complet : les fiches y sont en brouillon.");
    }
  } else {
    if (!existsSync(fichierEtat)) {
      console.error(`Aucune liste de masquage a ${fichierEtat}.`);
      console.error("Publiez depuis le back-office, ou relancez --masquer d'abord.");
      process.exitCode = 1;
    } else {
      const enregistre = JSON.parse(readFileSync(fichierEtat, "utf8"));

      const { rows } = await client.query(
        `SELECT sku, "priceSell" FROM "Product"
          WHERE sku = ANY($1) AND status = 'DRAFT'`,
        [enregistre.skus],
      );

      // Garde-fou : un produit dont le prix serait retombe a zero entre-temps
      // afficherait "0 DH" en boutique.
      const publiables = rows.filter((r) => Number(r.priceSell) > 0);
      const sansPrix = rows.filter((r) => Number(r.priceSell) <= 0);

      console.log(apply ? "=== REMISE EN LIGNE APPLIQUEE ===" : "=== SIMULATION (ajouter --apply) ===");
      console.log(`Liste du ${enregistre.date} : ${enregistre.skus.length} references`);
      console.log(`Encore en brouillon      : ${rows.length}`);
      console.log(`A republier              : ${publiables.length}`);

      if (sansPrix.length > 0) {
        console.log(`Ecartes, prix a zero     : ${sansPrix.length}`);
        console.log(`   ${sansPrix.slice(0, 8).map((r) => r.sku).join(", ")}`);
      }

      if (apply && publiables.length > 0) {
        await client.query(
          `UPDATE "Product" SET status = 'PUBLISHED', "updatedAt" = NOW() WHERE sku = ANY($1)`,
          [publiables.map((r) => r.sku)],
        );
      }
    }
  }

  if (apply) {
    console.log("\nRepartition apres operation :");
    console.log(await repartition());
    console.log("\nPensez a redemarrer le service pour vider le cache des pages :");
    console.log("  systemctl restart nahda");
  }
} catch (erreur) {
  console.error("Interrompu :", erreur.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
