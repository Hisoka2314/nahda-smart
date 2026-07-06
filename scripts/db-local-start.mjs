import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const root = process.cwd();
const pgData = path.join(root, "tmp", "pgdata");
const logFile = path.join(root, "tmp", "pg.log");
const pidFile = path.join(pgData, "postmaster.pid");
const host = "127.0.0.1";
const port = 55432;
const candidates = [
  process.env.PG_BIN ? path.join(process.env.PG_BIN, "pg_ctl.exe") : "",
  "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_ctl.exe",
  "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_ctl.exe",
  "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_ctl.exe",
].filter(Boolean);
const directCandidates = [
  process.env.PG_BIN ? path.join(process.env.PG_BIN, "postgres.exe") : "",
  "C:\\Program Files\\PostgreSQL\\18\\bin\\postgres.exe",
  "C:\\Program Files\\PostgreSQL\\17\\bin\\postgres.exe",
  "C:\\Program Files\\PostgreSQL\\16\\bin\\postgres.exe",
].filter(Boolean);
const readyCandidates = [
  process.env.PG_BIN ? path.join(process.env.PG_BIN, "pg_isready.exe") : "",
  "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_isready.exe",
  "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_isready.exe",
  "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_isready.exe",
].filter(Boolean);

function canConnect() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.setTimeout(1800);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
  });
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function isReady() {
  const pgIsReady = readyCandidates.find((candidate) => fs.existsSync(candidate));
  if (pgIsReady) {
    const result = spawnSync(
      pgIsReady,
      ["-h", host, "-p", String(port), "-d", "nahda_smart", "-U", "nahda"],
      {
        cwd: root,
        stdio: "pipe",
        windowsHide: true,
      },
    );
    return result.status === 0;
  }

  return canConnect();
}

async function waitUntilReady(attempts = 45) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (await isReady()) return true;
  }

  return false;
}

if (!fs.existsSync(pgData)) {
  console.error(`Cluster introuvable: ${pgData}`);
  console.error("Lancez les migrations/seed seulement apres avoir restaure ce dossier.");
  process.exit(1);
}

if (await isReady()) {
  console.log(`PostgreSQL local Nahda Smart est deja disponible sur ${host}:${port}.`);
  process.exit(0);
}

const pgCtl = candidates.find((candidate) => fs.existsSync(candidate));

if (!pgCtl) {
  console.error("pg_ctl.exe introuvable. Definissez PG_BIN ou installez PostgreSQL localement.");
  process.exit(1);
}

fs.mkdirSync(path.join(root, "tmp"), { recursive: true });

if (fs.existsSync(pidFile)) {
  const rawPid = Number(
    fs.readFileSync(pidFile, "utf8").split(/\r?\n/)[0]?.trim(),
  );

  if (isProcessAlive(rawPid)) {
    console.log("PostgreSQL local est en cours de demarrage, attente etat pret...");
    if (await waitUntilReady()) {
      console.log(`PostgreSQL local Nahda Smart demarre sur ${host}:${port}.`);
      process.exit(0);
    }

    console.error("PostgreSQL local existe mais ne devient pas pret.");
    console.error(`Consultez ${logFile}`);
    process.exit(1);
  }

  fs.rmSync(pidFile, { force: true });
  console.log("postmaster.pid stale supprime apres verification du processus absent.");
}

const result = spawnSync(
  pgCtl,
  ["-D", pgData, "-l", logFile, "-o", `-p ${port} -h ${host}`, "start"],
  {
    cwd: root,
    stdio: "pipe",
    windowsHide: true,
  },
);

if (result.status !== 0) {
  const stderr = result.stderr?.toString().trim();
  const stdout = result.stdout?.toString().trim();
  const tokenRestricted = `${stdout}\n${stderr}`.includes("jeton restreint");
  if (!tokenRestricted || !startDirectPostgres()) {
    console.error("PostgreSQL local n'a pas pu demarrer via pg_ctl.");
    if (stdout) console.error(stdout);
    if (stderr) console.error(stderr);
    console.error(`Consultez ${logFile}`);
    process.exit(result.status ?? 1);
  }
}

if (await waitUntilReady()) {
  console.log(`PostgreSQL local Nahda Smart demarre sur ${host}:${port}.`);
  process.exit(0);
}

console.error("PostgreSQL local n'a pas repondu apres le demarrage.");
console.error(`Consultez ${logFile}`);
process.exit(1);

function startDirectPostgres() {
  const postgresExe = directCandidates.find((candidate) => fs.existsSync(candidate));
  if (!postgresExe) return false;

  const stdoutFile = path.join(root, "tmp", "pg.stdout.log");
  const argLine = `-D "${pgData.replaceAll('"', '\\"')}" -p ${port} -h ${host}`;
  const command = [
    `$exe = ${psQuote(postgresExe)}`,
    `$args = ${psQuote(argLine)}`,
    `Start-Process -FilePath $exe -ArgumentList $args -WindowStyle Hidden -RedirectStandardError ${psQuote(logFile)} -RedirectStandardOutput ${psQuote(stdoutFile)}`,
  ].join("; ");

  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
    {
      cwd: root,
      stdio: "pipe",
      windowsHide: true,
    },
  );

  if (result.status === 0) return true;

  const out = fs.openSync(logFile, "a");
  const err = fs.openSync(logFile, "a");
  const child = spawn(postgresExe, ["-D", pgData, "-p", String(port), "-h", host], {
    cwd: root,
    detached: true,
    stdio: ["ignore", out, err],
    windowsHide: true,
  });

  child.unref();
  fs.closeSync(out);
  fs.closeSync(err);
  return true;
}

function psQuote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}
