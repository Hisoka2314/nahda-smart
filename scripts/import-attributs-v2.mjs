import pg from "pg";
import crypto from "node:crypto";
import { readdirSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadLocalEnv } from "./prod-maintenance-utils.mjs";
import { extraireAttributs, normaliserOption } from "./lib/attributs-techniques.mjs";
loadLocalEnv();
const apply = process.argv.includes("--apply");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL manquant.");
if (apply) { const d=path.resolve(process.env.BACKUP_DIR||"backups"); if (!readdirSync(d).some(f=>f.endsWith(".dump")&&statSync(path.join(d,f)).size>0&&Date.now()-statSync(path.join(d,f)).mtimeMs<86400000)) throw new Error("Sauvegarde de moins de 24 h obligatoire."); }
const db=new pg.Client({connectionString:process.env.DATABASE_URL}); await db.connect();
const report={mode:apply?"application":"simulation",products:[],summary:{}}; let tx=false;
try { await db.query(apply?"BEGIN":"BEGIN READ ONLY"); tx=true;
 const ps=(await db.query(`SELECT p.id,p.sku,p.name,p.status,p."categoryId",p."technicalDescription",c.name AS "categoryName" FROM "Product" p JOIN "Category" c ON c.id=p."categoryId" WHERE p.status <> 'ARCHIVED' ORDER BY p.sku`)).rows;
 const as=(await db.query(`SELECT id,slug,label,type,"categoryId" FROM "FilterAttribute" WHERE visible=true AND filterable=true`)).rows;
 const os=(await db.query(`SELECT id,"attributeId",label,value FROM "FilterOption" WHERE visible=true`)).rows;
 const vs=(await db.query(`SELECT "productId","attributeId" FROM "ProductAttributeValue"`)).rows; let proposed=0,written=0,preserved=0;
 for(const p of ps){const defs=as.filter(a=>a.categoryId===p.categoryId);const x=extraireAttributs(p,defs);const e={sku:p.sku,name:p.name,category:p.categoryName,proposals:[],issues:x.issues};for(const v of x.values){const a=defs.find(a=>a.slug===v.slug);if(!a){e.issues.push({...v,reason:"filtre absent"});continue;}if(vs.some(z=>z.productId===p.id&&z.attributeId===a.id)){preserved++;continue;}let o=os.find(o=>o.attributeId===a.id&&normaliserOption(o.value,v.slug)===normaliserOption(v.value,v.slug));if(!o&&os.some(o=>o.attributeId===a.id)){e.issues.push({...v,reason:"option créée automatiquement"});if(apply){o={id:crypto.randomUUID(),attributeId:a.id,label:String(v.value),value:String(v.value)};await db.query(`INSERT INTO "FilterOption" (id,"attributeId",label,value,"order",visible) VALUES ($1,$2,$3,$3,999,true)`,[o.id,a.id,o.value]);os.push(o);}}e.proposals.push({...v,attribute:a.label,option:o?.value??null});proposed++;if(apply){await db.query(`INSERT INTO "ProductAttributeValue" (id,"productId","attributeId","optionId","valueString") VALUES ($1,$2,$3,$4,$5)`,[crypto.randomUUID(),p.id,a.id,o?.id??null,o?null:String(v.value)]);written++;}}report.products.push(e);}
 report.summary={products:ps.length,proposed,written,preserved,issues:report.products.reduce((n,p)=>n+p.issues.length,0)};mkdirSync("tmp",{recursive:true});const f=path.resolve("tmp",`attributs-v2-${Date.now()}.json`);writeFileSync(f,JSON.stringify({...report,committed:false},null,2),{flag:"wx"});await db.query("COMMIT");tx=false;writeFileSync(f,JSON.stringify({...report,committed:apply},null,2));console.log(JSON.stringify(report.summary,null,2));console.log(`Rapport : ${f}`);
}catch(e){if(tx)await db.query("ROLLBACK");console.error(e.message);process.exitCode=1;}finally{await db.end();}
