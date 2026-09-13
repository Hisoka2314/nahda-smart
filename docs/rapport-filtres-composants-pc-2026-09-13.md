# Rapport du lot « Composants PC » du 13 septembre 2026

Ce lot fait deux choses : il crée les filtres de la catégorie **Composants
PC**, qui n'en avait aucun, et il y verse le premier jeu de valeurs sourcées.
Il corrige aussi deux défauts qui rendaient invisible une partie du travail
déjà fait.

---

## 1 — Les filtres de la catégorie Composants PC

La catégorie comptait 38 produits et **zéro filtre** : le visiteur voyait
défiler pêle-mêle des barrettes de RAM, des boîtiers, des processeurs et des
cartes graphiques sans pouvoir réduire la liste.

Deux groupes ont été créés, **28 filtres** et **125 options**, par
`node scripts/configurer-filtres.mjs composants-pc --apply`.

### Filtres principaux

| Filtre | Slug | Type |
|---|---|---|
| Type de composant | `componentType` | cases à cocher |
| Processeur | `processor` | cases à cocher |
| Capacité mémoire | `memoryCapacity` | cases à cocher |
| Type de mémoire | `memoryType` | cases à cocher |
| Format de barrette | `memoryFormat` | cases à cocher |
| Puce graphique | `gpuChipset` | cases à cocher |

`Type de composant` est le filtre décisif : c'est lui qui sépare les sept
familles d'articles que la catégorie mélange. `Format de barrette` distingue
DIMM (PC bureau) et SO-DIMM (PC portable) : c'est la première erreur d'achat
sur ce rayon.

### Filtres avancés

Fréquence mémoire, type de module (UDIMM / RDIMM ECC), mémoire vidéo et son
type, sorties vidéo, socket, nombre de cœurs, conditionnement (Box / Tray),
graphiques intégrés, TDP, chipset, format de carte mère, slots mémoire, format
de boîtier, ventilateurs inclus, éclairage RGB, panneau latéral, puissance et
certification de l'alimentation, modularité, type de refroidissement, sockets
compatibles.

> Un filtre dont aucun produit ne porte de valeur est **masqué en boutique**.
> Déclarer la structure avant d'avoir les faits ne montre donc jamais un filtre
> vide au client ; c'est ce qui permet de faire la structure d'abord et la
> recherche ensuite.

La définition vit dans `scripts/lib/filtres-categories.mjs`. Le script
`configurer-filtres.mjs` est idempotent, ne supprime jamais rien et signale les
filtres présents en base mais absents de la définition au lieu de les effacer :
ils portent peut-être déjà des valeurs vérifiées.

---

## 2 — Les valeurs vérifiées ajoutées

**10 références, 44 valeurs**, chacune avec deux sources HTTPS, un extrait de
preuve, la date du contrôle et le périmètre exact.

| Référence | Produit | Valeurs |
|---|---|---:|
| `VGA1030` | ASUS GeForce GT 1030 2 Go GDDR5 | 4 |
| `VGMSI1030` | MSI GT 1030 AERO ITX 2G OC | 5 |
| `VGB1030` | BIOSTAR GT 1030 2 Go GDDR5 | 4 |
| `VGT1030` | GeForce GT 1030, fabricant non précisé | 2 |
| `CG730` | GeForce GT 730, variante non précisée | 2 |
| `CRN-T3-3100` | AMD Ryzen 3 3100 | 5 |
| `SG-7969` | AMD Ryzen 5 5500 | 6 |
| `SG-10773` | AMD Ryzen 7 5700 | 6 |
| `SG-5945` | MSI A520M-A PRO | 5 |
| `SG-8329` | MSI B550M PRO-VDH | 5 |

Registre après ce lot : **35 références, 247 valeurs**.

### Ce qui a été délibérément laissé vide

- **Le TDP des cartes GT 1030.** NVIDIA publie 20 W pour la variante GDDR5 et
  30 W pour la variante DDR4 ; les revendeurs annoncent 30 W sur des cartes
  GDDR5. Les sources se contredisent, la valeur reste vide. Seule la MSI AERO
  ITX porte 30 W, parce que ses deux sources l'écrivent pour ce modèle précis.
- **Le conditionnement Box / Tray.** Deux des trois processeurs sont notés
  « Tray » sur la facture, c'est-à-dire livrés sans ventirad. Aucune fiche
  constructeur ne peut attester du conditionnement d'un article précis en
  magasin : cette information doit être confirmée par le gérant, pas déduite.
- **Les sorties vidéo.** Le registre ne sait porter qu'une valeur par filtre,
  alors qu'une carte a HDMI *et* DVI. Le filtre existe, il reste vide tant que
  le registre n'accepte pas les listes.
- **Les mémoires vives, les boîtiers, les alimentations et le refroidissement.**
  Les désignations d'inventaire ne nomment ni le fabricant ni la référence
  exacte ; il n'y a rien de sourçable pour l'instant.

### Détail des références ambiguës

`VGT1030` et `CG730` ne portent que le type de composant et la puce : la
désignation ne dit ni le fabricant ni la variante mémoire, et le GT 730 existe
en DDR3 comme en GDDR5, en 64 comme en 128 bits.

---

