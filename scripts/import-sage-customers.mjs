// Import du fichier client Sage vers la table Customer.
//
// Utilisation :
//   node scripts/import-sage-customers.mjs <fichier.csv> [--apply]
//
// Sans --apply, le script ne fait qu'un rapport (aucune ecriture).
//
// Le CSV attendu a trois colonnes : numero,nom,telephone
// Depuis Sage 100 : Liste des clients > Exporter > CSV (separateur virgule,
// encodage UTF-8). Si l'export est en .xlsx, l'enregistrer d'abord en CSV.
//
// Regles appliquees :
//   - Le code client Sage devient la reference du client (001, C367, F002...).
//     Il n'est jamais reecrit : c'est la cle de rapprochement avec Sage.
//   - Toutes les fiches sont importees, y compris sans telephone. Le champ
//     phone reste alors NULL (et non chaine vide) : une fiche sans contact ne
//     doit jamais etre rattachee par erreur a une commande du site.
//   - Le telephone, quand il existe, est stocke sous forme canonique
//     212XXXXXXXXX, la meme que le checkout et le suivi de commande.
//   - Le script est idempotent : une fiche dont la reference Sage existe deja
//     est ignoree, jamais ecrasee (le CRM du site fait foi sur les fiches
//     vivantes). Relancable sans risque apres un nouvel export Sage.

import { readFileSync } from "node:fs";
import pg from "pg";

const [, , csvPath, ...flags] = process.argv;
const apply = flags.includes("--apply");

if (!csvPath) {
  console.error("Usage : node scripts/import-sage-customers.mjs <fichier.csv> [--apply]");
  process.exit(1);
}

const databaseUrl =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!databaseUrl) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

// Meme canonicalisation que lib/validations/common.ts.
function normalizeMoroccanPhone(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("212")) return digits;
  if (digits.startsWith("0")) return `212${digits.slice(1)}`;
  return digits;
}

const isValidPhone = (value) => /^212[5-8]\d{8}$/.test(value);

// Sage contient des cellules du type "0661095025/0694414769" : on retient le
// premier numero exploitable plutot que de perdre la fiche entiere.
function extractFirstValidPhone(raw) {
  for (const part of String(raw ?? "").split(/[/;,|]/)) {
    const candidate = normalizeMoroccanPhone(part);
    if (isValidPhone(candidate)) return candidate;
  }

  return normalizeMoroccanPhone(raw);
}

const COMPANY_PATTERN = /\b(ST|STE|SARL|S\.?A\.?R\.?L|S\.?A|SOCIETE|SOCIÉTÉ|ETS|CIE|GROUPE|SNC|SAS|COMPANY)\b/;

function parseCsv(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? "").trim()]));
  });
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}

