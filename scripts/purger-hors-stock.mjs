// Suppression des produits sans stock physique.
//
// Utilisation :
//   node scripts/purger-hors-stock.mjs [--apply]
//
// Sans --apply, le script se contente d'un rapport : aucune ecriture.
//
// Ne conserve que les references comptees avec une quantite lors du dernier
// inventaire. Tout le reste est supprime : les articles non comptes, ceux
// comptes a zero, et les produits de demonstration livres avec le site.
//
// C'est une operation irreversible. Deux garde-fous :
//
//   - Une sauvegarde de la base est exigee avant toute ecriture. Le script
//     refuse de tourner si aucune sauvegarde recente n'existe.
//   - Un produit rattache a une commande, un devis, un achat fournisseur ou
//     un mouvement de stock n'est jamais supprime : la base refuserait de
//     casser cet historique, et elle a raison. Ces produits sont archives.
//
// A savoir avant de lancer : la suppression emporte le prix de vente, la
// fiche redigee, la categorie et les visuels. Un reimport d'inventaire
// recreera ces references, mais vides.

import { readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const flags = process.argv.slice(2);
const apply = flags.includes("--apply");

const env = readFileSync(".env", "utf8");
const databaseUrl = process.env.DATABASE_URL ?? env.match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!databaseUrl) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

// --- garde-fou : une sauvegarde recente doit exister -----------------------

// Meme resolution que scripts/backup-postgres.mjs, qui ecrit dans "backups"
// a defaut de BACKUP_DIR : chercher ailleurs faisait echouer le garde-fou
// alors que la sauvegarde venait d'etre prise.
const dossiersSauvegardes = [
  process.env.BACKUP_DIR,
  env.match(/BACKUP_DIR="([^"]+)"/)?.[1],
  path.join(process.cwd(), "backups"),
].filter(Boolean);

function sauvegardeRecente() {
  for (const dossier of dossiersSauvegardes) {
    try {
      const fichiers = readdirSync(dossier)
        .filter((f) => f.endsWith(".dump") || f.endsWith(".sql"))
        .map((f) => ({ f, t: statSync(path.join(dossier, f)).mtimeMs }))
        .sort((a, b) => b.t - a.t);

      if (fichiers.length === 0) continue;

      const age = (Date.now() - fichiers[0].t) / 3600000;
      if (age <= 24) return { nom: fichiers[0].f, heures: age, dossier };
    } catch {
      /* dossier absent : on essaie le suivant */
    }
  }

  return null;
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

try {
  const { rows: produits } = await client.query(`
    SELECT p.id, p.sku, p.name, p.status, p."priceSell",
           COALESCE(SUM(s.quantity), 0)::int AS stock,
           (SELECT count(*) FROM "OrderItem" o WHERE o."productId" = p.id)::int
             + (SELECT count(*) FROM "QuoteItem" q WHERE q."productId" = p.id)::int
             + (SELECT count(*) FROM "SupplierPurchaseItem" a WHERE a."productId" = p.id)::int
             + (SELECT count(*) FROM "StockMovement" m WHERE m."productId" = p.id)::int AS historique
      FROM "Product" p
      LEFT JOIN "Stock" s ON s."productId" = p.id
     GROUP BY p.id
     ORDER BY p.name`);

  const gardes = produits.filter((p) => p.stock > 0);
  const candidats = produits.filter((p) => p.stock === 0);
  const archiver = candidats.filter((p) => p.historique > 0);
  const supprimer = candidats.filter((p) => p.historique === 0);
  const prixPerdus = supprimer.filter((p) => Number(p.priceSell) > 0);

  console.log(apply ? "=== PURGE APPLIQUEE ===" : "=== SIMULATION (ajouter --apply pour ecrire) ===");
  console.log(`Produits en base        : ${produits.length}`);
  console.log(`Conserves (stock reel)  : ${gardes.length}`);
  console.log(`A supprimer             : ${supprimer.length}`);
  console.log(`   dont avec un prix    : ${prixPerdus.length}  (saisie perdue)`);
  console.log(`A archiver (historique) : ${archiver.length}`);

  if (archiver.length > 0) {
    console.log();
    archiver.forEach((p) =>
      console.log(`   ${p.sku.padEnd(24)} ${p.historique} lien(s)  ${p.name.slice(0, 40)}`),
    );
  }

  if (!apply) {
    console.log("\nRelancer avec --apply pour executer. Une sauvegarde de moins de 24 h est exigee.");
  } else {
    const sauvegarde = sauvegardeRecente();

    if (!sauvegarde) {
      console.error(`\nAucune sauvegarde de moins de 24 h dans : ${dossiersSauvegardes.join(", ")}`);
      console.error("Lancez d'abord : npm run backup:db");
      process.exitCode = 1;
    } else {
      console.log(`\nSauvegarde trouvee : ${sauvegarde.nom} (${sauvegarde.heures.toFixed(1)} h)`);

      await client.query("BEGIN");

      if (archiver.length > 0) {
        await client.query(
          `UPDATE "Product" SET status = 'ARCHIVED', "updatedAt" = NOW() WHERE id = ANY($1)`,
          [archiver.map((p) => p.id)],
        );
      }

      if (supprimer.length > 0) {
        await client.query(`DELETE FROM "Product" WHERE id = ANY($1)`, [
          supprimer.map((p) => p.id),
        ]);
      }

      await client.query("COMMIT");

      const { rows: apres } = await client.query(
        `SELECT status, count(*)::int n FROM "Product" GROUP BY status ORDER BY n DESC`,
      );

      console.log("\nRepartition apres purge :");
      apres.forEach((r) => console.log(`   ${r.status.padEnd(13)} ${r.n}`));
      console.log("\nPensez a redemarrer le service : systemctl restart nahda");
    }
  }
} catch (erreur) {
  if (apply) await client.query("ROLLBACK").catch(() => {});
  console.error("Interrompu :", erreur.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
