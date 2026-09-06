# Mise en ligne sur Hostinger KVM 2

Procédure pas à pas. Chaque étape se termine par une vérification : ne passez à
la suivante que si elle passe.

Remplacez partout :

- `VOTRE_IP` par l'adresse IP du VPS
- `nahdasmart.ma` par votre domaine réel
- `MOT_DE_PASSE_BASE` par un mot de passe fort que vous inventez

---

## Étape 0 — Commander le VPS

Sur hostinger.com, VPS → KVM 2. Au moment de la configuration :

| Réglage | Valeur |
|---|---|
| Système | **Ubuntu 24.04 LTS** |
| Panneau de contrôle | **Aucun** (ni cPanel, ni CyberPanel, ni Plesk) |
| Localisation | **Europe** (France ou Pays-Bas) |
| Durée | 12 ou 24 mois — le tarif mensuel est bien plus cher |

Notez l'**adresse IP** et le **mot de passe root** fournis à la fin.

Un panneau de contrôle installerait un serveur PHP qui entrerait en conflit avec
nginx : c'est pour cela qu'on n'en prend aucun.

---

## Étape 1 — Se connecter au serveur

Depuis votre PC, ouvrez PowerShell :

```bash
ssh root@VOTRE_IP
```

Tapez `yes` à la question d'empreinte, puis le mot de passe root.

**Vérification** : l'invite affiche `root@srv...:~#`

---

## Étape 2 — Mettre à jour et fermer les accès

```bash
apt update && apt upgrade -y && apt install -y curl git nginx postgresql ufw
```

Pare-feu : on n'ouvre que le SSH et le web. **PostgreSQL ne doit jamais être
joignable depuis Internet.**

```bash
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable && ufw status
```

**Vérification** : la liste contient OpenSSH et Nginx Full, rien d'autre.

---

## Étape 3 — Installer Node.js 24

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && apt install -y nodejs && node --version
```

**Vérification** : affiche `v24.x.x`

---

## Étape 4 — Créer la base de données

```bash
sudo -u postgres psql
```

Dans l'invite `postgres=#`, collez ces trois lignes :

```sql
CREATE USER nahda WITH PASSWORD 'MOT_DE_PASSE_BASE';
CREATE DATABASE nahda_smart OWNER nahda;
\q
```

**Vérification** : les réponses sont `CREATE ROLE` puis `CREATE DATABASE`.

---

## Étape 5 — Préparer l'emplacement et récupérer le code

```bash
adduser --system --group --home /var/www/nahda nahda && mkdir -p /var/www/nahda/app /var/www/nahda/uploads /var/www/nahda/backups && chown -R nahda:nahda /var/www/nahda
```

```bash
sudo -u nahda git clone https://github.com/Hisoka2314/nahda-smart.git /var/www/nahda/app
```

Les images téléversées depuis le back-office doivent survivre aux mises à jour :
on les recopie hors du dossier de code.

```bash
cd /var/www/nahda/app && sudo -H -u nahda cp -rn public/uploads/* /var/www/nahda/uploads/ 2>/dev/null; ls /var/www/nahda/uploads
```

**Vérification** : affiche `brands` et `products`

> **N'utilisez pas de lien symbolique ici.** Turbopack refuse les liens qui
> sortent de la racine du projet et le build échoue sur
> `Symlink ... points out of the filesystem root`. C'est la variable
> `UPLOADS_DIR` de l'étape 6 qui indique à l'application où lire et écrire les
> images.

---

## Étape 6 — Configurer les variables

```bash
sudo -u nahda nano /var/www/nahda/app/.env
```

Collez ceci en remplaçant les valeurs :

```ini
DATABASE_URL="postgresql://nahda:MOT_DE_PASSE_BASE@localhost:5432/nahda_smart?schema=public"
NEXT_PUBLIC_SITE_URL="https://nahdasmart.ma"
NEXT_PUBLIC_WHATSAPP_NUMBER="212XXXXXXXXX"
UPLOADS_DIR="/var/www/nahda/uploads"
BACKUP_DIR="/var/www/nahda/backups"
EXPORT_DIR="/var/www/nahda/exports"
MAINTENANCE_SECRET="inventez-une-longue-phrase-secrete-ici"
SMTP_HOST=""
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@nahdasmart.ma"
NOTIFY_EMAIL_TO=""
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=""
```

Enregistrez avec `Ctrl+O`, `Entrée`, puis `Ctrl+X`.

```bash
chmod 600 /var/www/nahda/app/.env && chown nahda:nahda /var/www/nahda/app/.env
```

> ### Attention à `NEXT_PUBLIC_SITE_URL`
>
> Cette ligne décide si Google voit votre site. Tant qu'elle ressemble à une
> adresse locale, le site refuse d'être indexé et `robots.txt` renvoie
> `Disallow: /`. Mettez votre vrai domaine, en `https://`, sans barre oblique
> finale. Elle est intégrée au build : si vous la changez plus tard, relancez
> `npm run build`.

