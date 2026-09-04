// Import des caracteristiques saisies a la main.
//
// Utilisation :
//   node scripts/import-fiches-manuelles.mjs <fichier.csv> [--apply]
//
// Sans --apply, le script se contente d'un rapport : aucune ecriture.
//
// Le CSV vient du classeur "Caracteristiques produits", enregistre au format
// CSV. Colonnes attendues, dans cet ordre :
//
//   reference, nom, categorie, marque, prix, stock, detecte,
//   processeur, memoire, stockage, ecran, connectique, reseau,
//   systeme, autres, etat
//
// Seules les colonnes de saisie comptent. Une cellule vide n'ecrase rien :
// c'est ce qui permet de renvoyer le fichier par lots, au fil de la saisie.
//
// Pour le materiel d'occasion, cette saisie est la seule source exacte : la
// fiche d'usine du constructeur decrit la configuration d'origine, pas la
// memoire ni le disque que le magasin a installes.

import { readFileSync } from "node:fs";
import pg from "pg";

const [, , csvPath, ...flags] = process.argv;
const apply = flags.includes("--apply");

if (!csvPath) {
  console.error("Usage : node scripts/import-fiches-manuelles.mjs <fichier.csv> [--apply]");
  process.exit(1);
}

const databaseUrl =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!databaseUrl) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

// Le classeur est enregistre depuis Excel : separateur point-virgule en
// francais, virgule ailleurs. On detecte plutot que d'imposer.
function separateur(entete) {
  return (entete.match(/;/g)?.length ?? 0) > (entete.match(/,/g)?.length ?? 0) ? ";" : ",";
}

function decouper(ligne, sep) {
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
    else if (c === sep) { cellules.push(courant); courant = ""; }
    else courant += c;
  }

  cellules.push(courant);
  return cellules;
}

// Colonne du classeur -> libelle affiche sur la fiche technique.
const CHAMPS = [
  [7, "Processeur"],
  [8, "Mémoire vive"],
  [9, "Stockage"],
  [10, "Écran"],
  [11, "Connectique"],
  [12, "Sans fil / réseau"],
  [13, "Système / logiciel"],
  [14, "Autres caractéristiques"],
  [15, "État"],
];

const texte = readFileSync(csvPath, "utf8").replace(/^﻿/, "");
const lignes = texte.split(/\r?\n/).filter((l) => l.trim());
const sep = separateur(lignes[0]);

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

const stats = { lues: 0, vides: 0, introuvables: 0, renseignes: 0, caracteristiques: 0 };
const introuvables = [];
const apercu = [];

try {
  const { rows } = await client.query(`SELECT id, sku, "technicalDescription" FROM "Product"`);
  const parSku = new Map(rows.map((r) => [r.sku.toUpperCase(), r]));

  if (apply) await client.query("BEGIN");

  for (const ligne of lignes.slice(1)) {
    const cellules = decouper(ligne, sep).map((c) => c.trim());
    const reference = cellules[0];

    if (!reference) continue;
    stats.lues += 1;

    const saisies = CHAMPS.map(([index, libelle]) => [libelle, cellules[index] ?? ""]).filter(
      ([, valeur]) => valeur !== "",
    );

    if (saisies.length === 0) {
      stats.vides += 1;
      continue;
    }

    const produit = parSku.get(reference.toUpperCase());

    if (!produit) {
      stats.introuvables += 1;
      if (introuvables.length < 12) introuvables.push(reference);
      continue;
    }

    stats.renseignes += 1;
    stats.caracteristiques += saisies.length;
    if (apercu.length < 8) {
      apercu.push(`${reference.padEnd(18)} ${saisies.length} caracteristiques : ${saisies.map(([l]) => l).join(", ")}`);
    }

    if (!apply) continue;

    // On complete la fiche constructeur si elle existe, sans l'ecraser : le
    // bloc saisi vient s'ajouter, ou remplace le precedent bloc saisi.
    let groupes = [];
    try {
      const existant = JSON.parse(produit.technicalDescription ?? "[]");
      if (Array.isArray(existant)) {
        groupes = existant.filter((g) => g?.groupe !== "Caractéristiques");
      }
    } catch {
      groupes = [];
    }

    groupes.unshift({ groupe: "Caractéristiques", lignes: saisies });

    await client.query(
      `UPDATE "Product" SET "technicalDescription" = $2, "updatedAt" = NOW() WHERE id = $1`,
      [produit.id, JSON.stringify(groupes)],
    );
  }

  if (apply) await client.query("COMMIT");
} catch (erreur) {
  if (apply) await client.query("ROLLBACK").catch(() => {});
  console.error("Interrompu :", erreur.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

console.log(apply ? "=== FICHES ENREGISTREES ===" : "=== SIMULATION (ajouter --apply pour ecrire) ===");
console.log(`Lignes lues                : ${stats.lues}`);
console.log(`Produits renseignes        : ${stats.renseignes}`);
console.log(`Caracteristiques ecrites   : ${stats.caracteristiques}`);
console.log(`Lignes encore vides        : ${stats.vides}`);
console.log(`References introuvables    : ${stats.introuvables}`);

if (introuvables.length > 0) {
  console.log(`   ${introuvables.join(", ")}`);
}

if (apercu.length > 0) {
  console.log();
  apercu.forEach((a) => console.log(`   ${a}`));
}
