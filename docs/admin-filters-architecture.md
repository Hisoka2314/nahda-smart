# Architecture des filtres admin

Cette architecture prépare les filtres catalogue pour une gestion manuelle depuis le dashboard Nahda Smart. Depuis la Phase 4A, les tables Prisma sont créées, mais le dashboard admin complet n’est pas encore construit.

## Source de vérité actuelle

Les groupes et attributs de filtres mock sont centralisés dans `data/filter-definitions.ts`.

Le composant catalogue consomme encore cette structure pour afficher les filtres techniques par catégorie. La DB cible existe maintenant dans Prisma et le seed peut remplir les filtres initiaux.

## Modèle cible

### Category

- `id`
- `name`
- `slug`
- `filterGroups`

### FilterGroup

- `id`
- `categorySlug`
- `name`
- `order`
- `defaultOpen`
- `isAdvanced`

### FilterAttribute

- `id`
- `groupId`
- `categorySlug`
- `label`
- `slug`
- `type`
- `unit`
- `filterable`
- `searchable`
- `visible`
- `order`
- `options`

### FilterOption

- `id`
- `label`
- `value`
- `count`
- `order`

## Types supportés

- `checkbox`
- `radio`
- `range`
- `boolean`
- `select`
- `multi-select`
- `search-list`
- `numeric-range`

## Règles UI

- Les filtres principaux peuvent être ouverts par défaut.
- Les filtres avancés restent fermés par défaut.
- Les longues listes peuvent activer `searchable`.
- Les filtres vides ne sont pas affichés côté boutique.
- Les options affichent un compteur quand les données produit permettent de le calculer.
- Sur desktop, la sidebar suit le scroll naturel de la page.
- Sur mobile, le drawer garde ses actions sticky : `Réinitialiser` et `Voir les produits`.

## Gestion admin prévue

Le dashboard pourra ajouter :

- création/modification d'un groupe de filtres
- création/modification d'un attribut filtre
- choix du type de filtre
- ajout/suppression/réordonnancement des options
- visibilité d'un filtre
- état avancé ou principal
- ordre d'affichage
- catégorie liée
- unité : `Go`, `To`, `pouces`, `Hz`, `ports`, `W`, `VA`, `m`, `MP`, etc.

## Modèle Prisma disponible

La structure actuelle est maintenant représentée par :

- `Category`
- `FilterGroup`
- `FilterAttribute`
- `FilterOption`
- `ProductAttributeValue`

Chaque produit peut conserver des attributs dynamiques via `ProductAttributeValue`, avec une valeur optionnelle textuelle, numérique, booléenne, JSON ou une option liée.

## Migration frontend restante

Le front catalogue utilise encore les mocks. La prochaine étape sera de brancher `lib/services/filters.ts` et de mapper les résultats Prisma vers les composants de filtres existants.

## Sécurité future

Toutes les mutations admin devront :

- être protégées par session et rôle
- accepter seulement les rôles autorisés, par exemple `SUPER_ADMIN`, `MANAGER`, `STOCK_MANAGER`
- valider les payloads avec Zod côté serveur
- normaliser les slugs
- empêcher les doublons critiques par catégorie
- journaliser les changements dans les logs admin
- sécuriser les uploads de logos ou icônes avec validation MIME, taille, extension et stockage contrôlé
