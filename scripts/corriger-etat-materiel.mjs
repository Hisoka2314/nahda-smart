// Etat declare des machines : neuf, occasion ou reconditionne.
//
// Utilisation :
//   node scripts/corriger-etat-materiel.mjs [--apply] [--occasion]
//
// Sans --apply, le script se contente d'un rapport : aucune ecriture.
//
// L'import d'inventaire cree tout en NEW, faute de savoir. Le catalogue
// annoncait donc "Neuf" sur dix-sept portables professionnels d'occasion --
// un EliteBook 840 G5 de 2018 a 3 390 DH, quand le neuf en vaut trois a
// quatre fois plus. C'est une affirmation fausse sur une fiche de vente, et
// la plus couteuse a laisser passer.
//
// Sont concernees les machines completes : portables, tout-en-un, unites
// centrales. Pas les batteries, chargeurs et stylets, qui sont bien neufs.
//
// REFURBISHED plutot que USED, par defaut : le magasin teste, nettoie,
// change le disque quand il le faut, et garantit un mois. C'est la
// definition du reconditionne, et le terme rassure la ou "occasion"
// inquiete. Le drapeau --occasion bascule sur USED si le magasin prefere
// vendre tel quel, sans reprise.
//
// Les generations recentes vendues neuves ne doivent pas y passer : la liste
// se lit avant d'ecrire, et --apply n'agit que sur ce qui est affiche.

import { readFileSync } from "node:fs";
import pg from "pg";

const flags = process.argv.slice(2);
const apply = flags.includes("--apply");
const etatVoulu = flags.includes("--occasion") ? "USED" : "REFURBISHED";

const databaseUrl =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!databaseUrl) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

// Une machine complete, par opposition a une piece detachee ou un accessoire.
const MACHINE = /^(PC Portable|LPT|All In One|PC Bureau|Ordinateur)\b/i;

// Ce qui porte "PC Portable" dans son nom sans en etre un.
const ACCESSOIRE = /^(Batterie|Chargeur|Cable|Sac|Cartable|Housse|Support|Stylo|Dalle|Clavier)\b/i;

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

try {
  const { rows: produits } = await client.query(`
    SELECT p.id, p.sku, p.name, p.condition, p."priceSell"::float AS prix,
           COALESCE(SUM(s.quantity), 0)::int AS stock
      FROM "Product" p
      LEFT JOIN "Stock" s ON s."productId" = p.id
     WHERE p.status <> 'ARCHIVED'
     GROUP BY p.id
     ORDER BY p.name`);

  const machines = produits.filter(
    (p) => MACHINE.test(p.name) && !ACCESSOIRE.test(p.name),
  );
  const aChanger = machines.filter((p) => p.condition !== etatVoulu);

  console.log(apply ? "=== ETAT CORRIGE ===" : "=== SIMULATION (ajouter --apply pour ecrire) ===");
  console.log(`Etat applique            : ${etatVoulu}`);
  console.log(`Machines au catalogue    : ${machines.length}`);
  console.log(`   deja a cet etat       : ${machines.length - aChanger.length}`);
  console.log(`   a corriger            : ${aChanger.length}`);

  if (aChanger.length > 0) {
    console.log();
    aChanger.forEach((p) =>
      console.log(
        `   ${p.condition.padEnd(6)} -> ${etatVoulu.padEnd(12)} ${String(p.prix.toFixed(0)).padStart(5)} DH  ${p.name.slice(0, 50)}`,
      ),
    );
  }

  if (!apply) {
    console.log("\nRelisez la liste : --apply n'ecrira que sur ces references.");
    console.log("Ajouter --occasion pour declarer USED plutot que REFURBISHED.");
  } else if (aChanger.length > 0) {
    await client.query(
      `UPDATE "Product" SET condition = $2::"ProductCondition", "updatedAt" = NOW()
        WHERE id = ANY($1)`,
      [aChanger.map((p) => p.id), etatVoulu],
    );

    const { rows: apres } = await client.query(
      `SELECT condition, count(*)::int n FROM "Product"
        WHERE status <> 'ARCHIVED' GROUP BY condition ORDER BY n DESC`,
    );

    console.log("\nRepartition finale :");
    apres.forEach((r) => console.log(`   ${String(r.condition).padEnd(13)} ${r.n}`));
    console.log("\nPensez a redemarrer le service : systemctl restart nahda");
  }
} catch (erreur) {
  console.error("Interrompu :", erreur.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
