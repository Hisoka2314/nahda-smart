// Cree, en base, les groupes / attributs / options de filtres decrits dans
// scripts/lib/filtres-categories.mjs.
//
// Sans --apply, le script ne fait qu'un rapport. Il est idempotent : une
// seconde execution ne doit plus rien proposer.
//
// Il ne supprime jamais rien. Un attribut present en base mais absent de la
// definition est signale, pas efface : il porte peut-etre deja des valeurs
// verifiees, et une suppression en cascade les emporterait.
//
//   node scripts/configurer-filtres.mjs                    # rapport, tout
//   node scripts/configurer-filtres.mjs composants-pc      # rapport, ciblé
//   node scripts/configurer-filtres.mjs --apply            # ecriture

import pg from 'pg';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadLocalEnv } from './prod-maintenance-utils.mjs';
import { FILTRES_PAR_CATEGORIE, GROUPES } from './lib/filtres-categories.mjs';

loadLocalEnv();

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const cibles = args.filter((arg) => !arg.startsWith('--'));

for (const arg of args) {
  if (arg.startsWith('--') && arg !== '--apply') {
    throw new Error(`Option inconnue : ${arg}`);
  }
}

const categories = cibles.length > 0 ? cibles : Object.keys(FILTRES_PAR_CATEGORIE);

for (const slug of categories) {
  if (!FILTRES_PAR_CATEGORIE[slug]) {
    throw new Error(`Aucune definition de filtres pour la categorie "${slug}".`);
  }
}

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquant.');

