# Déploiement VPS — Nahda Smart

Procédure complète de mise en ligne. Complète `production-readiness.md`, qui fixe
la checklist fonctionnelle ; ce document décrit les opérations serveur.

Cible : **VPS Linux** (Ubuntu 22.04+ ou Debian 12), Node.js, PostgreSQL, nginx en
frontal. Le projet n'est pas conçu pour un hébergement à système de fichiers
éphémère (Vercel, Netlify) — voir « Persistance des uploads ».

---

## 0. À régler AVANT de déployer

Ces points bloquent ou dégradent une mise en production. À traiter dans l'ordre.

### 0.1 Commiter le travail en cours

Le dépôt contient des modifications non commitées et **deux migrations Prisma non
appliquées ailleurs** (`site_settings_delivery_fee`, `customer_phone_optional`).
Un déploiement depuis un dépôt propre est indispensable.

```bash
git status
git add -A
git commit -m "..."
git push
```

### 0.2 Supprimer les comptes admin dormants

La base de développement contient `qa-audit@nahdasmart.local` et
`qa-delivery@nahdasmart.local`, inactifs mais à privilèges. Ils ne doivent jamais
atteindre la production. Si la base de prod est créée à partir d'un dump de dev :

```sql
DELETE FROM "AdminUser" WHERE email LIKE '%@nahdasmart.local';
```

### 0.3 Décider du mot de passe admin de production

Ne réutilisez pas celui de développement.

```bash
npm run admin:hash          # génère le hash scrypt à mettre dans .env
```

---

## 1. Préparer le serveur

### 1.1 Paquets de base

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx postgresql postgresql-contrib ufw
```

### 1.2 Node.js

Le projet tourne sur Node 24. Épinglez la version majeure :

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node --version
```

### 1.3 Pare-feu

**PostgreSQL ne doit jamais être joignable depuis Internet.**

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

> ⚠️ Le `docker-compose.yml` du dépôt publie le port `5432` sur toutes les
> interfaces avec le mot de passe `nahda_password`. Il est prévu pour le
> **développement local uniquement**. Ne l'utilisez pas tel quel sur le VPS : soit
> vous installez PostgreSQL nativement (recommandé), soit vous modifiez le mapping
> en `127.0.0.1:5432:5432` et changez le mot de passe.

### 1.4 Base de données

```bash
sudo -u postgres psql
```

```sql
CREATE USER nahda WITH PASSWORD 'UN_MOT_DE_PASSE_FORT';
CREATE DATABASE nahda_smart OWNER nahda;
\q
```

### 1.5 Utilisateur applicatif

```bash
sudo adduser --system --group --home /var/www/nahda nahda
sudo mkdir -p /var/www/nahda/app /var/www/nahda/uploads /var/www/nahda/backups
sudo chown -R nahda:nahda /var/www/nahda
```

---

## 2. Persistance des uploads — point critique

Les images produits et logos téléversés depuis le back-office sont écrits sur le
disque, dans `public/uploads/`. Le dépôt en versionne quelques-unes, mais **tout
ce qui est téléversé en production n'existe que sur le serveur**.

Conséquence : un déploiement qui recrée le répertoire applicatif (clone neuf,
`git clean`, blue/green) **détruit toutes les images ajoutées depuis la mise en
ligne**.

Protection : déporter le stockage hors du répertoire de code et le lier.

```bash
# Une seule fois, après le premier clone
cd /var/www/nahda/app
cp -rn public/uploads/* /var/www/nahda/uploads/ 2>/dev/null || true
rm -rf public/uploads
ln -s /var/www/nahda/uploads public/uploads
```

Le lien symbolique est à recréer après chaque clone neuf. Ajoutez
`/var/www/nahda/uploads` à votre sauvegarde : ces fichiers ne sont dans aucun dump
SQL.

---

## 3. Variables d'environnement

```bash
sudo -u nahda nano /var/www/nahda/app/.env
```

```ini
DATABASE_URL="postgresql://nahda:MOT_DE_PASSE@localhost:5432/nahda_smart?schema=public"

# ⚠️ CRITIQUE — voir encadré ci-dessous
NEXT_PUBLIC_SITE_URL="https://nahdasmart.ma"

ADMIN_EMAIL="admin@nahdasmart.ma"
ADMIN_NAME="Super Admin Nahda Smart"
ADMIN_PASSWORD_HASH="scrypt:..."     # issu de npm run admin:hash

NEXT_PUBLIC_WHATSAPP_NUMBER="212XXXXXXXXX"

BACKUP_DIR="/var/www/nahda/backups"
EXPORT_DIR="/var/www/nahda/exports"

# Secret du cron de maintenance (>= 16 caractères). Vide = endpoint désactivé.
MAINTENANCE_SECRET="..."

# Notifications internes (vide = désactivé, les événements restent journalisés)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@nahdasmart.ma"
NOTIFY_EMAIL_TO="contact@nahdasmart.ma"

# Analytics (vide = désactivé)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN="nahdasmart.ma"
```

```bash
sudo chmod 600 /var/www/nahda/app/.env
```

> ### ⚠️ `NEXT_PUBLIC_SITE_URL` conditionne l'indexation
>
> Cette variable alimente `robots.txt`, `sitemap.xml`, les balises canoniques et
> Open Graph. Le code refuse d'être indexé tant que l'URL ressemble à un
> environnement local : **si elle est absente ou incorrecte, `robots.txt` renverra
> `Disallow: /` et le site sera invisible sur Google.**
>
> Renseignez le domaine public réel, en `https://`, sans barre oblique finale.
> Elle est intégrée au build : **toute modification impose un `npm run build`.**

