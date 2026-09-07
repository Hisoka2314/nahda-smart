// Import d'une facture fournisseur : produits, code-barres, prix d'achat.
//
// Utilisation :
//   node scripts/import-facture-fournisseur.mjs [--apply]
//
// Sans --apply, le script se contente d'un rapport : aucune ecriture.
//
// Le tableau LIGNES ci-dessous est recopie d'une facture papier. Chaque ligne
// porte ce que le fournisseur imprime : sa reference article, la designation,
// la quantite livree, le prix d'achat hors taxe et le code-barres EAN.
//
// Ce que le script pose, et ce qu'il ne pose pas :
//
//   - Le code-barres part en base. C'est lui qui permettra a la douchette de
//     retrouver l'article : la recherche du back-office l'interroge.
//   - Le prix d'ACHAT est enregistre. Le prix de VENTE reste a zero et le
//     produit en brouillon : la marge est une decision du magasin, pas une
//     donnee de la facture. Rien n'apparait en boutique tant que le prix n'est
//     pas saisi depuis le back-office.
//   - Le stock livre est ajoute au depot principal.
//
// Le script est idempotent : une reference deja en base voit son code-barres
// et son prix d'achat completes, jamais son prix de vente ni son statut.

import { readFileSync } from "node:fs";
import pg from "pg";

const apply = process.argv.slice(2).includes("--apply");

// --- Facture SETUP GAME SARL n° FAC/2609/02915 du 04/09/2026 ---------------
// Bon de livraison WFK/Bon de Livraison/2609/02383 du 03/09/2026.
// Total HT 29 349,99 DH, TVA 5 870,01 DH, TTC 35 220,00 DH.
//
// La ligne 15 "FRAIS DE LIVRAISON" n'est pas un article : elle est absente.
const LIGNES = [
  {
    reference: "SG-7555",
    nom: "Alimentation SG-550B 550W Bronze",
    marque: "SG",
    categorie: "composants-pc",
    quantite: 3,
    prixAchat: 233.33,
    codeBarres: "6111277530016",
  },
  {
    reference: "SG-7556",
    nom: "Alimentation SG-750B 750W Bronze",
    marque: "SG",
    categorie: "composants-pc",
    quantite: 3,
    prixAchat: 333.33,
    codeBarres: "6111277530023",
  },
  {
    reference: "SG-10773",
    nom: "Processeur AMD Ryzen 7 5700 Tray",
    marque: "AMD",
    categorie: "composants-pc",
    quantite: 5,
    prixAchat: 1291.67,
    codeBarres: "730143316309",
  },
  {
    reference: "SG-7969",
    nom: "Processeur AMD Ryzen 5 5500 Tray",
    marque: "AMD",
    categorie: "composants-pc",
    quantite: 5,
    prixAchat: 741.67,
    codeBarres: "4260751594937",
  },
  {
    reference: "SG-5945",
    nom: "Carte Mere MSI A520M-A PRO",
    marque: "MSI",
    categorie: "composants-pc",
    quantite: 3,
    prixAchat: 458.33,
    codeBarres: "4719072749927",
  },
  {
    reference: "SG-8329",
    nom: "Carte Mere MSI B550M PRO-VDH",
    marque: "MSI",
    categorie: "composants-pc",
    quantite: 3,
    prixAchat: 750.0,
    codeBarres: "4719072758417",
  },
  {
    reference: "SG-9512",
    nom: "Boitier SG NV7 5 Fan ARGB Blanc",
    marque: "SG",
    categorie: "composants-pc",
    quantite: 2,
    prixAchat: 541.67,
    codeBarres: "6111277530085",
  },
  {
    reference: "SG-9513",
    nom: "Boitier SG Pro V2 6 Fan ARGB Noir",
    marque: "SG",
    categorie: "composants-pc",
    quantite: 3,
    prixAchat: 458.33,
    codeBarres: "6111277530092",
  },
  {
    reference: "SG-11439",
    nom: "Boitier SG Glass 3 Fan ARGB Noir",
    marque: "SG",
    categorie: "composants-pc",
    quantite: 3,
    prixAchat: 350.0,
    codeBarres: "6111277530122",
  },
  {
    reference: "SG-11981",
    nom: 'Moniteur MSI PRO MP251 E14L 24.5" 144Hz 1ms IPS',
    marque: "MSI",
    categorie: "ecrans-moniteurs",
    quantite: 3,
    prixAchat: 750.0,
    codeBarres: "4711377409193",
  },
  {
    reference: "SG-11982",
    nom: 'Moniteur MSI PRO MP275 E14L 27" 144Hz 1ms IPS',
    marque: "MSI",
    categorie: "ecrans-moniteurs",
    quantite: 4,
    prixAchat: 958.33,
    codeBarres: "4711377379717",
  },
  {
    reference: "SG-11627",
    nom: 'Moniteur MSI MAG 272F X24 27" 240Hz 0.5ms Rapid IPS',
    marque: "MSI",
    categorie: "ecrans-moniteurs",
    quantite: 3,
    prixAchat: 1166.67,
    codeBarres: "4711377337120",
  },
  {
    reference: "SG-12655",
    nom: "Aircooler Connect Arctic Frost FRGB",
    marque: "Arctic",
    categorie: "composants-pc",
    quantite: 4,
    prixAchat: 66.67,
    codeBarres: "609137450971",
  },
  {
    reference: "SG-11255",
    nom: "Aircooler SG T400 Noir",
    marque: "SG",
    categorie: "composants-pc",
    quantite: 3,
    prixAchat: 166.67,
    codeBarres: "6111277530139",
  },
];

