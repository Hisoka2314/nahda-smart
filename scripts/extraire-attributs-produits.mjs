import pg from "pg";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";

const apply = process.argv.includes("--apply");
const envFile = readFileSync(".env", "utf8");
const url = process.env.DATABASE_URL ?? envFile.match(/DATABASE_URL="([^"]+)"/)?.[1];
if (!url) throw new Error("DATABASE_URL manquant.");
const db = new pg.Client({ connectionString: url });
await db.connect();

const products = (await db.query(`SELECT id, sku, name, "technicalDescription" FROM "Product" WHERE status <> 'ARCHIVED'`)).rows;
const attrs = (await db.query(`SELECT id, slug, "categoryId" FROM "FilterAttribute" WHERE visible = true AND filterable = true`)).rows;
const bySlug = new Map(attrs.map((a) => [a.slug, a]));
const rules = [
  ["ram", /(\d+)\s*(?:go|gb)\s*(?:ram|ddr)?/i, (m) => `${m[1]} Go`],
  ["storageCapacity", /(\d+(?:\.\d+)?)\s*(go|gb|to|tb)\s*(?:ssd|hdd|nvme)?/i, (m) => `${m[1]} ${m[2].toUpperCase()}`],
  ["processorGeneration", /(\d{1,2})(?:e|ème|eme)\s*(?:génération|generation)?/i, (m) => `${m[1]}e génération`],
  ["processor", /(core\s*i[3579]|ryzen\s*[3579]|celeron|pentium|xeon)/i, (m) => m[1].replace(/\s+/g, " ")],
];
let found = 0; let written = 0;
for (const p of products) {
  const text = `${p.name} ${p.technicalDescription ?? ""}`;
  for (const [slug, re, make] of rules) {
    const attr = bySlug.get(slug); if (!attr) continue;
    const m = text.match(re); if (!m) continue;
    const value = make(m); found++;
    if (apply) {
      await db.query(`DELETE FROM "ProductAttributeValue" WHERE "productId"=$1 AND "attributeId"=$2`, [p.id, attr.id]);
      await db.query(`INSERT INTO "ProductAttributeValue" (id,"productId","attributeId","valueString") VALUES ($1,$2,$3,$4)`, [crypto.randomUUID(), p.id, attr.id, value]);
      written++;
    }
  }
}
console.log(`${apply ? "IMPORT APPLIQUE" : "SIMULATION"}\nProduits examines : ${products.length}\nValeurs detectees : ${found}\nValeurs ecrites : ${written}\nFiltres absents a configurer : ${[...new Set(rules.map(([s]) => s).filter((s) => !bySlug.has(s)))].join(", ") || "aucun"}`);
await db.end();