---

## 4. Premier déploiement

```bash
sudo -u nahda -s
cd /var/www/nahda/app
git clone <URL_DU_DEPOT> .

npm ci
npx prisma generate
npx prisma migrate deploy      # applique les migrations, ne réinitialise rien
npm run build
```

Créer le compte administrateur :

```bash
npm run admin:upsert
```

> Ne lancez **jamais** `npm run prisma:seed` en production : il écrase le
> catalogue avec les données de démonstration.

Test manuel avant d'exposer :

```bash
npm run start          # écoute sur le port 3000
curl -I http://localhost:3000
```

---

## 5. Service systemd

```bash
sudo nano /etc/systemd/system/nahda.service
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
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now nahda
sudo systemctl status nahda
journalctl -u nahda -f          # les erreurs sortent en JSON, greppables
```

> **Une seule instance.** La limitation de débit (formulaires publics et
> tentatives de connexion admin) est tenue en mémoire du processus. En mode
> cluster à N workers, chaque worker a son propre compteur et les limites sont
> divisées d'autant. Le verrou anti-bruteforce du login dispose d'un second
> filet en base (`AdminLog`), mais les quotas des formulaires publics, eux,
> deviennent inopérants. Restez en instance unique tant que la limitation n'est
> pas déportée (Redis ou table dédiée).

---

## 6. nginx et HTTPS

```bash
sudo nano /etc/nginx/sites-available/nahda
```

```nginx
server {
    listen 80;
    server_name nahdasmart.ma www.nahdasmart.ma;

    # Téléversements admin : jusqu'à 5 Mo par image
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

`X-Forwarded-For` est indispensable : la limitation de débit s'appuie dessus pour
identifier l'appelant. Sans cet en-tête, tous les visiteurs partagent le même
compteur.

```bash
sudo ln -s /etc/nginx/sites-available/nahda /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d nahdasmart.ma -d www.nahdasmart.ma
```

Certbot installe le renouvellement automatique. HSTS est déjà envoyé par
l'application en production — ne l'ajoutez pas une seconde fois dans nginx.

---

## 7. Tâches planifiées

```bash
sudo -u nahda crontab -e
```

```cron
# Purge des commandes non confirmées depuis plus de 48 h (libère le stock réservé)
0 */6 * * * curl -s -X POST -H "Authorization: Bearer LE_MAINTENANCE_SECRET" http://localhost:3000/api/maintenance/stale-orders > /dev/null

# Sauvegarde quotidienne de la base à 2 h
0 2 * * * cd /var/www/nahda/app && /usr/bin/npm run backup:db >> /var/www/nahda/backups/cron.log 2>&1

# Sauvegarde hebdomadaire des images téléversées
0 3 * * 0 tar czf /var/www/nahda/backups/uploads-$(date +\%F).tar.gz -C /var/www/nahda uploads
```

Purgez les vieilles sauvegardes et **copiez-les hors du VPS** : une sauvegarde
qui vit sur la machine qu'elle protège ne protège de rien.

---

## 8. Vérification après mise en ligne

```bash
# Indexation — doit contenir "Allow: /" et non "Disallow: /"
curl -s https://nahdasmart.ma/robots.txt

# Sitemap peuplé
curl -s https://nahdasmart.ma/sitemap.xml | grep -c "<url>"

# En-têtes de sécurité + HSTS
curl -sI https://nahdasmart.ma | grep -iE "content-security|strict-transport|x-frame"

# L'admin redirige bien vers le login
curl -s -o /dev/null -w "%{http_code}\n" https://nahdasmart.ma/admin
```

À contrôler à la main :

- Connexion admin, puis déconnexion.
- Un rôle non `SUPER_ADMIN` : les sections interdites redirigent vers
  `/admin/unauthorized`.
- Une commande de test complète depuis le site, puis son suivi via le numéro
  de téléphone.
- Téléversement d'une image produit, puis affichage sur la fiche publique.
- Partage d'un lien produit sur WhatsApp : l'aperçu doit s'afficher.
- Aucun moyen de paiement en ligne présenté comme actif.

---

## 9. Redéploiements

```bash
sudo -u nahda -s
cd /var/www/nahda/app

npm run backup:db              # toujours avant une migration

git pull
npm ci
npx prisma migrate deploy
npm run build

exit
sudo systemctl restart nahda
```

Déployez **en place** (`git pull`), pas par clone neuf, sinon relisez la section 2
sur les uploads.

En cas de problème :

```bash
git reset --hard <commit_precedent>
npm ci && npm run build
sudo systemctl restart nahda
```

Les migrations Prisma ne se défont pas automatiquement : une migration
destructrice se rattrape par restauration du dump (`npm run restore:db`).

---

## 10. Points connus, à traiter plus tard

Aucun n'empêche la mise en ligne, mais chacun mérite une décision consciente.

| Sujet | Situation | Effet |
|---|---|---|
| Limitation de débit | En mémoire du processus | Impose l'instance unique ; remise à zéro à chaque redémarrage |
| CSP | `script-src` en `'unsafe-inline'` | Protection XSS affaiblie ; les nonces sont possibles en Next 16 |
| Intégration continue | Absente | Rien ne garantit que `build` et `test` passent avant un déploiement |
| Catalogue | Filtres appliqués côté client sur 120 produits | Au-delà, les filtres portent sur un sous-ensemble |
| Tests | Aucun sur le parcours commande et le stock | Le chemin de l'argent n'est pas couvert automatiquement |
| Paiement en ligne | Aucun | Décision produit : encaissement à la livraison ou en magasin |
