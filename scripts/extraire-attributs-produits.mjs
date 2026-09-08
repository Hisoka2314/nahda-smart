import pg from "pg";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";

const apply = process.argv.includes("--apply");
const envFile = readFileSync(".env", "utf8");
const url = process.env.DATABASE_URL ?? envFile.match(/DATABASE_URL="([^"]+)"/)?.[1];
if (!url) throw new Error("DATABASE_URL manquant.");
const db = new pg.Client({ connectionString: url });
await db.connect();

const products = (await db.query(`SELECT id, sku, name, "categoryId", "technicalDescription" FROM "Product" WHERE status <> 'ARCHIVED'`)).rows;
const attrs = (await db.query(`SELECT id, slug, "categoryId" FROM "FilterAttribute" WHERE visible = true AND filterable = true`)).rows;
const options = (await db.query(`SELECT id, "attributeId", label, value FROM "FilterOption" WHERE visible = true`)).rows;
const bySlug = new Map(attrs.map((a) => [`${a.categoryId}:${a.slug}`, a]));
const rules = [
  ["ram", /(\d+)\s*(?:go|gb)\s*(?:ram|ddr(?:[2345])?|[/:])?/i, (m) => `${m[1]} Go`],
  ["storageCapacity", /(\d+(?:\.\d+)?)\s*(go|gb|to|tb)\s*(?=(?:ssd|hdd|nvme|m\.2|disque|stockage))/i, (m) => `${m[1]} ${m[2].toUpperCase()}`],
  ["processorGeneration", /(\d{1,2})(?:e|ème|eme)\s*(?:génération|generation)?/i, (m) => `${m[1]}e génération`],
  ["processor", /(core\s*i[3579]|ryzen\s*[3579]|celeron|pentium|xeon)/i, (m) => m[1].replace(/\s+/g, " ")],
  ["screenSize", /(?:écran|screen)[^\d]{0,20}(\d{1,2}(?:[.,]\d)?)\s*(?:pouces|\")/i, (m) => `${m[1].replace(",", ".")} pouces`],
  ["resolution", /(\d{3,4}\s*[x×]\s*\d{3,4}|4K|Full HD|QHD|WUXGA)/i, (m) => m[1]],
  ["weight", /(?:poids|weight)[^\d]{0,20}(\d+(?:[.,]\d+)?)\s*kg/i, (m) => `${m[1].replace(",", ".")} kg`],
  ["graphics", /(?:NVIDIA|AMD|Intel)\s+(?:GeForce|Radeon|Iris|UHD|RTX|GTX)?\s*[A-Z0-9 -]{2,20}/i, (m) => m[0].trim()],
  ["storageType", /\b(SSD|HDD|NVMe|M\.2)\b/i, (m) => m[1].toUpperCase()],
  ["wifiStandard", /\b(Wi-?Fi\s*(?:4|5|6|6E|7|802\.11[a-z0-9/ -]*))\b/i, (m) => m[1].replace(/\s+/g, " ")],
  ["bluetooth", /\bBluetooth\s*([0-9.]+)/i, (m) => `Bluetooth ${m[1]}`],
  ["touch", /\b(tactile|touchscreen|écran tactile)\b/i, () => "Oui"],
];
let found = 0; let written = 0;
const report = new Map();
const unmatched = [];
for (const p of products) {
  const categoryReport = report.get(p.categoryId) ?? { products: 0, values: 0 };
  categoryReport.products++;
  report.set(p.categoryId, categoryReport);
  let fiche = "";
  try {
    const groups = JSON.parse(p.technicalDescription ?? "[]");
    fiche = groups.flatMap((g) => Array.isArray(g?.lignes) ? g.lignes.map((line) => Array.isArray(line) ? line.join(": ") : "") : []).join(" ");
  } catch { /* fiche ancienne ou texte non JSON */ }
  const text = `${p.name} ${fiche} ${p.technicalDescription ?? ""}`;
  for (const [slug, re, make] of rules) {
    const attr = bySlug.get(`${p.categoryId}:${slug}`); if (!attr) continue;
    const m = text.match(re); if (!m) continue;
    const value = make(m); found++;
    const normalize = (s) => String(s).toLowerCase().replace(/intel|amd|\s+/g, "").replace(/gb/g, "go").replace(/tb/g, "to");
    const option = options.find((o) => o.attributeId === attr.id && (normalize(o.value) === normalize(value) || normalize(o.label) === normalize(value)));
    categoryReport.values++;
    if (!option) unmatched.push(`${p.sku}: ${slug} = ${value}`);
    if (apply) {
      await db.query(`DELETE FROM "ProductAttributeValue" WHERE "productId"=$1 AND "attributeId"=$2`, [p.id, attr.id]);
      await db.query(`INSERT INTO "ProductAttributeValue" (id,"productId","attributeId","optionId","valueString") VALUES ($1,$2,$3,$4,$5)`, [crypto.randomUUID(), p.id, attr.id, option?.id ?? null, option ? null : value]);
      written++;
    }
  }
}
console.log(`${apply ? "IMPORT APPLIQUE" : "SIMULATION"}\nProduits examines : ${products.length}\nValeurs detectees : ${found}\nValeurs ecrites : ${written}\nFiltres absents a configurer : ${[...new Set(rules.map(([s]) => s).filter((s) => !attrs.some((a) => a.slug === s)))].join(", ") || "aucun"}`);
if (unmatched.length) console.log(`Valeurs sans option exacte : ${unmatched.length}\n${unmatched.slice(0, 30).join("\\n")}${unmatched.length > 30 ? "\\n..." : ""}`);
console.log("Repartition par categorie (id):");
for (const [category, value] of report) console.log(`- ${category}: ${value.products} produits, ${value.values} valeurs`);
await db.end();
