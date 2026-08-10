import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { loadLocalEnv, timestampSlug } from "./prod-maintenance-utils.mjs";

loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL est requis pour exporter les CSV.");
  process.exit(1);
}

const exportDir = resolve(process.env.EXPORT_DIR ?? "exports", timestampSlug());

if (!existsSync(exportDir)) {
  mkdirSync(exportDir, { recursive: true });
}

const client = new pg.Client({ connectionString: databaseUrl });

await client.connect();

try {
  await exportQuery(
    "commandes",
    `
      SELECT
        o."orderNumber",
        o."status",
        o."deliveryMethod",
        o."paymentMethod",
        o."subtotal",
        o."deliveryFee",
        o."total",
        o."createdAt",
        c."name" AS "customerName",
        c."phone" AS "customerPhone",
        c."city" AS "customerCity",
        c."type" AS "customerType"
      FROM "orders" o
      JOIN "Customer" c ON c."id" = o."customerId"
      ORDER BY o."createdAt" DESC
      LIMIT 5000
    `,
  );
  await exportQuery(
    "produits",
    `
      SELECT
        p."sku",
        p."name",
        p."slug",
        b."name" AS "brand",
        c."name" AS "category",
        p."priceSell",
        p."promoPrice",
        p."status",
        p."condition",
        p."warrantyMonths",
        p."isPromo",
        p."isNew",
        p."isRecommended",
        p."isBestSeller",
        p."updatedAt"
      FROM "Product" p
      JOIN "Brand" b ON b."id" = p."brandId"
      JOIN "Category" c ON c."id" = p."categoryId"
      ORDER BY p."updatedAt" DESC
      LIMIT 5000
    `,
  );
  await exportQuery(
    "clients",
    `
      SELECT
        "name",
        "phone",
        "email",
        "city",
        "type",
        "source",
        "level",
        "relationshipStatus",
        "organizationName",
        "createdAt"
      FROM "Customer"
      ORDER BY "createdAt" DESC
      LIMIT 5000
    `,
  );
  await exportQuery(
    "stock",
    `
      SELECT
        p."sku",
        p."name" AS "productName",
        d."name" AS "depotName",
        s."quantity",
        s."lowStockThreshold"
      FROM "Stock" s
      JOIN "Product" p ON p."id" = s."productId"
      JOIN "Depot" d ON d."id" = s."depotId"
      ORDER BY d."name", p."sku"
      LIMIT 5000
    `,
  );
} finally {
  await client.end();
}

console.log(`Exports CSV crees dans: ${exportDir}`);

async function exportQuery(name, sql) {
  const result = await client.query(sql);
  const file = resolve(exportDir, `${name}.csv`);
  const headers = result.fields.map((field) => field.name);
  const lines = [
    headers.join(","),
    ...result.rows.map((row) =>
      headers.map((header) => csvCell(row[header])).join(","),
    ),
  ];
  writeFileSync(file, `${lines.join("\n")}\n`, "utf8");
  console.log(`${name}: ${result.rows.length} lignes`);
}

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  return `"${neutralizeFormula(text).replaceAll('"', '""')}"`;
}

// Injection de formule CSV : les guillemets protegent l'analyse du fichier
// mais pas Excel, qui evalue toute cellule commencant par = + - @ (ou une
// tabulation / un retour chariot). Un nom client saisi au checkout sous la
// forme =HYPERLINK(...) s'executait donc a l'ouverture de l'export.
// L'apostrophe de tete force Excel a traiter la valeur comme du texte.
function neutralizeFormula(text) {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}