## 3 — Deux correctifs qui débloquent le travail déjà fait

### Les filtres Oui/Non ne fonctionnaient pas

Les 49 filtres de type booléen — Tactile, PoE, Wi-Fi, Scanner, QoS, VPN,
WDR… — stockent leur valeur dans `valueBoolean`, mais leurs options de filtre
valent `Oui` et `Non`. La boutique comparait `"true"` à `"Oui"` : aucune
correspondance, donc **le filtre disparaissait**.

**22 des 203 valeurs déjà vérifiées étaient dans ce cas**, dont les quatre PC
portables tactiles et le PoE des caméras. La lecture est désormais alignée sur
l'affichage de la fiche produit, qui écrivait déjà « Oui » / « Non ».

Corrigé dans `lib/adapters/product-adapter.ts`, couvert par
`tests/product-attributes-catalogue.test.ts`.

### Le back-office refusait ses propres filtres

Le slug d'un filtre n'est pas une adresse : c'est la clé technique sous
laquelle la valeur est lue sur le produit, et elle est en camelCase depuis
l'origine (`processorGeneration`, `storageType`). La validation du back-office
n'acceptait que le kebab-case. Conséquence : impossible d'enregistrer la
moindre modification sur un filtre existant, et un filtre créé à la main avec
un slug en kebab n'aurait correspondu à aucune valeur produit, donc ne serait
jamais apparu en boutique.

`attributeSlugSchema` accepte désormais les deux formes. Les slugs de
**groupes** restent en kebab-case, eux sont bien des identifiants d'affichage.

---

## 4 — Vérification locale

```text
registre                       : 35 références, 247 valeurs
import --apply                 : written 44, nonVerified 0
seconde simulation             : proposed 0, identique 247, nonVerified 0
configurer-filtres (2e passage): 0 création, 0 ajustement
tests                          : 13 fichiers / 73 tests passés
typecheck                      : passé
eslint                         : passé (1 avertissement préexistant)
next build                     : passé, 243 pages statiques
```

Contrôle de la page rendue (`next start`) : la catégorie Composants PC sert
bien les groupes « Filtres principaux » et « Filtres avancés », et les produits
publiés portent `componentType`, `gpuChipset`, `gpuMemory` et `gpuMemoryType`.
Sur PC Portables, les fiches portent désormais `touch: "Oui"` au lieu de
`touch: true`.

Ce que la boutique montre aujourd'hui sur Composants PC, les six autres
références étant encore en brouillon faute de prix :

| Filtre | Valeur | Produits |
|---|---|---:|
| Type de composant | Carte graphique | 4 |
| Puce graphique | GeForce GT 1030 | 4 |
| Mémoire vidéo | 2 Go | 3 |
| Type de mémoire vidéo | GDDR5 | 3 |
| Enveloppe thermique (TDP) | 30 W | 1 |

---

## 5 — Publication

Sur le poste Windows, sans `git add .` afin de ne pas inclure
`.claude/settings.local.json` :

```powershell
cd "C:\Users\hp\Documents\nahda smart"
git add AGENTS.md data/verified-product-specs.json docs/ lib/ scripts/ tests/
git commit -m "feat(catalogue): filtres et attributs verifies des composants PC"
git push origin main
```

Sur le VPS :

```bash
cd /var/www/nahda/app && sudo -u nahda npm run backup:db && sudo -u nahda git pull --ff-only && sudo -u nahda node scripts/configurer-filtres.mjs composants-pc --apply && sudo -u nahda node scripts/import-verified-specs.mjs --apply && sudo -u nahda npm run build && sudo systemctl restart nahda
```

Puis contrôler :

```bash
cd /var/www/nahda/app && sudo -u nahda node scripts/import-verified-specs.mjs && sudo -u nahda node scripts/configurer-filtres.mjs composants-pc
```

La première commande doit retourner `proposed: 0`, `identique: 247`,
`nonVerified: 0` ; la seconde, zéro création et zéro ajustement.

> Le serveur portait encore 325 anciennes lignes déduites au dernier rapport
> communiqué. Elles se retirent avec `--purge-unverified`, à lancer d'abord en
> simulation pour lire ce qui partirait.

---

## 6 — Ce qui vient ensuite

1. Les quatre catégories encore sans aucun filtre : Câbles & Connectique (23
   produits), Énergie & Éclairage (12), Ventilation & Climatisation (9),
   Écrans & Moniteurs (3). Même méthode : définition dans
   `scripts/lib/filtres-categories.mjs`, puis recherche sourcée.
2. Les barrettes de mémoire de Composants PC — 20 références, le plus gros
   bloc du rayon. La désignation donne capacité, génération et format, mais
   rien ne permet de sourcer une référence précise : à traiter avec le gérant.
3. Le registre gagnerait à accepter une liste de valeurs pour un même filtre
   (sorties vidéo, sockets compatibles, connectique). L'adaptateur sait déjà
   les lire ; seule la validation des preuves les refuse.

### Question pour le gérant

Les processeurs `SG-7969` et `SG-10773` sont notés « Tray » : livrés nus, sans
ventirad. Est-ce bien le cas en magasin ? Si oui, il faut le dire sur la fiche :
un acheteur qui repart sans refroidisseur ne peut pas monter sa machine.
