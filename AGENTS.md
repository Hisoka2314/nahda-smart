<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Reprise du projet Nahda Smart

Avant toute modification, lire entièrement `docs/reprise-projet.md`. Le gérant
demande des réponses en français et attend que le travail autorisé soit mené
jusqu'à un résultat testable.

## État du chantier filtres au 9 septembre 2026

- Le registre `data/verified-product-specs.json` contient actuellement **25
  références et 203 valeurs**. Chaque valeur doit garder deux sources HTTPS,
  un extrait de preuve, une date et le périmètre exact de la variante.
- `scripts/import-verified-specs.mjs` est la seule voie autorisée pour écrire
  ces valeurs : simulation par défaut, sauvegarde PostgreSQL obligatoire en
  mode `--apply`, transaction sérialisable et provenance dans
  `valueJson.verifiedSpec`.
- L'ancien `scripts/extraire-attributs-produits.mjs --apply` a déjà produit
  des erreurs (`graphics = Intel Core i7`, `storageCapacity = 8 Go`). Ne plus
  l'utiliser pour écrire.
- Les tests locaux du registre courant passent : 67 tests, TypeScript, ESLint
  et build Next.js. Après import local, la seconde simulation retourne
  `proposed: 0`, `identique: 203`, `nonVerified: 0`.
- Le serveur n'a pas encore reçu le lot local courant. Son dernier rapport
  communiqué contenait encore `nonVerified: 325` et n'avait rien écrit.
- Le travail n'est pas terminé pour les 378 produits. Le prochain point de
  reprise est la création des filtres techniques manquants pour les catégories
  dont PostgreSQL ne contient aucun `FilterAttribute`, en commençant par
  **Composants PC (38 produits)**, puis la recherche sourcée des références
  ASUS/MSI/Biostar/AMD. Ne déduire aucune valeur d'un nom seul.

Ne jamais ajouter `.claude/settings.local.json` au commit. Les commandes de
publication et le rapport détaillé se trouvent à la fin de
`docs/reprise-projet.md`.