---

## Étape 7 — Installer, migrer, construire

```bash
cd /var/www/nahda/app && sudo -u nahda npm install --no-audit --no-fund && sudo -u nahda npx prisma generate && sudo -u nahda npx prisma migrate deploy && sudo -u nahda npm run build
```

**Vérification** : le build se termine par `Compiled successfully` et génère les
pages sans erreur.

> Ne lancez **jamais** `npm run prisma:seed` : il remplacerait votre catalogue
> par les produits de démonstration.

---

## Étape 8 — Faire tourner le site en permanence

```bash
nano /etc/systemd/system/nahda.service
```

```ini
[Unit]
Description=Nahda Smart
After=network.target postgresql.service

[Service]
Type=simple
User=nahda
WorkingDirectory=/var/www/nahda/app
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload && systemctl enable --now nahda && systemctl status nahda
```

**Vérification** : `active (running)` en vert.

Pour consulter les journaux plus tard : `journalctl -u nahda -f`

> Gardez **une seule instance**. La limitation des formulaires publics est tenue
> en mémoire du processus : en mode multi-processus, les quotas seraient divisés
> d'autant.

---

## Étape 9 — Brancher le domaine

D'abord, chez votre registrar ou dans l'espace Hostinger, créez deux
enregistrements DNS de type **A** pointant vers `VOTRE_IP` :

- `nahdasmart.ma`
- `www.nahdasmart.ma`

Comptez de quelques minutes à quelques heures de propagation.

Puis sur le serveur :

```bash
nano /etc/nginx/sites-available/nahda
```

```nginx
server {
    listen 80;
    server_name nahdasmart.ma www.nahdasmart.ma;
    client_max_body_size 8M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/nahda /etc/nginx/sites-enabled/ && rm -f /etc/nginx/sites-enabled/default && nginx -t && systemctl reload nginx
```

**Vérification** : `nginx -t` répond `syntax is ok` et `test is successful`.

`X-Forwarded-For` est indispensable : sans lui, tous vos visiteurs partageraient
le même compteur de limitation de débit.

---

## Étape 10 — Activer le HTTPS

```bash
apt install -y certbot python3-certbot-nginx && certbot --nginx -d nahdasmart.ma -d www.nahdasmart.ma
```

Renseignez une adresse e-mail, acceptez les conditions, et choisissez la
redirection automatique vers HTTPS.

**Vérification** : `https://nahdasmart.ma` s'ouvre avec le cadenas.

Le renouvellement est automatique. N'ajoutez pas d'en-tête HSTS dans nginx :
l'application l'envoie déjà.

---

## Étape 11 — Créer votre compte administrateur

```bash
cd /var/www/nahda/app && sudo -u nahda npm run admin:hash
```

Copiez la ligne produite dans `.env` (`ADMIN_PASSWORD_HASH`), ajoutez aussi
`ADMIN_EMAIL` et `ADMIN_NAME`, puis :

```bash
sudo -u nahda npm run admin:upsert && systemctl restart nahda
```

**Vérification** : `https://nahdasmart.ma/admin` demande vos identifiants et la
connexion fonctionne.

---

## Étape 12 — Sauvegardes automatiques

```bash
crontab -u nahda -e
```

```cron
0 */6 * * * curl -s -X POST -H "Authorization: Bearer VOTRE_MAINTENANCE_SECRET" http://localhost:3000/api/maintenance/stale-orders > /dev/null
0 2 * * * cd /var/www/nahda/app && /usr/bin/npm run backup:db >> /var/www/nahda/backups/cron.log 2>&1
0 3 * * 0 tar czf /var/www/nahda/backups/uploads-$(date +\%F).tar.gz -C /var/www/nahda uploads
```

La première ligne libère le stock des commandes non confirmées depuis 48 h. Les
deux autres sauvegardent la base et les images.

**Important** : copiez régulièrement ces sauvegardes hors du VPS. Une sauvegarde
qui vit sur la machine qu'elle protège ne protège de rien.

---

## Étape 13 — Vérifications finales

```bash
curl -s https://nahdasmart.ma/robots.txt && curl -s https://nahdasmart.ma/sitemap.xml | grep -c "<url>" && curl -sI https://nahdasmart.ma | grep -i strict-transport && curl -s -o /dev/null -w "%{http_code}\n" https://nahdasmart.ma/admin
```

Attendu : `Allow: /` et **non** `Disallow: /`, un nombre d'URL supérieur à zéro,
l'en-tête HSTS présent, et `307` sur `/admin` sans session.

À vérifier à la main :

- connexion et déconnexion admin
- une commande de test de bout en bout, puis son suivi par téléphone
- téléversement d'une image produit, puis affichage sur la fiche publique
- partage d'un lien produit sur WhatsApp : l'aperçu doit apparaître
- un produit en rupture affiche le bandeau et le bouton « Sur commande »

---

## Mettre à jour le site plus tard

