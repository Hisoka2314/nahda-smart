# Reprendre le projet Nahda Smart

Ce document est écrit pour un agent qui reprend le travail sans connaître
l'historique. Il dit ce qu'est le projet, ce qui est fait, ce qui reste, et
surtout les pièges qui ont déjà coûté cher.

Lisez-le en entier avant d'écrire une ligne.

---

## 1 — Ce qu'est le projet

Boutique en ligne et back-office pour **Nahda Smart**, SARL AU marocaine
basée à Rabat (Agdal). Le magasin vend du matériel informatique, du réseau,
de la vidéosurveillance et de la téléphonie, à des particuliers comme à des
entreprises.

Le site remplit trois rôles :

1. **Vitrine publique** — catalogue, fiches produit, panier, commande avec
   paiement à la livraison ou retrait en magasin, demande de devis.
2. **Back-office** — produits, stock, commandes, devis, clients, SAV,
   fournisseurs, analytics.
3. **Caisse** — vente au comptoir à la douchette, depuis septembre 2026. Le
   magasin notait ses ventes sur papier avant cela.

L'utilisateur est le gérant. Il écrit en français et en anglais mêlés.
**Répondez-lui en français.** Il n'est pas développeur : expliquez les
conséquences métier, pas les détails d'implémentation.

---

## 2 — Pile technique et contrainte majeure

| | |
|---|---|
| Next.js | **16.2** (App Router, Turbopack, RSC, `proxy.ts`) |
| React | 19.2 |
| Prisma | 7.8 + PostgreSQL |
| TypeScript | 5, `strict` |
| Tailwind | 4 |
| Validation | Zod 4 |

> ### Avertissement du dépôt, à prendre au sérieux
>
> `AGENTS.md` prévient : **cette version de Next.js n'est pas celle que vous
> connaissez.** Les API et conventions diffèrent de vos données
> d'entraînement. Lisez le guide correspondant dans
> `node_modules/next/dist/docs/` avant d'écrire du code, et tenez compte des
> avis de dépréciation.

### Base de données locale