const databaseUrl =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!databaseUrl) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

function versSlug(texte) {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

const stats = { crees: 0, completes: 0, inchanges: 0 };

try {
  const depot = (
    await client.query(
      `SELECT id, name FROM "Depot" WHERE "isActive" ORDER BY (type = 'MAIN_DEPOT') DESC LIMIT 1`,
    )
  ).rows[0];

  if (!depot) throw new Error("Aucun depot actif.");

  const categories = new Map(
    (await client.query(`SELECT slug, id FROM "Category"`)).rows.map((r) => [r.slug, r.id]),
  );
  const marques = new Map(
    (await client.query(`SELECT upper(name) AS n, id FROM "Brand"`)).rows.map((r) => [r.n, r.id]),
  );
  const existants = new Map(
    (
      await client.query(`SELECT upper(sku) AS s, id, barcode, "priceBuy"::float AS pa FROM "Product"`)
    ).rows.map((r) => [r.s, r]),
  );

  console.log(apply ? "=== FACTURE IMPORTEE ===" : "=== SIMULATION (ajouter --apply pour ecrire) ===");
  console.log(`Depot                : ${depot.name}`);
  console.log(`Lignes de la facture : ${LIGNES.length}`);

  const marquesAbsentes = [
    ...new Set(LIGNES.map((l) => l.marque).filter((m) => !marques.has(m.toUpperCase()))),
  ];
  if (marquesAbsentes.length > 0) {
    console.log(`Marques a creer      : ${marquesAbsentes.join(", ")}`);
  }

  const total = LIGNES.reduce((t, l) => t + l.quantite * l.prixAchat, 0);
  console.log(`Total achat HT       : ${total.toFixed(2)} DH`);
  console.log();

  if (apply) {
    await client.query("BEGIN");

    for (const nom of marquesAbsentes) {
      const res = await client.query(
        `INSERT INTO "Brand" (id, name, slug, "isActive", "isOfficialAsset", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, true, false, now(), now())
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [nom, versSlug(nom)],
      );
      marques.set(nom.toUpperCase(), res.rows[0].id);
    }
  }

  for (const ligne of LIGNES) {
    const existant = existants.get(ligne.reference.toUpperCase());
    const categorieId = categories.get(ligne.categorie);

    if (!categorieId) {
      console.log(`   categorie absente : ${ligne.categorie} (${ligne.reference})`);
      continue;
    }

    if (existant) {
      const aCompleter = !existant.barcode || !existant.pa;
      if (!aCompleter) {
        stats.inchanges += 1;
        console.log(`   deja complet  ${ligne.reference.padEnd(11)} ${ligne.nom.slice(0, 44)}`);
        continue;
      }

      stats.completes += 1;
      console.log(`   complete      ${ligne.reference.padEnd(11)} ${ligne.nom.slice(0, 44)}`);

      if (apply) {
        await client.query(
          `UPDATE "Product"
              SET barcode = COALESCE(barcode, $2),
                  "priceBuy" = CASE WHEN "priceBuy" > 0 THEN "priceBuy" ELSE $3 END,
                  "updatedAt" = NOW()
            WHERE id = $1`,
          [existant.id, ligne.codeBarres, ligne.prixAchat],
        );
      }
      continue;
    }

    stats.crees += 1;
    console.log(
      `   cree          ${ligne.reference.padEnd(11)} ${String(ligne.quantite).padStart(2)} x ${String(ligne.prixAchat.toFixed(2)).padStart(8)} DH  ${ligne.nom.slice(0, 40)}`,
    );

    if (!apply) continue;

    const produit = await client.query(
      `INSERT INTO "Product"
         (id, sku, barcode, name, slug, description, "shortDescription",
          "brandId", "categoryId", status, condition, "priceBuy", "priceSell",
          margin, "warrantyMonths", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6,
               $7, $8, 'DRAFT', 'NEW', $9, 0, 0, 12, now(), now())
       RETURNING id`,
      [
        ligne.reference,
        ligne.codeBarres,
        ligne.nom,
        versSlug(ligne.nom),
        ligne.nom,
        ligne.nom,
        marques.get(ligne.marque.toUpperCase()),
        categorieId,
      ].concat([ligne.prixAchat]),
    );

    await client.query(
      `INSERT INTO "Stock" (id, "productId", "depotId", quantity, "lowStockThreshold")
       VALUES (gen_random_uuid()::text, $1, $2, $3, 3)
       ON CONFLICT ("productId", "depotId") DO UPDATE SET quantity = EXCLUDED.quantity`,
      [produit.rows[0].id, depot.id, ligne.quantite],
    );
  }

  if (apply) await client.query("COMMIT");

  console.log();
  console.log(`Produits crees       : ${stats.crees}`);
  console.log(`Produits completes   : ${stats.completes}`);
  console.log(`Deja a jour          : ${stats.inchanges}`);

  if (apply) {
    console.log("\nTous en BROUILLON, prix de vente a zero : rien n'est visible en boutique.");
    console.log("Saisissez les prix depuis le back-office, puis publiez.");
    console.log("Enchainez ensuite sur la redaction des fiches :");
    console.log("   node scripts/enrich-product-descriptions.mjs --tout --apply");
  } else {
    console.log("\nRelancer avec --apply pour executer.");
  }
} catch (erreur) {
  if (apply) await client.query("ROLLBACK").catch(() => {});
  console.error("Interrompu :", erreur.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
