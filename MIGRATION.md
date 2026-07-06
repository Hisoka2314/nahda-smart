# Migrer Nahda Smart sur un autre PC (PostgreSQL déjà installé)

Guide pour installer et tester le site en local sur une nouvelle machine Windows
avec PostgreSQL natif (service standard, port 5432).

---

## Vue d'ensemble

| Étape | Où | Quoi |
|---|---|---|
| 1 | Ancien PC | Exporter la base (optionnel, seulement pour garder vos données) |
| 2 | Ancien PC | Copier le dossier du projet |
| 3 | Nouveau PC | Lancer `scripts\setup-new-pc.ps1` (fait tout le reste) |

---

## Étape 1 — Exporter la base (ancien PC, optionnel)

À faire **uniquement** si vous voulez transférer vos vraies données
(produits, commandes, clients...). Sinon, sautez : le nouveau PC partira
sur une base vierge remplie avec les données de démonstration.

```powershell
# Dans le dossier du projet (la base locale 55432 doit tourner)
npm run backup:db
```

Le fichier de sauvegarde est créé dans le dossier `backups\`.

## Étape 2 — Copier le projet

Copiez le dossier `nahda smart` sur le nouveau PC (clé USB, réseau...).

- **À exclure** (se régénèrent, lourds) : `node_modules`, `.next`, `tmp`
- **À inclure absolument** :
  - `public\uploads\` (vos logos et images uploadés)
  - `backups\` (si vous avez fait l'étape 1)
  - `.env` (il sera adapté à l'étape 3)

## Étape 3 — Installer sur le nouveau PC

Prérequis : **Node.js 20+** et **PostgreSQL 18** installés.

Ouvrez PowerShell **dans le dossier du projet** et lancez :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-new-pc.ps1
```

Le script fait tout :
1. Vérifie Node et PostgreSQL.
2. Crée l'utilisateur `nahda` et la base `nahda_smart` (demande le mot de
   passe du super-utilisateur `postgres` défini à l'installation de PostgreSQL).
3. Écrit le `DATABASE_URL` correct dans `.env` (port **5432**, pas 55432 !).
4. Installe les dépendances (`npm install`).
5. Applique toutes les migrations (`prisma migrate deploy`).
6. Vous propose : restaurer votre sauvegarde **ou** charger les données de démo.
7. Vous propose de créer le compte admin (`npm run admin:setup-local`).
8. Compile le site (`npm run build`).

Puis démarrez :

```powershell
$env:PORT=3100; npm run start
# Site : http://localhost:3100  ·  Admin : http://localhost:3100/admin/login
```

---

## Différence importante avec l'ancien PC

Sur l'ancien PC, la base est un **cluster local au projet** (`tmp\pgdata`,
port **55432**) à démarrer à la main. Sur le nouveau PC, c'est le **service
PostgreSQL standard** (port **5432**) qui démarre tout seul avec Windows —
plus rien à lancer manuellement. Seule la ligne `DATABASE_URL` du `.env`
change, et le script s'en occupe.

## Dépannage rapide

- **« password authentication failed »** → le mot de passe `postgres` saisi
  est incorrect, relancez le script.
- **« port 5432 refused »** → le service PostgreSQL n'est pas démarré :
  `services.msc` → `postgresql-x64-18` → Démarrer.
- **Les images uploadées manquent** → recopiez `public\uploads\` depuis
  l'ancien PC.
- **Le site montre les produits de démo au lieu des vôtres** → la base est
  vide : refaites l'étape 1 sur l'ancien PC puis relancez le script et
  choisissez « restaurer ».
