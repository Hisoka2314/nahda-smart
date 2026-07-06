# Configuration environnement Nahda Smart

## Fichiers

- `.env.example` : modèle commit-friendly.
- `.env` : fichier local non commit, à créer manuellement.
- `prisma.config.ts` : lit `DATABASE_URL` pour Prisma 7.

## Variables

```env
DATABASE_URL="postgresql://nahda:nahda_password@localhost:5432/nahda_smart?schema=public"
ADMIN_EMAIL="admin@nahdasmart.ma"
ADMIN_PASSWORD_HASH="$2b$12$replace-with-a-secure-hash"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_WHATSAPP_NUMBER="212600000000"
BACKUP_DIR="backups"
EXPORT_DIR="exports"
# PG_BIN="C:\\Program Files\\PostgreSQL\\18\\bin"
```

Ne stockez jamais un vrai mot de passe admin en clair. Utilisez `ADMIN_PASSWORD_HASH`.

Si `ADMIN_PASSWORD_HASH` est absent ou garde la valeur placeholder, le seed ne crée pas d’admin afin d’éviter un compte insecure.

Générer un hash local :

```powershell
npm.cmd run admin:hash
```

Copiez ensuite uniquement la valeur `ADMIN_PASSWORD_HASH="..."` dans `.env`.

Créer ou mettre à jour le super admin local :

```powershell
npm.cmd run admin:upsert
```

Le script `admin:upsert` lit `ADMIN_EMAIL`, `ADMIN_NAME` et `ADMIN_PASSWORD_HASH`. Il refuse de créer un admin si le hash est absent, placeholder ou invalide.

Pour configurer un super admin local sans afficher le hash :

```powershell
npm.cmd run admin:setup-local
```

La commande demande le mot de passe en saisie masquée, génère le hash, met `.env` à jour localement et lance l'upsert admin.

## PostgreSQL local avec Docker

```powershell
docker compose up -d
```

Le service expose PostgreSQL sur `localhost:5432`.

## Prisma

Valider le schéma :

```powershell
npx.cmd prisma validate
```

Générer le client :

```powershell
npx.cmd prisma generate
```

Créer une migration locale :

```powershell
npx.cmd prisma migrate dev --name init
```

Seed :

```powershell
npx.cmd prisma db seed
```

Si PowerShell bloque `npx.ps1`, utilisez `npx.cmd`.

## Vérifier les données seedées

Après `prisma db seed`, vous pouvez compter les données avec un petit script Node/Prisma ou via Prisma Studio :

```powershell
npx.cmd prisma studio
```

La Phase 4A.1 utilise aussi une commande Node de vérification pour compter les tables principales.

## Credentials PostgreSQL refusés

Si vous voyez `28P01`, PostgreSQL répond mais refuse le mot de passe. Causes fréquentes :

- un ancien container PostgreSQL utilise déjà le port `5432`
- un volume Docker existant garde un ancien mot de passe
- `.env` ne correspond pas à `docker-compose.yml`

Correction non destructive recommandée :

1. Vérifier quel container expose `5432`.
2. Corriger `.env` pour correspondre au container existant, ou changer le port du compose.
3. Ne supprimez pas de volume existant sans sauvegarde ou confirmation.

## Verification des counts seed

Une commande dediee permet de verifier les donnees principales apres migration et seed :

```powershell
npm.cmd run prisma:counts
```

Elle compte les categories, marques, produits, images produits, filtres, valeurs d'attributs produits, depots, stocks, clients, commandes, devis, fournisseurs, admins et logs admin.

## Fallback Windows sans Docker

Si Docker n'est pas disponible et qu'un service PostgreSQL local occupe deja `localhost:5432` avec d'autres identifiants, utilisez un cluster local isole dans le workspace sur un autre port, par exemple `55432`. Cela evite de modifier ou supprimer une base existante.

Exemple de `DATABASE_URL` locale :

```env
DATABASE_URL="postgresql://nahda:nahda_password@localhost:55432/nahda_smart?schema=public"
```

Commandes utiles avec les binaires PostgreSQL Windows :

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\initdb.exe' -D tmp\pgdata -U nahda --pwfile=tmp\pgpass.txt --auth=scram-sha-256 --encoding=UTF8 --locale=C
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D tmp\pgdata -o '-p 55432' -l tmp\pg.log start
$env:PGPASSWORD='nahda_password'
& 'C:\Program Files\PostgreSQL\18\bin\createdb.exe' -h localhost -p 55432 -U nahda nahda_smart
```

Supprimez `tmp\pgpass.txt` apres `initdb`. Pour arreter ce cluster temporaire :

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D tmp\pgdata stop
```

Scripts pratiques Phase 5B, sans toucher au PostgreSQL Windows `5432` :

```powershell
npm.cmd run db:local:status
npm.cmd run db:local:start
npm.cmd run db:local:stop
```

Ces scripts utilisent uniquement `tmp/pgdata` et le port `55432`.
Ils ne suppriment pas le dossier de donnees. Le script de demarrage ecrit ses logs dans :

- `tmp/pg.log`

Le demarrage utilise `pg_ctl.exe start`, ce qui evite les fenetres console PostgreSQL visibles. Si `db:local:start` indique que `pg_ctl.exe` est introuvable, definissez `PG_BIN` vers le dossier `bin` de PostgreSQL, par exemple :

```powershell
$env:PG_BIN='C:\Program Files\PostgreSQL\18\bin'
npm.cmd run db:local:start
```

## Backups et exports production

Creer un backup PostgreSQL :

```powershell
npm.cmd run backup:db
```

Restaurer un backup demande une confirmation explicite :

```powershell
$env:CONFIRM_RESTORE='YES'
npm.cmd run restore:db -- backups\nahda-smart-YYYY-MM-DD.dump
```

Exporter les donnees admin en CSV :

```powershell
npm.cmd run export:csv
```

Scanner les routes publiques pour detecter des marqueurs internes connus :

```powershell
npm.cmd run security:public-scan
```

## Sans PostgreSQL local

Le front reste en mock. Vous pouvez quand même lancer :

- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run build`

Pour `prisma validate` et `prisma generate`, `DATABASE_URL` doit être défini même si la DB n’est pas accessible.
