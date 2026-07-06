# Fournisseurs et achats fournisseurs

Phase 5D ajoute le module fournisseur admin pour Nahda Smart.

## Donnees gerees

- Fournisseurs internes uniquement, jamais exposes cote public.
- Types fournisseurs : importateur, grossiste, revendeur, particulier, distributeur.
- Tags fournisseur : prix interessant, livraison rapide, garantie fiable, paiement flexible, a surveiller, probleme SAV, import direct.
- Achats fournisseurs avec statut : brouillon, recu, partiellement paye, paye, annule.
- Lignes d'achat avec produit existant, quantite et prix achat unitaire.
- Frais additionnels : transport, douane, autres frais.
- Paiements fournisseur partiels via `SupplierPayment`.
- Notes fournisseur privees via `SupplierNote`.

## Stock entrant

Un achat fournisseur alimente le stock uniquement lorsqu'il est recu :

- creation directe avec statut recu, partiellement paye ou paye ;
- ou validation d'un achat brouillon via l'action de reception.

La reception cree :

- les `SupplierPurchaseItem` ;
- une mise a jour `Stock` par produit/depot ;
- un `StockMovement` de type `IN` pour chaque ligne ;
- un `AdminLog`.

Les achats brouillons ne modifient pas le stock.

## Paiements fournisseur

La phase 5D gere les paiements simples :

- montant total achat ;
- montant paye ;
- reste a payer ;
- paiements partiels historises.

Le systeme refuse un paiement qui depasse le total achat. Une finance fournisseur plus avancee peut ajouter plus tard des methodes normalisees, rapprochements, echeances et exports.

## Prix achat historique

Le detail fournisseur affiche les produits achetes, le dernier prix achat et l'historique par achat. Lors de la creation d'achat, un role autorise peut choisir de mettre a jour le `priceBuy` produit. Ces donnees restent strictement admin et ne doivent jamais etre exposees cote public.

## Upload facture

L'upload facture fournisseur est volontairement reporte. La phase suivante devra stocker les fichiers dans un emplacement prive, par exemple :

`storage/private/supplier-invoices/`

Contraintes prevues :

- PDF/JPG/PNG/WebP uniquement ;
- validation MIME et extension ;
- taille maximale ;
- nom de fichier randomise ;
- jamais dans `/public` ;
- acces uniquement admin autorise ;
- `AdminLog` a chaque ajout/remplacement/suppression.
