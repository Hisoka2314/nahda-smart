import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const pgData = path.join(root, "tmp", "pgdata");
const candidates = [
  process.env.PG_BIN ? path.join(process.env.PG_BIN, "pg_ctl.exe") : "",
  "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_ctl.exe",
  "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_ctl.exe",
  "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_ctl.exe",
].filter(Boolean);

if (!fs.existsSync(pgData)) {
  console.error(`Cluster introuvable: ${pgData}`);
  process.exit(1);
}

const pgCtl = candidates.find((candidate) => fs.existsSync(candidate));

if (!pgCtl) {
  console.error("pg_ctl.exe introuvable. Definissez PG_BIN ou arretez PostgreSQL manuellement.");
  process.exit(1);
}

const result = spawnSync(pgCtl, ["-D", pgData, "-m", "fast", "stop"], {
  cwd: root,
  stdio: "inherit",
  windowsHide: true,
});

if (result.status === 0) {
  console.log("PostgreSQL local Nahda Smart arrete proprement.");
  process.exit(0);
}

console.error("Impossible d'arreter PostgreSQL local via pg_ctl. Aucune donnee n'a ete supprimee.");
process.exit(result.status ?? 1);
