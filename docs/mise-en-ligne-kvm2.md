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
on les sort du dossier de code et on crée un lien.

```bash
cd /var/www/nahda/app && sudo -u nahda cp -rn public/uploads/* /var/www/nahda/uploads/ 2>/dev/null; rm -rf public/uploads && sudo -u nahda ln -s /var/www/nahda/uploads public/uploads && ls -l public/uploads
```

**Vérification** : affiche `public/uploads -> /var/www/nahda/uploads`

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
cd /var/www/nahda/app && sudo -u nahda npm ci && sudo -u nahda npx prisma generate && sudo -u nahda npx prisma migrate deploy && sudo -u nahda npm run build
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
cd /var/www/nahda/app && sudo -u nahda npm run backup:db && sudo -u nahda git pull && sudo -u nahda npm ci && sudo -u nahda npx prisma migrate deploy && sudo -u nahda npm run build && systemctl restart nahda
```

Toujours la sauvegarde avant, et toujours `git pull` en place — jamais un clone
neuf, sinon relisez l'étape 5 sur les images.

En cas de problème, revenir au commit précédent :

```bash
cd /var/www/nahda/app && sudo -u nahda git reset --hard HEAD~1 && sudo -u nahda npm ci && sudo -u nahda npm run build && systemctl restart nahda
```
