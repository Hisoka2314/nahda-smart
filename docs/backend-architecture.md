# Architecture backend Nahda Smart

Phase 4A met en place la fondation Prisma/PostgreSQL sans brancher brutalement le front mock.

## Principes

- Le front client reste fonctionnel avec les mocks existants.
- Prisma sert de future source de vérité pour produits, commandes, devis, stock, filtres et mini ERP.
- Les services dans `lib/services/*` forment une couche DAL serveur.
- Les validations Zod dans `lib/validations/*` doivent être utilisées avant toute mutation.
- Les secrets restent dans `.env`, jamais dans le code.

## Prisma 7

Le projet utilise Prisma 7. La connexion PostgreSQL est configurée dans `prisma.config.ts`, pas dans `schema.prisma`.

Fichiers clés :

- `prisma/schema.prisma` : modèles, relations, enums et indexes.
- `prisma.config.ts` : chemin du schéma, migrations, `DATABASE_URL`.
- `prisma/seed.ts` : données initiales depuis les mocks.
- `lib/db.ts` : création lazy du client Prisma avec `@prisma/adapter-pg`.
- `scripts/generate-admin-hash.mjs` : génération locale d’un hash admin sans stocker le mot de passe en clair.

## Domaines couverts

- Admin : `AdminUser`, `AdminSession`, `AdminLog`, rôles exacts `SUPER_ADMIN`, `MANAGER`, `SELLER`, `STOCK_MANAGER`, `ACCOUNTANT`, `DELIVERY`.
- Catalogue : `Brand`, `Category`, `Product`, `ProductImage`.
- Filtres dynamiques : `FilterGroup`, `FilterAttribute`, `FilterOption`, `ProductAttributeValue`.
- Clients : `Customer` avec type, source et niveau.
- Commandes : `Order`, `OrderItem`, `OrderStatusHistory`.
- Devis : `Quote`, `QuoteItem`.
- Fournisseurs : `Supplier`, `SupplierPurchase`, `SupplierPurchaseItem`.
- Stock : `Depot`, `Stock`, `StockMovement`.
- SAV : `SAVTicket`.
- CMS léger : `Banner`, `ContactMessage`.

## Paiement

Seuls les paiements hors ligne existent dans le modèle :

- `CASH_ON_DELIVERY`
- `PAY_ON_SITE`

Aucun paiement Visa, CMI ou Mastercard n’est activé.

## Statuts initiaux

- Commande : `PENDING_CONFIRMATION`.
- Devis : `NEW`.
- Contact : `NEW`.

## Services prêts

- `getProducts`
- `getProductBySlug`
- `getCategories`
- `getFiltersByCategory`
- `createOrder`
- `createQuote`
- `createCustomer`
- `reserveStockForOrder`
- `releaseStockForCancelledOrder`
- `createStockMovement`

Les opérations stock/commande critiques utilisent des transactions Prisma et refusent un stock négatif.

## Sécurité prévue

- Valider les payloads avec Zod côté serveur.
- Ne jamais faire confiance aux données frontend.
- Protéger les futures mutations admin par auth et rôle.
- Journaliser les actions sensibles dans `AdminLog`.
- Garder les DTO publics minimaux quand le front sera branché à Prisma.
- Ne créer aucun `AdminUser` au seed si `ADMIN_PASSWORD_HASH` est absent ou placeholder.
- Créer un admin via `npm.cmd run admin:upsert` uniquement après génération d'un hash avec `npm.cmd run admin:hash`.
- Stocker les sessions admin comme tokens opaques : cookie `HttpOnly`, hash du token en DB, expiration courte.

## Logos de marques

`Brand.logoPath` est optionnel. Les vrais logos seront ajoutés manuellement plus tard depuis le dashboard admin. Le seed garde `logoPath: null` et `isOfficialAsset: false`.

## Ajout produit avec attributs

1. Créer ou sélectionner `Brand` et `Category`.
2. Créer `Product` avec prix, statut, condition et descriptions.
3. Ajouter `ProductImage`.
4. Créer ou réutiliser `FilterAttribute` et `FilterOption`.
5. Ajouter les valeurs dans `ProductAttributeValue`.
6. Créer les lignes `Stock` par dépôt.

## Ajout filtre dynamique

1. Créer `FilterGroup` pour la catégorie.
2. Créer `FilterAttribute` avec `type`, `unit`, `visible`, `filterable`, `searchable`.
3. Ajouter les `FilterOption`.
4. Relier les produits via `ProductAttributeValue`.
5. Le futur dashboard devra recalculer ou afficher les compteurs côté catalogue.