```bash
cd /var/www/nahda/app && sudo -u nahda npm run backup:db && sudo -u nahda git pull && sudo -u nahda npm install --no-audit --no-fund && sudo -u nahda npx prisma migrate deploy && sudo -u nahda npm run build && systemctl restart nahda
```

Toujours la sauvegarde avant, et toujours `git pull` en place — jamais un clone
neuf, sinon relisez l'étape 5 sur les images.

### Rejouer le classement et les fiches produit

Le code déployé ne suffit pas quand la mise à jour touche le rangement du
catalogue ou la rédaction des fiches : ces textes vivent en base, pas dans le
dépôt. Les quatre scripts se relancent sans risque, ils sont idempotents.

```bash
cd /var/www/nahda/app && sudo -u nahda node scripts/reclasser-catalogue.mjs --apply && sudo -u nahda node scripts/enrich-product-descriptions.mjs --tout --apply && sudo -u nahda node scripts/completer-fiches-recherchees.mjs && sudo -u nahda node scripts/fiches-generiques.mjs --apply && systemctl restart nahda
```

Aucun ne demande le tableur d'inventaire : `reclasser-catalogue` lit les
familles dans `scripts/lib/classement.mjs`, qui est versionné, et les trois
autres travaillent depuis la base. Le CSV, lui, ne quitte pas le poste du
magasin.

Après un nouvel inventaire, regénérer ce module **sur le poste du magasin**,
puis le commiter, sinon les références nouvelles resteront dans « Accessoires » :

```bash
node scripts/generer-classement.mjs tmp/inventaire.csv
```

### Vérifier que le serveur porte bien tout le catalogue

À lancer **sur les deux machines**, puis comparer les deux sorties :

```bash
cd /var/www/nahda/app && sudo -u nahda node scripts/diagnostic-catalogue.mjs
```

Les deux nombres qui comptent sont « en stock » et « publiés ». S'ils diffèrent,
des produits que le magasin a réellement en stock manquent en ligne — c'est
arrivé en septembre 2026, 34 références de vidéosurveillance dont huit publiées
avec un prix, effacées par une purge jouée avant la mise à jour du stock.

Le rattrapage demande le tableur d'inventaire sur le serveur :

```bash
scp "tmp/inventaire.csv" root@nahdasmart.com:/var/www/nahda/app/tmp/inventaire.csv
```

```bash
cd /var/www/nahda/app && sudo -u nahda node scripts/import-inventory.mjs tmp/inventaire.csv --comptes-seulement --apply && sudo -u nahda node scripts/maj-stock.mjs tmp/inventaire.csv --apply
```

Puis rejouer le classement et les fiches ci-dessus. L'import ne réécrit jamais
un produit existant : il ne fait que recréer les références manquantes, en
brouillon et à prix zéro, à ressaisir depuis le back-office.

> **`--comptes-seulement` n'est pas facultatif ici.** Sans lui, l'import
> recrée *toutes* les références du tableur, y compris les 752 comptées à
> zéro qu'une purge avait retirées. C'est arrivé en septembre 2026 : 888
> produits ressuscités, dont 697 remis en ligne par l'import des prix, soit
> plus de trois cents articles en vente que le magasin n'avait pas. Le
> rattrapage a été `purger-hors-stock.mjs --apply`.
>
> L'import complet, sans le drapeau, n'a de sens qu'une seule fois : au
> premier peuplement du catalogue.

En cas de problème, revenir au commit précédent :

```bash
cd /var/www/nahda/app && sudo -u nahda git reset --hard HEAD~1 && sudo -u nahda npm install --no-audit --no-fund && sudo -u nahda npm run build && systemctl restart nahda
```

---

## Notes techniques

### Pourquoi `npm install` et non `npm ci`

`npm ci` exige que `package-lock.json` corresponde exactement a ce que la
version de npm installee sait resoudre. Or les dependances optionnelles liees a
la plateforme (celles de `sharp`, pour le traitement des images) ne sont pas
resolues de la meme facon d'une version mineure de npm a l'autre : un
verrouillage genere sous Windows avec npm 11.6 est refuse par npm 11.17 sous
Linux, avec un message du type `Missing: @emnapi/runtime from lock file`.

`npm install` resout les dependances pour la plateforme cible et fonctionne
quelle que soit la version de npm. On perd la reproductibilite stricte, on
gagne un deploiement qui ne casse pas a chaque montee de version de npm.

### Vulnerabilite `deepmerge-ts` acceptee

`npm audit` signale une faille de severite haute dans `deepmerge-ts`,
dependance interne de Prisma (epuisement de pile sur des objets recursifs). Le
seul correctif propose par npm est une retrogradation de Prisma en version 6,
soit un changement de rupture majeur.

Elle n'est pas exploitable ici : la fusion concernee porte sur la configuration
Prisma, alimentee par des fichiers statiques du depot, jamais par une donnee
venant d'un visiteur. A lever des que Prisma publiera une version corrigee.
