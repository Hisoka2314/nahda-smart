import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { loadLocalEnv, resolvePgTool, databaseParts, timestampSlug } from "./prod-maintenance-utils.mjs";

loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL est requis pour creer un backup.");
  process.exit(1);
}

const backupDir = resolve(process.env.BACKUP_DIR ?? "backups");

if (!existsSync(backupDir)) {
  mkdirSync(backupDir, { recursive: true });
}

const outputFile = resolve(
  backupDir,
  `nahda-smart-${timestampSlug()}.dump`,
);
const pgDump = resolvePgTool("pg_dump");
const db = databaseParts(databaseUrl);
const result = spawnSync(
  pgDump,
  [
    "-h",
    db.host,
    "-p",
    db.port,
    "-U",
    db.user,
    "-d",
    db.database,
    "-F",
    "c",
    "-b",
    "--no-owner",
    "--no-privileges",
    "-f",
    outputFile,
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
  console.error("Backup PostgreSQL echoue.");
  if (result.stderr) console.error(result.stderr.toString());
  process.exit(result.status ?? 1);
}

console.log(`Backup PostgreSQL cree: ${outputFile}`);
