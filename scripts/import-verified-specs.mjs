import pg from 'pg';
import crypto from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadLocalEnv } from './prod-maintenance-utils.mjs';
import { validateEvidence, encodeValue, sameValue } from './lib/verified-specs.mjs';
loadLocalEnv();
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const purgeUnverified = args.includes('--purge-unverified');
if (args.some(arg => !['--apply', '--purge-unverified'].includes(arg))) throw new Error('Option inconnue.');
const specs = JSON.parse(readFileSync(new URL('../data/verified-product-specs.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''));
if (new Set(specs.map(item => item.sku)).size !== specs.length) throw new Error('SKU duplique.');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquant.');
mkdirSync(resolve('tmp'), { recursive: true });
const path = resolve('tmp', `verified-specs-${Date.now()}-${crypto.randomUUID()}.json`);
const report = {
  mode: apply ? 'application' : 'simulation',
  committed: false,
  purgeUnverified,
  purgeProposed: 0,
  purged: 0,
  proposed: 0,
  written: 0,
  entries: [],
  audit: [],
};
if (apply) {
  const backup = spawnSync(process.execPath, [fileURLToPath(new URL('./backup-postgres.mjs', import.meta.url))], { env: process.env, encoding: 'utf8' });
  if (backup.status !== 0) throw new Error('Sauvegarde echouee : import annule. Lancer npm run backup:db pour diagnostiquer.');
  report.backup = backup.stdout.trim();
}
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  await db.query(apply ? 'BEGIN ISOLATION LEVEL SERIALIZABLE' : 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  if (apply) await db.query('LOCK TABLE "ProductAttributeValue", "FilterAttribute", "FilterOption" IN SHARE ROW EXCLUSIVE MODE');
  const audit = await db.query('SELECT p.sku, a.slug, v.* FROM "ProductAttributeValue" v JOIN "Product" p ON p.id=v."productId" JOIN "FilterAttribute" a ON a.id=v."attributeId"');
  report.audit = audit.rows.filter(v => !v.valueJson?.verifiedSpec).map(v => ({ sku: v.sku, slug: v.slug, status: 'non_verifie', current: v }));
  report.purgeProposed = purgeUnverified ? report.audit.length : 0;
  if (apply && purgeUnverified && report.audit.length) {
    const ids = report.audit.map(entry => entry.current.id);
    const deleted = await db.query('DELETE FROM "ProductAttributeValue" WHERE id = ANY($1::text[]) RETURNING id', [ids]);
    report.purged = deleted.rowCount ?? 0;
  }
  for (const item of specs) {
    const product = (await db.query('SELECT id,"categoryId" FROM "Product" WHERE sku=$1', [item.sku])).rows[0];
    for (const [slug, fact] of Object.entries(item.facts)) {
      const entry = { sku: item.sku, slug, fact, status: 'preuve_insuffisante' };
      report.entries.push(entry);
      if (!product) { entry.status = 'produit_absent'; continue; }
      const attribute = (await db.query('SELECT * FROM "FilterAttribute" WHERE "categoryId"=$1 AND slug=$2', [product.categoryId, slug])).rows[0];
      if (!attribute) { entry.status = 'filtre_absent'; continue; }
      const old = (await db.query('SELECT * FROM "ProductAttributeValue" WHERE "productId"=$1 AND "attributeId"=$2', [product.id, attribute.id])).rows;
      entry.before = old;
      if (!validateEvidence(fact)) continue;
      if (!attribute.visible || !attribute.filterable) { entry.status = 'filtre_inactif'; continue; }
      let options = (await db.query('SELECT * FROM "FilterOption" WHERE "attributeId"=$1', [attribute.id])).rows;
      let encoded = encodeValue(attribute, options, fact.value);
      if (!encoded && !['BOOLEAN', 'RANGE', 'NUMERIC_RANGE'].includes(attribute.type) && apply && typeof fact.value !== 'boolean') {
        const label = String(fact.value);
        const nextOrder = Math.max(0, ...options.map(option => option.order ?? 0)) + 1;
        const created = await db.query('INSERT INTO "FilterOption" (id,"attributeId",label,value,"order",visible) VALUES ($1,$2,$3,$3,$4,true) RETURNING *', [crypto.randomUUID(), attribute.id, label, nextOrder]);
        options = [...options, created.rows[0]];
        encoded = encodeValue(attribute, options, fact.value);
        entry.optionCreated = true;
      }
      if (!encoded && !['BOOLEAN', 'RANGE', 'NUMERIC_RANGE'].includes(attribute.type) && !apply && typeof fact.value !== 'boolean') {
        entry.status = 'option_a_creer';
        entry.after = { value: fact.value, valueJson: { verifiedSpec: { sku: item.sku, slug, ...fact } } };
        report.proposed++;
        continue;
      }
      if (!encoded) { entry.status = 'option_absente_ou_type_incompatible'; continue; }
      const provenance = { verifiedSpec: { sku: item.sku, slug, ...fact } };
      const previousEvidence = old[0]?.valueJson?.verifiedSpec?.evidence ?? [];
      const nextEvidence = fact.evidence ?? [];
      const evidenceKey = evidence => JSON.stringify(evidence.map(source => ({ url: source.url, proof: source.proof })).sort((a, b) => `${a.url}${a.proof}`.localeCompare(`${b.url}${b.proof}`)));
      if (sameValue(old, encoded) && old[0]?.valueJson?.verifiedSpec?.value === fact.value && evidenceKey(previousEvidence) === evidenceKey(nextEvidence)) { entry.status = 'identique'; continue; }
      entry.status = old.length ? 'remplacement_propose' : 'ajout_propose';
      entry.after = { ...encoded, valueJson: provenance };
      report.proposed++;
      if (apply) {
        await db.query('DELETE FROM "ProductAttributeValue" WHERE "productId"=$1 AND "attributeId"=$2', [product.id, attribute.id]);
        await db.query('INSERT INTO "ProductAttributeValue" (id,"productId","attributeId","optionId","valueNumber","valueBoolean","valueJson") VALUES ($1,$2,$3,$4,$5,$6,$7)', [crypto.randomUUID(), product.id, attribute.id, encoded.optionId ?? null, encoded.valueNumber ?? null, encoded.valueBoolean ?? null, JSON.stringify(provenance)]);
      }
    }
  }
  writeFileSync(path, JSON.stringify(report, null, 2));
  await db.query(apply ? 'COMMIT' : 'ROLLBACK');
  report.committed = apply;
  report.written = apply ? report.proposed : 0;
} catch (error) {
  await db.query('ROLLBACK');
  report.error = error.message;
  process.exitCode = 1;
} finally {
  await db.end();
  writeFileSync(path, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ mode: report.mode, committed: report.committed, proposed: report.proposed, written: report.written, nonVerified: report.audit.length, purgeProposed: report.purgeProposed, purged: report.purged, statuses: report.entries.reduce((counts, e) => ({ ...counts, [e.status]: (counts[e.status] ?? 0) + 1 }), {}), report: path }, null, 2));
}
