import { existsSync, readFileSync } from "node:fs";
import { delimiter, resolve } from "node:path";

export function loadLocalEnv() {
  const envFile = resolve(".env");

  if (!existsSync(envFile)) return;

  const lines = readFileSync(envFile, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^\s*([^#][^=]+)=(.*)$/);

    if (!match) continue;

    const key = match[1].trim();
    const rawValue = match[2].trim();
    const value = rawValue.replace(/^"|"$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function databaseParts(databaseUrl) {
  const url = new URL(databaseUrl);

  return {
    host: url.hostname,
    port: url.port || "5432",
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
  };
}

export function resolvePgTool(name) {
  const executable = process.platform === "win32" ? `${name}.exe` : name;
  const candidates = [
    process.env.PG_BIN ? resolve(process.env.PG_BIN, executable) : undefined,
    ...commonPostgresBins().map((dir) => resolve(dir, executable)),
    ...process.env.PATH.split(delimiter).map((dir) => resolve(dir, executable)),
  ].filter(Boolean);

  const found = candidates.find((candidate) => existsSync(candidate));

  if (!found) {
    console.error(`${executable} introuvable. Definissez PG_BIN vers le dossier bin PostgreSQL.`);
    process.exit(1);
  }

  return found;
}

export function timestampSlug(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function commonPostgresBins() {
  if (process.platform !== "win32") return [];

  return [
    "C:\\Program Files\\PostgreSQL\\18\\bin",
    "C:\\Program Files\\PostgreSQL\\17\\bin",
    "C:\\Program Files\\PostgreSQL\\16\\bin",
    "C:\\Program Files\\PostgreSQL\\15\\bin",
  ];
}
