# Backup, restore et exports

## Backup PostgreSQL

La commande cree un dump custom PostgreSQL dans `BACKUP_DIR` ou `backups/`.

```powershell
npm.cmd run backup:db
```

Le script lit `.env`, utilise `DATABASE_URL`, cherche `pg_dump.exe` via `PG_BIN`, les chemins PostgreSQL Windows courants, puis `PATH`.

Exemple:

```powershell
$env:PG_BIN='C:\Program Files\PostgreSQL\18\bin'
npm.cmd run backup:db
```

Le mot de passe DB est transmis via `PGPASSWORD` au processus enfant et n'est pas imprime.

## Restore PostgreSQL

La restauration est volontairement bloquee par defaut. Elle exige une confirmation explicite:

```powershell
$env:CONFIRM_RESTORE='YES'
npm.cmd run restore:db -- backups\nahda-smart-YYYY-MM-DD.dump
```

Le script utilise `pg_restore --clean --if-exists --no-owner --no-privileges`.
Tester d'abord sur staging avant toute production.

## Exports CSV admin

```powershell
npm.cmd run export:csv
```

Fichiers generes:

- `commandes.csv`
- `produits.csv`
- `clients.csv`
- `stock.csv`

Les exports sont ecrits dans `EXPORT_DIR` ou `exports/<timestamp>/`.
Par defaut, l'export produits ne contient pas `priceBuy` ni `margin`.

## Scan public anti-fuite

Lancez le serveur local puis:

```powershell
npm.cmd run security:public-scan
```

Le scan verifie les routes publiques principales contre des marqueurs internes connus:

- `priceBuy`
- `passwordHash`
- `tokenHash`
- `AdminLog`
- `SupplierPurchase`
- `internalNote`
- `DATABASE_URL`
- `ADMIN_PASSWORD_HASH`

Ce scan ne remplace pas un audit de securite, mais il attrape les regressions evidentes.
