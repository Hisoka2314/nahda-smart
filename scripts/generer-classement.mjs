// Extraction du code famille de chaque reference vers un module versionne.
//
// Utilisation :
//   node scripts/generer-classement.mjs <inventaire.csv>
//
// Pourquoi ce detour : le CSV d'inventaire ne quitte pas le poste du magasin,
// alors que le reclassement du catalogue doit pouvoir tourner sur le serveur.
// Sans lui, reclasser-catalogue.mjs echouait avec un ENOENT au deploiement.
//
// Ce qui sort d'ici est la seule chose que le CSV apportait et que la base ne
// contient pas : le rayon d'origine de chaque reference. Ni quantites, ni
// prix, ni designations -- le nom du produit en base fait deja office de
// designation, et la comparaison sur les 364 references en stock donne zero
// ecart de classement entre les deux.
//
// A relancer apres chaque inventaire, puis commiter scripts/lib/classement.mjs.

import { readFileSync, writeFileSync } from "node:fs";

const [, , csvPath] = process.argv;

if (!csvPath) {
  console.error("Usage : node scripts/generer-classement.mjs <inventaire.csv>");
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

const lignes = readFileSync(csvPath, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
const entetes = decouperLigneCsv(lignes[0]).map((h) => h.trim().toLowerCase());
const colFamille = entetes.indexOf("famille");
const colReference = entetes.indexOf("reference");

if (colFamille < 0 || colReference < 0) {
  console.error("Colonnes 'famille' et 'reference' attendues dans le CSV.");
  process.exit(1);
}

const paires = new Map();

for (const ligne of lignes.slice(1)) {
  const cellules = decouperLigneCsv(ligne);
  const famille = (cellules[colFamille] ?? "").trim().toUpperCase();
  const reference = (cellules[colReference] ?? "").trim().toUpperCase();
  if (famille && reference) paires.set(reference, famille);
}

const entrees = [...paires.entries()].sort((a, b) => a[0].localeCompare(b[0]));

const entete = `// Code famille de chaque reference d'inventaire.
//
// Genere par scripts/generer-classement.mjs, et versionne pour que le
// reclassement tourne sur le serveur sans le CSV : ce fichier ne quitte pas le
// poste du magasin, alors que le catalogue doit pouvoir etre range partout.
//
// Ne contient que la structure -- reference et rayon d'origine. Ni quantites,
// ni prix, ni designations : le nom du produit en base fait deja office de
// designation, et le verifier a montre zero ecart de classement sur les 364
// references en stock.
//
// A regenerer apres chaque inventaire :
//   node scripts/generer-classement.mjs <inventaire.csv>

export const FAMILLE_PAR_REFERENCE = {
`;

const corps = entrees
  .map(([reference, famille]) => `  ${JSON.stringify(reference)}: ${JSON.stringify(famille)},`)
  .join("\n");

writeFileSync("scripts/lib/classement.mjs", `${entete}${corps}\n};\n`, "utf8");

console.log(`${entrees.length} references ecrites dans scripts/lib/classement.mjs`);
console.log("Pensez a le commiter : le serveur s'en sert au deploiement.");
