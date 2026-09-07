// Retrait des marques qui n'ont plus aucun produit vivant.
//
// Utilisation :
//   node scripts/nettoyer-marques.mjs [--apply]
//
// Sans --apply, le script se contente d'un rapport : aucune ecriture.
//
// Les purges de catalogue laissent derriere elles des marques sans produit :
// apres celle de septembre 2026, vingt marques -- Acer, Sony, LG, Brother...
// -- restaient actives sans une seule reference. Elles allongeaient le filtre
// de la boutique avec des entrees qui ne menaient nulle part.
//
// Deux traitements, selon ce que la base autorise :
//
//   - Une marque sans aucun produit est supprimee. Rien ne la reference, et
//     l'import d'inventaire la recreera d'elle-meme si le magasin en
//     reprend un jour.
//   - Une marque dont il ne reste que des produits archives est desactivee,
//     pas supprimee : la supprimer casserait l'historique, et un produit
//     archive doit rester republiable en un clic.
//
// A jouer apres chaque purge, et apres tout enrichissement de la table de
// detection : rattacher 71 produits a leur vrai fabricant vide d'autant la
// marque "Generique" et peut en laisser d'autres orphelines.

import { readFileSync } from "node:fs";
import pg from "pg";

const apply = process.argv.slice(2).includes("--apply");

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
  const { rows: marques } = await client.query(`
    SELECT b.id, b.name, b."isActive",
           count(p.id)::int AS total,
           count(p.id) FILTER (WHERE p.status <> 'ARCHIVED')::int AS vivants
      FROM "Brand" b
      LEFT JOIN "Product" p ON p."brandId" = b.id
     GROUP BY b.id
     ORDER BY b.name`);

  const aSupprimer = marques.filter((m) => m.total === 0);
  const aDesactiver = marques.filter(
    (m) => m.total > 0 && m.vivants === 0 && m.isActive,
  );
  const vivantes = marques.filter((m) => m.vivants > 0);

  console.log(apply ? "=== NETTOYAGE APPLIQUE ===" : "=== SIMULATION (ajouter --apply pour ecrire) ===");
  console.log(`Marques en base          : ${marques.length}`);
  console.log(`   avec des produits     : ${vivantes.length}`);
  console.log(`A supprimer (aucun produit) : ${aSupprimer.length}`);
  console.log(`A desactiver (archives seules) : ${aDesactiver.length}`);

  if (aSupprimer.length > 0) {
    console.log("\n--- Supprimees ---");
    aSupprimer.forEach((m) => console.log(`   ${m.name}`));
  }

  if (aDesactiver.length > 0) {
    console.log("\n--- Desactivees, pas supprimees ---");
    aDesactiver.forEach((m) =>
      console.log(`   ${m.name.padEnd(34)} ${m.total} produit(s) archive(s)`),
    );
  }

  if (!apply) {
    console.log("\nRelancer avec --apply pour executer.");
  } else {
    await client.query("BEGIN");

    if (aSupprimer.length > 0) {
      await client.query(`DELETE FROM "Brand" WHERE id = ANY($1)`, [
        aSupprimer.map((m) => m.id),
      ]);
    }

    if (aDesactiver.length > 0) {
      await client.query(
        `UPDATE "Brand" SET "isActive" = false, "updatedAt" = NOW() WHERE id = ANY($1)`,
        [aDesactiver.map((m) => m.id)],
      );
    }

    await client.query("COMMIT");

    const { rows: apres } = await client.query(
      `SELECT count(*)::int n, count(*) FILTER (WHERE "isActive")::int actives FROM "Brand"`,
    );

    console.log(
      `\nApres nettoyage : ${apres[0].n} marques, dont ${apres[0].actives} actives.`,
    );
    console.log("Pensez a redemarrer le service : systemctl restart nahda");
  }
} catch (erreur) {
  if (apply) await client.query("ROLLBACK").catch(() => {});
  console.error("Interrompu :", erreur.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
