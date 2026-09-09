# Import des attributs vérifiés

`data/verified-product-specs.json` est le registre des correspondances
contrôlées. Chaque valeur a un `status` égal à `verified`, une date, un
périmètre de configuration et au moins deux entrées `evidence`. Une preuve
contient l'URL HTTPS consultée et l'extrait qui justifie la valeur.

Le script `scripts/import-verified-specs.mjs` est conçu pour être relancé sans
effet indésirable : sans option il ouvre une transaction en lecture seule et
produit un rapport dans `tmp/`; avec `--apply`, il crée une sauvegarde
PostgreSQL, verrouille les tables concernées, remplace uniquement les attributs
du registre vérifié et attache la provenance dans `valueJson.verifiedSpec`.
Les valeurs sans option existante peuvent créer une option de filtre seulement
pendant un import vérifié. Les valeurs ambiguës, les types incompatibles et les
filtres absents restent dans le rapport sans être écrits.

Le registre ne donne pas de preuve aux anciennes lignes créées par les scripts
historiques. Pour nettoyer ces lignes (par exemple les anciennes valeurs GPU ou
stockage déduites du nom), utiliser `--purge-unverified` avec `--apply`. Toutes
les lignes supprimées sont d'abord copiées dans le rapport JSON et la sauvegarde
PostgreSQL est obligatoire. Sans `--purge-unverified`, ces lignes sont conservées
pour permettre une migration progressive.

## Déploiement

Après avoir poussé les fichiers versionnés :

```bash
cd /var/www/nahda/app
sudo -u nahda npm run backup:db
sudo -u nahda git pull
sudo -u nahda node scripts/import-verified-specs.mjs
```

Lire le chemin `report` et vérifier les statuts ainsi que `purgeProposed`. Pour
remplacer les anciennes valeurs non vérifiées par le registre sourcé :

```bash
sudo -u nahda node scripts/import-verified-specs.mjs --purge-unverified
sudo -u nahda node scripts/import-verified-specs.mjs --apply --purge-unverified
sudo -u nahda npm run build
sudo systemctl restart nahda
```

Ne pas relancer `extraire-attributs-produits.mjs --apply` : cet ancien
extracteur ne possède pas les contrôles de preuve et peut réintroduire des
confusions entre processeur, carte graphique et capacité de stockage.
