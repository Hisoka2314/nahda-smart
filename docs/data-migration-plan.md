# Plan de migration mock vers Prisma

Phase 4A prépare la DB sans remplacer les mocks du front.

## Pages encore en mock

- `/` : homepage avec données `data/products.ts`, `data/brands.ts`.
- `/catalogue` et `/categorie/[slug]` : produits et filtres depuis `data/catalogue.ts` et `data/filter-definitions.ts`.
- `/produit/[slug]` : détail produit depuis les mocks catalogue.
- `/panier` : panier `localStorage`.
- `/checkout` : commande mock `localStorage`.
- `/demande-devis` : devis mock `localStorage`.
- `/suivre-commande` : lookup mock `localStorage`.
- `/admin` : placeholder.

## Migration catalogue

1. Garder les composants actuels.
2. Remplacer progressivement les imports mock par `lib/services/products.ts`.
3. Mapper les résultats Prisma en DTO compatibles avec les composants existants.
4. Ajouter une option de fallback mock si `DATABASE_URL` ou la DB n’est pas disponible.
5. Brancher `getFiltersByCategory` pour remplacer `data/filter-definitions.ts`.

## Migration produit

1. Utiliser `getProductBySlug`.
2. Transformer `ProductImage`, `Brand`, `Category`, `ProductAttributeValue` en structure UI existante.
3. Garder les images générées tant que les vraies photos fournisseurs ne sont pas uploadées.

## Migration checkout

1. Garder `localStorage` pour le panier tant que l’utilisateur n’est pas authentifié.
2. À la validation, envoyer les données à une Server Action/API qui utilise `createOrder`.
3. Enregistrer `Customer`, `Order`, `OrderItem`, `OrderStatusHistory`.
4. Garder le statut initial `PENDING_CONFIRMATION`.
5. Vider le panier seulement après succès DB.

## Migration devis

1. Remplacer le submit mock par une Server Action/API qui utilise `createQuote`.
2. Enregistrer client optionnel, message, besoin, urgence, budget et items.
3. Statut initial `NEW`.

## Migration suivi commande

1. Rechercher par `orderNumber` et téléphone client.
2. Retourner un DTO minimal : statut, date, total, items.
3. Ne jamais exposer notes internes ou informations sensibles.

## Migration localStorage

- Panier : peut rester local jusqu’au compte client.
- Commandes/devis mock : ne pas migrer automatiquement sans confirmation utilisateur.
- Futur compte client : proposer une resynchronisation après connexion si nécessaire.

## Tests de migration

- Comparer le rendu catalogue mock vs Prisma.
- Tester absence DB : le front doit rester lisible et ne pas casser.
- Tester commande vide, quantité négative, stock insuffisant.
- Tester devis sans produit mais avec message.
