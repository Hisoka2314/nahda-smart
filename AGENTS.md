<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Reprise du projet Nahda Smart

Avant toute modification, lire entièrement `docs/reprise-projet.md`. Le gérant
demande des réponses en français et attend que le travail autorisé soit mené
jusqu'à un résultat testable.

## État du chantier filtres au 13 septembre 2026

- Le registre `data/verified-product-specs.json` contient **35 références et
  247 valeurs**. Chaque valeur doit garder deux sources HTTPS, un extrait de
  preuve, une date et le périmètre exact de la variante.
- `scripts/import-verified-specs.mjs` est la seule voie autorisée pour écrire
  ces valeurs : simulation par défaut, sauvegarde PostgreSQL obligatoire en
  mode `--apply`, transaction sérialisable et provenance dans
  `valueJson.verifiedSpec`. Il ne sait porter **qu'une valeur par filtre** :
  les filtres à choix multiples (sorties vidéo, sockets compatibles) restent
  vides tant que la validation des preuves refuse les listes.
- La **structure** des filtres se déclare dans
  `scripts/lib/filtres-categories.mjs` et s'applique avec
  `scripts/configurer-filtres.mjs [categorie] --apply` : idempotent, ne
  supprime jamais rien, signale les filtres hors définition. Un filtre sans
  aucune valeur produit est masqué en boutique : on peut donc créer la
  structure avant d'avoir les faits.
- L'ancien `scripts/extraire-attributs-produits.mjs --apply` a déjà produit
  des erreurs (`graphics = Intel Core i7`, `storageCapacity = 8 Go`). Ne plus
  l'utiliser pour écrire.
- Tests locaux : 73 tests, TypeScript, ESLint et build Next.js (243 pages)
  passent. Après import local, la seconde simulation retourne `proposed: 0`,
  `identique: 247`, `nonVerified: 0`.
- Le serveur n'a **pas encore reçu** les lots locaux du 9 et du 13 septembre.
  Son dernier rapport communiqué contenait encore `nonVerified: 325` et
  n'avait rien écrit. Commandes de publication dans
  `docs/rapport-filtres-composants-pc-2026-09-13.md`.
- **Composants PC est fait** : 28 filtres, 125 options, 44 valeurs sur 10
  références. Le prochain point de reprise est les quatre catégories encore
  sans aucun `FilterAttribute` — Câbles & Connectique (23 produits), Énergie
  & Éclairage (12), Ventilation & Climatisation (9), Écrans & Moniteurs (3) —
  puis les 20 barrettes de mémoire de Composants PC, qui demandent l'avis du
  gérant faute de référence fabricant dans la désignation.
- Ne déduire aucune valeur d'un nom seul. Quand deux sources se contredisent,
  laisser vide : c'est ce qui a été fait pour le TDP des GT 1030.

Ne jamais ajouter `.claude/settings.local.json` au commit. Les commandes de
publication et le rapport détaillé se trouvent à la fin de
`docs/reprise-projet.md`.
