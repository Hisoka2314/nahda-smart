// Retrait des produits qui ne viennent pas de l'inventaire du magasin.
//
// Utilisation :
//   node scripts/retirer-produits-demonstration.mjs <inventaire.csv> [--apply]
//
// Sans --apply, le script se contente d'un rapport : aucune ecriture.
//
// La vitrine livree avec le site portait une trentaine d'articles fictifs,
// avec des stocks et des prix inventes. Ils sont restes en ligne apres
// l'import du vrai catalogue : un client pouvait commander un portable a
// 11 490 DH que le magasin n'a jamais eu.
//
// Ce qui est fait, et pourquoi c'est prudent :
//   - Les produits absents de l'inventaire passent en ARCHIVED et leur stock
//     tombe a zero. Ils disparaissent de la boutique et de la liste admin,
//     mais restent en base : un produit archive se republie en un clic, une
//     suppression ne se defait pas.
//   - Un produit rattache a une commande ou a un devis n'est jamais touche,
//     meme archive : l'historique doit rester lisible.
//
// La suppression definitive reste manuelle, et n'a de sens que pour les
// artefacts de test.

import { readFileSync } from "node:fs";
import pg from "pg";

const [, , csvPath, ...flags] = process.argv;
const apply = flags.includes("--apply");

if (!csvPath) {
  console.error("Usage : node scripts/retirer-produits-demonstration.mjs <inventaire.csv> [--apply]");
  process.exit(1);
}

const databaseUrl =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!databaseUrl) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

function decouper(ligne) {
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
const entetes = decouper(lignes[0]).map((h) => h.trim().toLowerCase());
const colonneRef = entetes.indexOf("reference");

if (colonneRef < 0) {
  console.error("Colonne 'reference' absente du CSV.");
  process.exit(1);
}

const inventaire = new Set(
  lignes.slice(1).map((l) => decouper(l)[colonneRef]?.trim().toUpperCase()).filter(Boolean),
);

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

try {
  const { rows: produits } = await client.query(`
    SELECT p.id, p.sku, p.name, p.status,
           COALESCE(SUM(s.quantity), 0)::int AS stock,
           (SELECT count(*) FROM "OrderItem" o WHERE o."productId" = p.id)::int AS commandes,
           (SELECT count(*) FROM "QuoteItem" q WHERE q."productId" = p.id)::int AS devis
      FROM "Product" p
      LEFT JOIN "Stock" s ON s."productId" = p.id
     GROUP BY p.id
     ORDER BY p.name`);

  const hors = produits.filter((p) => !inventaire.has(p.sku.toUpperCase()));
  const aRetirer = hors.filter((p) => p.status !== "ARCHIVED" || p.stock > 0);
  const lies = aRetirer.filter((p) => p.commandes + p.devis > 0);

  console.log(apply ? "=== RETRAIT APPLIQUE ===" : "=== SIMULATION (ajouter --apply pour ecrire) ===");
  console.log(`Produits en base            : ${produits.length}`);
  console.log(`Absents de l'inventaire     : ${hors.length}`);
  console.log(`   dont publies             : ${hors.filter((p) => p.status === "PUBLISHED").length}`);
  console.log(`   dont avec du stock       : ${hors.filter((p) => p.stock > 0).length}`);
  console.log(`A retirer                   : ${aRetirer.length}`);

  if (lies.length > 0) {
    console.log(`   dont lies a une commande ou un devis : ${lies.length}`);
    lies.forEach((p) => console.log(`      ${p.sku.padEnd(26)} ${p.commandes} commande(s), ${p.devis} devis`));
    console.log("   Ils sont archives comme les autres : l'historique reste lisible.");
  }

  console.log();
  aRetirer.forEach((p) =>
    console.log(`  ${p.status.padEnd(12)} st:${String(p.stock).padStart(3)}  ${p.sku.padEnd(26)} ${p.name.slice(0, 42)}`),
  );

  if (apply && aRetirer.length > 0) {
    const ids = aRetirer.map((p) => p.id);

    await client.query("BEGIN");
    await client.query(
      `UPDATE "Product" SET status = 'ARCHIVED', "updatedAt" = NOW() WHERE id = ANY($1)`,
      [ids],
    );
    // Le stock est remis a zero : sans cela, ces articles continueraient de
    // remonter dans la liste admin, qui s'ouvre sur les references en stock.
    await client.query(`UPDATE "Stock" SET quantity = 0 WHERE "productId" = ANY($1)`, [ids]);
    await client.query("COMMIT");

    const { rows: apres } = await client.query(
      `SELECT status, count(*)::int n FROM "Product" GROUP BY status ORDER BY n DESC`,
    );

    console.log("\nRepartition apres retrait :");
    apres.forEach((r) => console.log(`   ${r.status.padEnd(13)} ${r.n}`));
    console.log("\nPensez a redemarrer le service : systemctl restart nahda");
  }
} catch (erreur) {
  if (apply) await client.query("ROLLBACK").catch(() => {});
  console.error("Interrompu :", erreur.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
