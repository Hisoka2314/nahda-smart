import pg from "pg";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { loadLocalEnv } from "./prod-maintenance-utils.mjs";
loadLocalEnv();
const apply = process.argv.includes("--apply");
const specs = JSON.parse(readFileSync(new URL("../data/verified-product-specs.json", import.meta.url)));
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL manquant.");
const db = new pg.Client({ connectionString: process.env.DATABASE_URL }); await db.connect();
let written=0, skipped=0; const report=[];
try { await db.query(apply?"BEGIN":"BEGIN READ ONLY");
  for (const item of specs) {
    const p=(await db.query(`SELECT id,"categoryId" FROM "Product" WHERE sku=$1`,[item.sku])).rows[0];
    if(!p){report.push({sku:item.sku,reason:"produit introuvable"});continue;}
    for(const [slug,value] of Object.entries(item.facts)){
      const a=(await db.query(`SELECT id,type FROM "FilterAttribute" WHERE "categoryId"=$1 AND slug=$2 AND visible=true AND filterable=true`,[p.categoryId,slug])).rows[0];
      if(!a){report.push({sku:item.sku,slug,value,reason:"filtre absent"});continue;}
      const old=await db.query(`SELECT id FROM "ProductAttributeValue" WHERE "productId"=$1 AND "attributeId"=$2`,[p.id,a.id]);
      if(old.rowCount){skipped++;continue;}
      const option=(await db.query(`SELECT id FROM "FilterOption" WHERE "attributeId"=$1 AND lower(value)=lower($2)`,[a.id,String(value)])).rows[0];
      if(apply) await db.query(`INSERT INTO "ProductAttributeValue" (id,"productId","attributeId","optionId","valueString","valueBoolean") VALUES ($1,$2,$3,$4,$5,$6)`,[crypto.randomUUID(),p.id,a.id,option?.id??null,option?null:typeof value==="boolean"?null:String(value),typeof value==="boolean"?value:null]);
      written++; report.push({sku:item.sku,slug,value,source:item.sources[0],status:option?"option":"texte"});
    }
  }
  await db.query(apply?"COMMIT":"ROLLBACK"); console.log(JSON.stringify({mode:apply?"application":"simulation",written,skipped,report},null,2));
} catch(e){await db.query("ROLLBACK");throw e;} finally{await db.end();}
