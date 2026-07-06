# Phase 3B - Produit et panier mock

## WhatsApp

Le numéro WhatsApp placeholder est centralisé dans `lib/contact.ts` et réexporté depuis `lib/product.ts` pour compatibilité :

```ts
export const NAHDA_WHATSAPP_NUMBER = "212600000000";
```

Remplacer cette valeur par le numéro officiel Nahda Smart au format international sans `+`.

## Panier mock

Le panier est stocké côté client dans `localStorage` avec la clé :

```ts
nahda-smart-cart-v1
```

La logique actuelle est isolée dans :

- `components/cart/cart-provider.tsx`
- `lib/cart.ts`
- `types/cart.ts`

Cette structure est prête à être remplacée ou synchronisée plus tard avec Prisma/PostgreSQL sans modifier les composants produit.

## Paiements actifs

Les paiements actifs au lancement restent uniquement :

- Paiement à la livraison
- Paiement sur place / retrait magasin
- Demande de devis

Aucun paiement par carte, Visa, CMI ou Mastercard n'est affiché comme actif dans cette phase.

## Checkout

Le bouton `Passer commande` sur `/panier` affiche un message placeholder. La vraie route checkout sera traitée dans une phase ultérieure.
