import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { loadLocalEnv, resolvePgTool, databaseParts } from "./prod-maintenance-utils.mjs";

loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL;
const backupFile = process.argv[2] ?? process.env.BACKUP_FILE;

if (!databaseUrl) {
  console.error("DATABASE_URL est requis pour restaurer un backup.");
  process.exit(1);
}

if (!backupFile) {
  console.error("Indiquez le fichier backup: npm.cmd run restore:db -- backups\\fichier.dump");
  process.exit(1);
}

const resolvedBackup = resolve(backupFile);

if (!existsSync(resolvedBackup)) {
  console.error(`Backup introuvable: ${resolvedBackup}`);
  process.exit(1);
}

if (process.env.CONFIRM_RESTORE !== "YES") {
  console.error("Restauration refusee par securite.");
  console.error("Definissez CONFIRM_RESTORE=YES seulement apres avoir confirme la cible DATABASE_URL.");
  process.exit(1);
}

const pgRestore = resolvePgTool("pg_restore");
const db = databaseParts(databaseUrl);
const result = spawnSync(
  pgRestore,
  [
    "-h",
    db.host,
    "-p",
    db.port,
    "-U",
    db.user,
    "-d",
    db.database,
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    "--exit-on-error",
    resolvedBackup,
  ],
  {
    env: {
      ...process.env,
      PGPASSWORD: db.password,
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

if (result.status !== 0) {
  console.error("Restauration PostgreSQL echouee.");
  if (result.stderr) console.error(result.stderr.toString());
  process.exit(result.status ?? 1);
}

console.log(`Restauration PostgreSQL terminee depuis: ${resolvedBackup}`);