Ce n'est ni un service Windows ni Docker : c'est un cluster PostgreSQL 18
**local au projet**, dans `tmp/pgdata`, sur le **port 55432**.

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" start -D "C:\Users\hp\Documents\nahda smart\tmp\pgdata" -o "-p 55432" -l "C:\Users\hp\Documents\nahda smart\tmp\pgdata\startup.log" -w
```

Il s'arrête à chaque redémarrage de la machine. Le service Windows sur 5432
est une **autre** instance : n'y touchez pas.

---

## 3 — État du catalogue

Chiffres du poste de développement au 8 septembre 2026. Le serveur peut
diverger : comparez avec `node scripts/diagnostic-catalogue.mjs` lancé des
deux côtés.

| | |
|---|---|
| Produits actifs | 378 |
| **Publiés (visibles en boutique)** | **197** |
| Brouillons (stock réel, prix à saisir) | 181 |
| Fiches techniques rédigées | 367 |
| **Vraies photos** | **22 sur 197** — le reste montre une illustration générique |
| **Codes-barres** | **14 sur 378** |
| Marques | 71 |
| Catégories actives | 20, dont 5 vides et donc masquées |

---

## 4 — Décisions d'architecture à respecter

### Le stock, c'est le comptage physique

Règle du magasin, réaffirmée trois fois : **seule la quantité comptée à
l'inventaire compte.** Une référence non comptée est à zéro, donc absente de
la boutique. Ne rétablissez jamais le stock théorique de Sage.

### Une seule voie d'écriture par domaine

- Les commandes et le stock passent par `createAdminManualOrder`
  (`lib/services/admin-clients.ts`). La caisse s'en sert aussi. Le décrément
  y est **conditionnel et atomique** : deux ventes simultanées ne peuvent pas
  passer sous zéro. N'écrivez jamais dans `Stock` directement.
- Le classement (catégorie et marque) passe par `scripts/lib/familles.mjs` et
  `scripts/lib/marques.mjs`. L'import d'inventaire et le reclassement les
  partagent : deux copies divergeraient au premier ajustement.

### Ne rien inventer sur une fiche produit

Les descriptions et fiches techniques sont générées, jamais devinées. Chaque
ligne vient soit de la désignation d'inventaire, soit d'un savoir sur le
**type** d'article (une CR2032 fait 3 V, une SO-DIMM DDR3 a 204 broches) —
vérifiable et constant. Quand une information manque, la fiche le dit :
« faites confirmer en magasin ». C'est préférable à une affirmation fausse.

### Les prix sont saisis TTC

Le magasin les affiche toutes taxes comprises. Les documents commerciaux
remontent du TTC vers le HT, jamais l'inverse. Vérifié :
TTC 35 220 → HT 29 350,00 + TVA 5 870,00.

---

## 5 — Les scripts

Tous acceptent `--apply` ; sans lui, ils ne font qu'un rapport. Tous sont
idempotents.

### Boucle mensuelle après inventaire

```bash
node scripts/generer-classement.mjs tmp/inventaire.csv   # sur le poste, puis commiter
node scripts/maj-stock.mjs tmp/inventaire.csv --apply
node scripts/purger-hors-stock.mjs --apply               # exige une sauvegarde < 24 h
node scripts/reclasser-catalogue.mjs --apply
node scripts/enrich-product-descriptions.mjs --tout --apply
node scripts/completer-fiches-recherchees.mjs
node scripts/fiches-generiques.mjs --apply
node scripts/nettoyer-marques.mjs --apply
```

### Inventaire des scripts métier

| Script | Rôle |
|---|---|
| `import-inventory.mjs` | Crée les produits depuis le CSV. **Voir le piège n° 2.** |
| `maj-stock.mjs` | Met à jour les quantités. Ne crée rien. |
| `import-prices.mjs` | Applique les prix, publie si `publier=1`. Ne rétrograde jamais un statut. |
| `import-facture-fournisseur.mjs` | Importe une facture fournisseur avec codes-barres et prix d'achat. |
| `purger-hors-stock.mjs` | Supprime le stock zéro. Archive ce qui a un historique. |
| `reclasser-catalogue.mjs` | Corrige catégorie **et** marque. Le CSV est facultatif. |
| `enrich-product-descriptions.mjs` | Rédige les descriptions. `--tout` réécrit tout. |
| `completer-fiches-recherchees.mjs` | Fiches techniques saisies à la main (table `FICHES`). |
| `fiches-generiques.mjs` | Fiches déduites de la désignation. |
| `nettoyer-marques.mjs` | Supprime les marques vides, désactive celles qui n'ont que des archives. |
| `corriger-etat-materiel.mjs` | État neuf / reconditionné / occasion des machines. |
| `diagnostic-catalogue.mjs` | **À lancer des deux côtés et comparer.** |
| `import-product-images.mjs` | Photos depuis Icecat, sites constructeurs, dossier local. |
| `backup-postgres.mjs` | `npm run backup:db`. À faire avant toute écriture. |

---

## 6 — Les pièges, chacun payé par un incident

### 1. `prisma migrate deploy` ne régénère pas les types

`migrate dev` le fait, `migrate deploy` non. Le déploiement a échoué deux
fois de suite sur des propriétés « inexistantes » alors que les colonnes
venaient d'être créées. **Corrigé** : `npm run build` enchaîne désormais
`prisma generate && next build`. Ne retirez pas ce `prisma generate`.

### 2. `import-inventory` sans `--comptes-seulement` ressuscite tout

Lancé pour récupérer 34 références perdues, il en a recréé **888**, dont les
752 comptées à zéro qu'une purge avait retirées. L'import des prix en a remis
697 en ligne : plus de trois cents articles en vente que le magasin n'avait
pas.

**Pour tout rattrapage, `--comptes-seulement` est obligatoire.** L'import
complet n'a de sens qu'une fois, au premier peuplement.

### 3. Une liste d'enum écrite en dur finit par mentir

`productConditionSchema` listait `["NEW","USED","REFURBISHED"]`. À l'ajout de
`LIKE_NEW`, le formulaire l'affichait et la validation le refusait. Faites
suivre l'enum Prisma : `z.enum(ProductCondition)`.

### 4. Un motif de reconnaissance trop strict passe à côté

L'inventaire écrit ce qu'il veut : `POINT D ACCES` sans apostrophe,
`BOIITIER` avec deux i, `SPEAKEAR`, `HAVIC` pour Havit, `ZKT` pour ZKTeco.
Seize descriptions retombaient sur le nom de la catégorie, et un boîtier PC
nommé « SG **Glass** » s'annonçait comme une protection d'écran en verre
trempé. **Après chaque ajout de règle, relancez l'audit et relisez la sortie.**

### 5. Une ressemblance ne vaut pas une identité

`HAVIC` est bien une coquille pour Havit. `ACERO` n'est **pas** Acer : c'est
une autre marque, sur des écouteurs. Vérifiez avant de fusionner.

### 6. L'outil Bash de cet environnement mange les antislashs

Les heredocs Python contenant `\b`, `\s`, `\d` arrivent corrompus — un `\b`
devient un caractère de retour arrière, et la regex écrite dans le fichier
est silencieusement fausse. **Utilisez l'outil Edit/Write pour tout code
contenant des expressions régulières.**

### 7. Une cartouche compatible n'est pas de la marque du constructeur

« TONER PODIUM CF217A **HP** » est une cartouche Podium *pour* imprimante HP.
`detecterMarque` y lisait « HP ». La garde est dans `scripts/lib/marques.mjs`,
ne la retirez pas.

---

## 7 — Déploiement

Serveur : Hostinger KVM 2, Ubuntu 24.04, `/var/www/nahda/app`, utilisateur
`nahda`, service systemd `nahda`, nginx + certbot, PostgreSQL local.

La procédure complète est dans **`docs/mise-en-ligne-kvm2.md`**. Mise à jour
courante :

```bash
cd /var/www/nahda/app && sudo -u nahda npm run backup:db && sudo -u nahda git pull && sudo -u nahda npx prisma migrate deploy && sudo -u nahda npm run build && systemctl restart nahda
```

Trois règles :

- **Sauvegarde avant toute écriture.** `purger-hors-stock` l'exige, les autres
  non : faites-la quand même.
- Le CSV d'inventaire et le fichier de prix **ne vivent pas sur le serveur** —
  ils contiennent les prix d'achat. Les scripts de classement et de fiches
  n'en ont plus besoin (`scripts/lib/classement.mjs` est versionné). Quand un
  import les réclame, envoyez-les par `scp`, puis effacez-les.
- Ne lancez **jamais** `npm run prisma:seed` : il remplacerait le catalogue par
  des produits de démonstration.

---

## 8 — Ce qui reste à faire, par ordre de retour

### 1. Brancher `nahdasmart.com` et `nahdasmart.ma`

Les quatre noms pointent déjà sur le VPS. nginx ne connaît que
`nahdasmart.duckdns.org` et sert son certificat à tous les autres : le
navigateur refuse. Il manque le `server_name` puis certbot.

Ensuite seulement, retirer `SEO_NOINDEX="1"` du `.env` et reconstruire —
sinon Google indexerait l'ancienne adresse. `NEXT_PUBLIC_SITE_URL` doit aussi
passer au nouveau domaine : elle est figée à la compilation.

Procédure détaillée dans le runbook, section « Ajouter un domaine à un
serveur déjà en ligne ».

### 2. Les photos produit — le vrai frein commercial

**22 fiches sur 197 ont une vraie photo.** Les autres montrent une
illustration générique : tous les routeurs se ressemblent. Aucune
fonctionnalité ne compense ça sur une vente à 3 000 DH.

Le gérant photographie lui-même. `scripts/import-product-images.mjs --dossier`
importe un dossier local.

### 3. Les 181 brouillons

Stock réel, pas de prix, donc invisibles. Chaque prix saisi est un produit
vendable. Commencer par les 14 articles Setup Game et les 3 moniteurs MSI :
ils ont déjà leur code-barres.

### 4. Les codes-barres

197 produits vendables, 14 codes. L'écran est prêt :
`/admin/produits/codes-barres`. Une à deux secondes par article.

### 5. Identifiants légaux manquants

`site_settings` porte les champs, l'ICE est renseigné
(`003981799000019`). Manquent **RC, IF, patente, CNSS** — le gérant ne les a
pas encore. Les documents omettent la ligne vide, rien ne casse. Ils se
saisissent dans Admin → Paramètres.

### 6. Aucun avis client

La table `product_reviews` est vide. Trois avis valent mieux qu'une page
« À propos » sur une boutique marocaine.

---

## 9 — Contraintes permanentes du gérant

Elles ont toutes été énoncées explicitement. Respectez-les.

- **Ne rien acheter, ne souscrire à aucun abonnement.** Icecat gratuit oui,
  Icecat Full payant non.
- **Aucune extension de navigateur.**
- `.env`, le CSV d'inventaire et le fichier de prix **restent hors du dépôt**.
- **Ne pas copier les photographies d'autres boutiques.** Les
  caractéristiques factuelles lues sur une fiche revendeur sont acceptables —
  c'est la distinction posée par le gérant.
- Il se connecte lui-même à l'admin : **ne demandez pas ses identifiants et
  n'en saisissez aucun.** Ce qui ne peut être vérifié sans connexion doit lui
  être décrit pour qu'il le teste.

---

## 10 — Trois questions ouvertes

Le gérant n'y a pas encore répondu. Ne tranchez pas à sa place.

1. **RAM `R8D3-10600RP` et `R8D3-14900RP`** — le suffixe `R` désigne
   habituellement de la mémoire *registered ECC*, qui ne démarre pas sur une
   carte mère de bureau. La désignation dit pourtant « PC Bureau ». Les fiches
   demandent confirmation en magasin.
2. **Caméra `DS-2CD2617B-6/PA`** — aucune caméra réseau Hikvision ne porte
   cette référence. La seule en `2617B-6/PA` est la **DS-2TD2617B-6/PA**,
   bi-spectre thermique avec mesure de température, d'un tout autre prix.
3. **`TJN-001` et `TKN-001`, « Tronchoir Jianzhong » et « Tronchoir
   Katenai »** — désignation trop abrégée pour être décrite. Rangés en
   quincaillerie, fiche minimale.
