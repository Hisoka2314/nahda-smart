# Installation de Nahda Smart sur un nouveau PC (PostgreSQL natif, port 5432).
# Usage : powershell -ExecutionPolicy Bypass -File scripts\setup-new-pc.ps1
# Compatible Windows PowerShell 5.1.

$ErrorActionPreference = "Stop"

function Write-Step($message) {
  Write-Host ""
  Write-Host "==> $message" -ForegroundColor Green
}

function Fail($message) {
  Write-Host "ERREUR : $message" -ForegroundColor Red
  exit 1
}

# On doit etre a la racine du projet.
if (-not (Test-Path "package.json") -or -not (Test-Path "prisma\schema.prisma")) {
  Fail "Lancez ce script depuis la racine du projet (le dossier qui contient package.json)."
}

# ------------------------------------------------------------------
Write-Step "1/8 Verification des prerequis"

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { Fail "Node.js introuvable. Installez Node.js 20+ depuis https://nodejs.org" }
$nodeVersion = (& node --version).TrimStart("v")
Write-Host "    Node.js $nodeVersion : OK"

# psql : dans le PATH, sinon emplacements standards.
$psql = (Get-Command psql -ErrorAction SilentlyContinue).Source
if (-not $psql) {
  $candidates = Get-ChildItem "$env:ProgramFiles\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending
  if ($candidates) { $psql = $candidates[0].FullName }
}
if (-not $psql) { Fail "psql introuvable. Installez PostgreSQL ou ajoutez son dossier bin au PATH." }
$pgBin = Split-Path $psql
Write-Host "    PostgreSQL : $psql"

# Service demarre ?
$listening = Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
if (-not $listening) {
  Fail "Rien n'ecoute sur le port 5432. Demarrez le service PostgreSQL (services.msc) puis relancez."
}
Write-Host "    Service PostgreSQL (port 5432) : OK"

# ------------------------------------------------------------------
Write-Step "2/8 Creation de l'utilisateur et de la base"

$dbPassword = Read-Host "Choisissez un mot de passe pour l'utilisateur applicatif 'nahda'"
if ($dbPassword.Length -lt 8) { Fail "Mot de passe trop court (8 caracteres minimum)." }

Write-Host "    Le mot de passe du super-utilisateur 'postgres' va vous etre demande (2 fois)."

# Role (idempotent) puis base (idempotente).
$roleSql = "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'nahda') THEN CREATE ROLE nahda LOGIN PASSWORD '$dbPassword'; ELSE ALTER ROLE nahda LOGIN PASSWORD '$dbPassword'; END IF; END `$`$;"
& $psql -U postgres -h localhost -p 5432 -d postgres -v ON_ERROR_STOP=1 -c $roleSql
if ($LASTEXITCODE -ne 0) { Fail "Creation de l'utilisateur 'nahda' impossible (mot de passe postgres incorrect ?)." }

$dbExists = & $psql -U postgres -h localhost -p 5432 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'nahda_smart'"
if ($dbExists -ne "1") {
  & $psql -U postgres -h localhost -p 5432 -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE nahda_smart OWNER nahda"
  if ($LASTEXITCODE -ne 0) { Fail "Creation de la base 'nahda_smart' impossible." }
  Write-Host "    Base 'nahda_smart' creee."
} else {
  Write-Host "    Base 'nahda_smart' deja presente : conservee."
}

# ------------------------------------------------------------------
Write-Step "3/8 Configuration du fichier .env"

$databaseUrl = "postgresql://nahda:$dbPassword@localhost:5432/nahda_smart?schema=public"

if (Test-Path ".env") {
  $envContent = Get-Content ".env" -Raw
  if ($envContent -match "(?m)^﻿?DATABASE_URL=") {
    $envContent = $envContent -replace '(?m)^﻿?DATABASE_URL=.*$', "DATABASE_URL=`"$databaseUrl`""
  } else {
    $envContent = "DATABASE_URL=`"$databaseUrl`"`r`n" + $envContent
  }
  # PG_BIN pour les scripts backup/restore.
  if ($envContent -match "(?m)^#?\s*PG_BIN=") {
    $envContent = $envContent -replace '(?m)^#?\s*PG_BIN=.*$', "PG_BIN=`"$pgBin`""
  } else {
    $envContent = $envContent + "`r`nPG_BIN=`"$pgBin`"`r`n"
  }
  $envContent | Out-File ".env" -Encoding utf8 -NoNewline
  Write-Host "    .env existant mis a jour (DATABASE_URL -> port 5432, PG_BIN)."
} else {
  if (Test-Path ".env.example") { Copy-Item ".env.example" ".env" }
  $lines = @()
  if (Test-Path ".env") {
    $lines = (Get-Content ".env") | Where-Object { $_ -notmatch '^﻿?DATABASE_URL=' }
  }
  $newContent = @("DATABASE_URL=`"$databaseUrl`"") + $lines + @("PG_BIN=`"$pgBin`"")
  $newContent -join "`r`n" | Out-File ".env" -Encoding utf8
  Write-Host "    .env cree depuis .env.example."
}

# ------------------------------------------------------------------
Write-Step "4/8 Installation des dependances (npm install)"
npm install
if ($LASTEXITCODE -ne 0) { Fail "npm install a echoue." }

# ------------------------------------------------------------------
Write-Step "5/8 Application des migrations Prisma"
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { Fail "Les migrations ont echoue. Verifiez DATABASE_URL dans .env." }
npx prisma generate | Out-Null

# ------------------------------------------------------------------
Write-Step "6/8 Donnees : restauration ou demo"

$backupFiles = @()
if (Test-Path "backups") {
  $backupFiles = Get-ChildItem "backups" -File | Sort-Object LastWriteTime -Descending
}

if ($backupFiles.Count -gt 0) {
  Write-Host "    Sauvegarde trouvee : $($backupFiles[0].Name)"
  $choice = Read-Host "    [R]estaurer cette sauvegarde ou charger les donnees de [D]emo ? (R/D)"
  if ($choice -match '^[Rr]') {
    npm run restore:db -- $backupFiles[0].FullName
    if ($LASTEXITCODE -ne 0) { Fail "La restauration a echoue." }
    Write-Host "    Donnees restaurees depuis la sauvegarde."
  } else {
    npm run prisma:seed
    Write-Host "    Donnees de demonstration chargees."
  }
} else {
  Write-Host "    Aucune sauvegarde dans backups\ : chargement des donnees de demo."
  npm run prisma:seed
}

# ------------------------------------------------------------------
Write-Step "7/8 Compte administrateur"
$adminChoice = Read-Host "    Creer/mettre a jour le compte admin maintenant ? (O/N)"
if ($adminChoice -match '^[Oo]') {
  npm run admin:setup-local
}

# ------------------------------------------------------------------
Write-Step "8/8 Compilation du site (npm run build)"
npm run build
if ($LASTEXITCODE -ne 0) { Fail "Le build a echoue." }

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host " Installation terminee !" -ForegroundColor Green
Write-Host ""
Write-Host " Demarrer le site :"
Write-Host "   `$env:PORT=3100; npm run start"
Write-Host ""
Write-Host " Site   : http://localhost:3100"
Write-Host " Admin  : http://localhost:3100/admin/login"
Write-Host "====================================================="
