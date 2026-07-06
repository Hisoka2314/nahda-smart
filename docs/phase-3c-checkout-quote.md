# Phase 3C - Checkout hors ligne et devis

## Scope actuel

- Checkout mock sur `/checkout`.
- Confirmation sur `/commande-confirmee`.
- Demande de devis complète sur `/demande-devis`.
- Suivi local mock sur `/suivre-commande`.
- Aucune base Prisma/PostgreSQL.
- Aucun paiement en ligne actif.

## Stockage temporaire

- Commandes : `nahda-smart-orders-v1`.
- Devis : `nahda-smart-quotes-v1`.
- Panier : `nahda-smart-cart-v1`.

Ces données sont stockées dans `localStorage` et ne sont donc pas synchronisées
entre navigateurs, appareils ou sessions privées.

## Statuts initiaux

- Commande : `pending_confirmation` -> "En attente de confirmation".
- Devis : `new` -> "Nouveau".

## Paiements actifs

- Paiement à la livraison.
- Paiement sur place / retrait magasin.

Visa, CMI, Mastercard et paiement en ligne ne sont pas activés dans cette phase.

## Préparation backend

Les schemas Zod et types TypeScript vivent dans `lib/orders.ts` et
`types/order.ts`. Lors de la phase Prisma, ces structures pourront alimenter :

- `Order`
- `OrderItem`
- `Customer`
- `QuoteRequest`
- `QuoteRequestItem`
- `OrderStatusLog`

La validation serveur devra reprendre les mêmes règles, notamment téléphone
marocain, panier non vide, quantités positives et champs professionnels
obligatoires selon le type client.