if (apply) {
  const sauvegarde = spawnSync(
    process.execPath,
    [fileURLToPath(new URL('./backup-postgres.mjs', import.meta.url))],
    { env: process.env, encoding: 'utf8' },
  );
  if (sauvegarde.status !== 0) {
    throw new Error('Sauvegarde echouee : ecriture annulee. Lancer npm run backup:db pour diagnostiquer.');
  }
  console.log(`Sauvegarde : ${sauvegarde.stdout.trim().split('\n').pop()}`);
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const stats = { groupesCrees: 0, attributsCrees: 0, optionsCreees: 0, ajustements: 0, horsDefinition: 0 };
const journal = [];

try {
  await db.query(apply ? 'BEGIN' : 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');

  for (const slugCategorie of categories) {
    const categorie = (
      await db.query('SELECT id, name FROM "Category" WHERE slug = $1', [slugCategorie])
    ).rows[0];

    if (!categorie) {
      throw new Error(`Categorie absente en base : ${slugCategorie}`);
    }

    console.log(`\n### ${categorie.name} (${slugCategorie})`);
    const definition = FILTRES_PAR_CATEGORIE[slugCategorie];
    const slugsDefinis = new Set();

    for (const groupe of GROUPES) {
      const attributs = definition[groupe.cle] ?? [];
      if (attributs.length === 0) continue;

      let ligne = (
        await db.query('SELECT * FROM "FilterGroup" WHERE "categoryId" = $1 AND slug = $2', [
          categorie.id,
          groupe.slug,
        ])
      ).rows[0];

      if (!ligne) {
        stats.groupesCrees += 1;
        journal.push(`+ groupe ${groupe.name}`);
        if (apply) {
          ligne = (
            await db.query(
              `INSERT INTO "FilterGroup" (id, "categoryId", name, slug, "order", "defaultOpen", "isAdvanced", visible)
               VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
              [crypto.randomUUID(), categorie.id, groupe.name, groupe.slug, groupe.order, groupe.defaultOpen, groupe.isAdvanced],
            )
          ).rows[0];
        }
      }

      console.log(`  ${ligne ? '' : '[simulation] '}${groupe.name}`);

      for (const [index, attribut] of attributs.entries()) {
        slugsDefinis.add(attribut.slug);
        const ordre = index + 1;

        let enBase = (
          await db.query('SELECT * FROM "FilterAttribute" WHERE "categoryId" = $1 AND slug = $2', [
            categorie.id,
            attribut.slug,
          ])
        ).rows[0];

        if (!enBase) {
          stats.attributsCrees += 1;
          journal.push(`+ filtre ${attribut.label} [${attribut.slug}] (${attribut.type})`);
          console.log(`    + ${attribut.label} [${attribut.slug}] ${attribut.type}`);
          if (apply) {
            enBase = (
              await db.query(
                `INSERT INTO "FilterAttribute"
                   (id, "groupId", "categoryId", label, slug, type, unit, filterable, searchable, visible, "order")
                 VALUES ($1, $2, $3, $4, $5, $6::"FilterInputType", $7, true, $8, true, $9) RETURNING *`,
                [crypto.randomUUID(), ligne.id, categorie.id, attribut.label, attribut.slug, attribut.type, attribut.unit, attribut.searchable, ordre],
              )
            ).rows[0];
          }
        } else {
          // Le libelle, le groupe et l'ordre se corrigent ; le type et le
          // slug non : des valeurs produits en dependent deja.
          const corrections = [];
          if (enBase.label !== attribut.label) corrections.push(['label', attribut.label]);
          if (enBase.groupId !== ligne?.id && ligne) corrections.push(['groupId', ligne.id]);
          if (enBase.order !== ordre) corrections.push(['order', ordre]);
          if (enBase.searchable !== attribut.searchable) corrections.push(['searchable', attribut.searchable]);

          if (enBase.type !== attribut.type) {
            console.log(`    ! ${attribut.slug} : type ${enBase.type} en base, ${attribut.type} dans la definition - non modifie`);
            journal.push(`! type divergent sur ${attribut.slug} (${enBase.type} vs ${attribut.type})`);
          }

          if (corrections.length > 0) {
            stats.ajustements += 1;
            console.log(`    ~ ${attribut.label} [${attribut.slug}] : ${corrections.map(([cle]) => cle).join(', ')}`);
            if (apply) {
              const colonnes = corrections.map(([cle], position) => `"${cle}" = $${position + 2}`).join(', ');
              await db.query(
                `UPDATE "FilterAttribute" SET ${colonnes} WHERE id = $1`,
                [enBase.id, ...corrections.map(([, valeur]) => valeur)],
              );
            }
          }
        }

        if (!enBase) {
          // Simulation d'un filtre encore absent : pas d'id pour interroger
          // les options, mais le rapport doit quand meme les annoncer.
          stats.optionsCreees += attribut.options.length;
          for (const valeur of attribut.options) console.log(`      + option "${valeur}"`);
          continue;
        }

        const existantes = (
          await db.query('SELECT * FROM "FilterOption" WHERE "attributeId" = $1', [enBase.id])
        ).rows;
        const connues = new Map(existantes.map((option) => [option.value, option]));

        // L'ordre suit la definition : sans cela, une option ajoutee apres
        // coup ("20 W", "30 W") se retrouvait derriere "125 W" dans la liste
        // deroulante. Les options nees d'un import verifie, absentes de la
        // definition, gardent leur rang a la suite.
        for (const [index, valeur] of attribut.options.entries()) {
          const ordreOption = index + 1;
          const option = connues.get(valeur);

          if (!option) {
            stats.optionsCreees += 1;
            console.log(`      + option "${valeur}"`);
            if (apply) {
              await db.query(
                `INSERT INTO "FilterOption" (id, "attributeId", label, value, "order", visible)
                 VALUES ($1, $2, $3, $3, $4, true)`,
                [crypto.randomUUID(), enBase.id, valeur, ordreOption],
              );
            }
            continue;
          }

          if (option.order !== ordreOption) {
            stats.ajustements += 1;
            console.log(`      ~ option "${valeur}" : rang ${option.order} -> ${ordreOption}`);
            if (apply) {
              await db.query('UPDATE "FilterOption" SET "order" = $2 WHERE id = $1', [
                option.id,
                ordreOption,
              ]);
            }
          }
        }

        let rangSuivant = attribut.options.length;
        for (const option of existantes) {
          if (attribut.options.includes(option.value)) continue;
          rangSuivant += 1;
          if (option.order === rangSuivant) continue;
          stats.ajustements += 1;
          console.log(`      ~ option hors definition "${option.value}" : rang ${option.order} -> ${rangSuivant}`);
          if (apply) {
            await db.query('UPDATE "FilterOption" SET "order" = $2 WHERE id = $1', [
              option.id,
              rangSuivant,
            ]);
          }
        }
      }
    }

    const orphelins = (
      await db.query(
        `SELECT a.slug, a.label, count(v.id) AS valeurs
           FROM "FilterAttribute" a
           LEFT JOIN "ProductAttributeValue" v ON v."attributeId" = a.id
          WHERE a."categoryId" = $1
          GROUP BY a.id, a.slug, a.label
          ORDER BY a.slug`,
        [categorie.id],
      )
    ).rows.filter((ligne) => !slugsDefinis.has(ligne.slug));

    for (const orphelin of orphelins) {
      stats.horsDefinition += 1;
      console.log(`    ? ${orphelin.label} [${orphelin.slug}] est en base mais pas dans la definition (${orphelin.valeurs} valeur(s)) - laisse en place`);
    }
  }

  if (apply) {
    await db.query('COMMIT');
  } else {
    await db.query('ROLLBACK');
  }
} catch (erreur) {
  await db.query('ROLLBACK').catch(() => {});
  throw erreur;
} finally {
  await db.end();
}

console.log('\n=== Resume ===');
console.log(`mode             : ${apply ? 'application' : 'simulation'}`);
console.log(`groupes crees    : ${stats.groupesCrees}`);
console.log(`filtres crees    : ${stats.attributsCrees}`);
console.log(`options creees   : ${stats.optionsCreees}`);
console.log(`filtres ajustes  : ${stats.ajustements}`);
console.log(`hors definition  : ${stats.horsDefinition}`);

if (!apply && (stats.groupesCrees || stats.attributsCrees || stats.optionsCreees || stats.ajustements)) {
  console.log('\nRelancer avec --apply pour ecrire.');
}
