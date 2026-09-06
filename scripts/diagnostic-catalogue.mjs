// Ecart entre l'inventaire de reference et ce que la base contient.
//
// Utilisation :
//   node scripts/diagnostic-catalogue.mjs
//
// Ne modifie rien. A jouer sur les DEUX machines, poste du magasin et
// serveur, puis a comparer les deux sorties.
//
// C'est ce qui manquait au deploiement de septembre 2026 : le serveur portait
// 330 produits en stock contre 364 sur le poste, et rien ne le signalait. Les
// 34 manquants etaient des cameras et des enregistreurs, dont huit publies
// avec un prix -- invendables en ligne, sans aucune alerte.
//
// Le script ne peut pas dire tout seul si une reference absente est une perte
// ou une purge legitime : le comptage physique n'est pas versionne, et c'est
// voulu. Ce sont les totaux, compares entre les deux machines, qui revelent
// l'ecart.
//
// Ce qu'il tranche en revanche :
//
//   - archivee : il suffit de la republier depuis le back-office.
//   - presente a zero : comportement voulu, la reference est en rupture.
//   - en base hors inventaire : ajout manuel, ou classement.mjs a regenerer.

import { readFileSync } from "node:fs";
import pg from "pg";
import { FAMILLE_PAR_REFERENCE } from "./lib/classement.mjs";

const databaseUrl =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!databaseUrl) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

try {
  const { rows: produits } = await client.query(`
    SELECT p.sku, p.name, p.status, p."priceSell"::float AS prix,
           COALESCE(SUM(s.quantity), 0)::int AS stock
      FROM "Product" p
      LEFT JOIN "Stock" s ON s."productId" = p.id
     GROUP BY p.id`);

  const parSku = new Map(produits.map((p) => [p.sku.toUpperCase(), p]));
  const references = Object.keys(FAMILLE_PAR_REFERENCE);

  const absentes = [];
  const archivees = [];

  for (const reference of references) {
    const produit = parSku.get(reference);
    if (!produit) absentes.push(reference);
    else if (produit.status === "ARCHIVED") archivees.push(produit);
  }

  const actifs = produits.filter((p) => p.status !== "ARCHIVED");
  const enStock = actifs.filter((p) => p.stock > 0);
  const publies = actifs.filter((p) => p.status === "PUBLISHED");
  const horsListe = produits.filter((p) => !FAMILLE_PAR_REFERENCE[p.sku.toUpperCase()]);

  console.log("=== ETAT DU CATALOGUE ===");
  console.log(`References a l'inventaire : ${references.length}`);
  console.log(`Produits en base          : ${produits.length}`);
  console.log(`   actifs                 : ${actifs.length}`);
  console.log(`   en stock               : ${enStock.length}`);
  console.log(`   publies                : ${publies.length}`);
  console.log(`   archives               : ${produits.length - actifs.length}`);
  console.log();
  console.log(`Absentes de la base       : ${absentes.length}`);
  console.log(`Archivees                 : ${archivees.length}`);
  console.log(`En base hors inventaire   : ${horsListe.length}`);

  console.log("\n--- A comparer avec l'autre machine ---");
  console.log(`   en stock : ${enStock.length}   publies : ${publies.length}`);
  console.log(
    "   Un ecart sur 'en stock' signale des produits perdus en ligne. Pour les",
  );
  console.log("   retrouver, avec le tableur a portee :");
  console.log(
    "     node scripts/import-inventory.mjs <inventaire.csv> --comptes-seulement --apply",
  );
  console.log("     node scripts/maj-stock.mjs <inventaire.csv> --apply");
  console.log(
    "\n   --comptes-seulement n'est pas facultatif : sans lui l'import recree",
  );
  console.log(
    "   toute la liste, y compris ce qu'une purge avait retire a raison.",
  );
  console.log(
    "\n   Un ou deux publies d'ecart sont normaux : un produit mis en ligne a la",
  );
  console.log("   main depuis l'admin ne figure dans aucun fichier de prix.");
  console.log(
    `\n   Les ${absentes.length} references absentes de la base ne sont pas listees : sans le`,
  );
  console.log(
    "   comptage physique, rien ne distingue une purge voulue d'une perte.",
  );

  if (archivees.length > 0) {
    console.log("\n--- Archivees (a republier depuis le back-office) ---");
    archivees
      .slice(0, 40)
      .forEach((p) =>
        console.log(`   st:${String(p.stock).padStart(3)}  ${p.sku.padEnd(24)} ${p.name.slice(0, 44)}`),
      );
    if (archivees.length > 40) console.log(`   ... et ${archivees.length - 40} autres`);
  }

  if (horsListe.length > 0) {
    console.log("\n--- En base mais hors inventaire ---");
    horsListe
      .slice(0, 20)
      .forEach((p) =>
        console.log(`   ${p.status.padEnd(10)} st:${String(p.stock).padStart(3)}  ${p.sku.padEnd(24)} ${p.name.slice(0, 40)}`),
      );
    console.log(
      "\n   Soit des produits ajoutes a la main, soit un classement.mjs a regenerer.",
    );
  }

  if (absentes.length === 0 && archivees.length === 0) {
    console.log("\nRien a signaler : la base couvre tout l'inventaire.");
  }
} catch (erreur) {
  console.error("Interrompu :", erreur.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