// Sage exporte en majuscules : "AIT NASER RACHID" devient "Ait Naser Rachid".
function toTitleCase(name) {
  return name
    .toLocaleLowerCase("fr")
    .replace(/(^|[\s'’\-])([\p{L}])/gu, (_, sep, letter) => sep + letter.toLocaleUpperCase("fr"));
}

const rows = parseCsv(readFileSync(csvPath, "utf8"));
const client = new pg.Client({ connectionString: databaseUrl });

const stats = {
  lues: rows.length,
  sansNom: 0,
  sansReference: 0,
  avecTelephone: 0,
  sansTelephone: 0,
  telephoneInvalide: 0,
  doublonReference: 0,
  doublonTelephone: 0,
  dejaEnBase: 0,
  aImporter: 0,
  importees: 0,
};

const seenRef = new Set();
const seenPhone = new Set();
const candidates = [];

for (const row of rows) {
  const nom = row.nom?.trim();
  const reference = row.numero?.trim();
  const brut = row.telephone?.trim();

  if (!nom) {
    stats.sansNom += 1;
    continue;
  }

  // La reference Sage est la cle du rapprochement : sans elle on ne peut ni
  // dedoublonner a la relance, ni retrouver la fiche dans Sage.
  if (!reference) {
    stats.sansReference += 1;
    continue;
  }

  if (seenRef.has(reference)) {
    stats.doublonReference += 1;
    continue;
  }

  seenRef.add(reference);

  let phone = null;

  if (brut) {
    const candidate = extractFirstValidPhone(brut);

    if (!isValidPhone(candidate)) {
      stats.telephoneInvalide += 1;
    } else if (seenPhone.has(candidate)) {
      // Meme numero sur deux codes Sage : on garde les deux fiches (les codes
      // sont distincts cote comptabilite) mais un seul porte le telephone,
      // sinon la recherche par numero deviendrait ambigue.
      stats.doublonTelephone += 1;
    } else {
      seenPhone.add(candidate);
      phone = candidate;
      stats.avecTelephone += 1;
    }
  } else {
    stats.sansTelephone += 1;
  }

  candidates.push({
    reference,
    phone,
    name: toTitleCase(nom),
    type: COMPANY_PATTERN.test(nom.toUpperCase()) ? "COMPANY" : "INDIVIDUAL",
  });
}

try {
  await client.connect();

  const existing = await client.query('SELECT reference, phone FROM "Customer"');
  const knownRefs = new Set(existing.rows.map((r) => r.reference));
  const knownPhones = new Set(
    existing.rows.filter((r) => r.phone).map((r) => normalizeMoroccanPhone(r.phone)),
  );

  const toInsert = candidates.filter((c) => {
    if (knownRefs.has(c.reference)) {
      stats.dejaEnBase += 1;
      return false;
    }
    return true;
  });

  // Un telephone deja porte par une fiche du CRM site : on importe quand meme
  // la fiche Sage (son code comptable est distinct) mais sans le numero, pour
  // preserver l'unicite du rapprochement telephonique.
  for (const c of toInsert) {
    if (c.phone && knownPhones.has(c.phone)) {
      c.phone = null;
      stats.doublonTelephone += 1;
      stats.avecTelephone -= 1;
    }
  }

  stats.aImporter = toInsert.length;

  if (apply) {
    const CHUNK = 200;

    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const batch = toInsert.slice(i, i + CHUNK);
      const values = [];
      const params = [];

      batch.forEach((c, j) => {
        const b = j * 5;
        values.push(
          `(gen_random_uuid()::text, $${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}::"CustomerType", 'STORE', 'LOYAL', 'NORMAL', $${b + 5}, ARRAY['sage'], now(), now())`,
        );
        params.push(
          c.reference,
          c.name,
          c.phone,
          c.type,
          `Import Sage — code client ${c.reference}`,
        );
      });

      await client.query(
        `INSERT INTO "Customer"
           (id, reference, name, phone, type, source, level,
            "relationshipStatus", "internalNotes", tags, "createdAt", "updatedAt")
         VALUES ${values.join(",")}
         ON CONFLICT (reference) DO NOTHING`,
        params,
      );

      stats.importees += batch.length;
      process.stdout.write(`\r  insertion... ${stats.importees}/${toInsert.length}`);
    }

    process.stdout.write("\r".padEnd(50) + "\r");
  }

  console.log("");
  console.log(apply ? "=== IMPORT EFFECTUE ===" : "=== SIMULATION (ajoutez --apply pour ecrire) ===");
  console.log(`  Lignes lues                    : ${stats.lues}`);
  console.log(`  Ignorees, sans nom             : ${stats.sansNom}`);
  console.log(`  Ignorees, sans code Sage       : ${stats.sansReference}`);
  console.log(`  Ignorees, code Sage en doublon : ${stats.doublonReference}`);
  console.log(`  Ignorees, deja en base         : ${stats.dejaEnBase}`);
  console.log(`  A importer                     : ${stats.aImporter}`);
  if (apply) console.log(`  Importees                      : ${stats.importees}`);
  console.log("");
  console.log(`  dont avec telephone            : ${stats.avecTelephone}`);
  console.log(`  dont sans telephone (NULL)     : ${stats.aImporter - stats.avecTelephone}`);
  console.log(`     telephones illisibles       : ${stats.telephoneInvalide}`);
  console.log(`     telephones deja utilises    : ${stats.doublonTelephone}`);

  const societes = toInsert.filter((c) => c.type === "COMPANY").length;
  console.log(`  societes : ${societes} · particuliers : ${toInsert.length - societes}`);
  console.log("");
} finally {
  await client.end();
}
