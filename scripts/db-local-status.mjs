import net from "node:net";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const host = "127.0.0.1";
const port = 55432;
const readyCandidates = [
  process.env.PG_BIN ? `${process.env.PG_BIN}\\pg_isready.exe` : "",
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

function isReady() {
  const pgIsReady = readyCandidates.find((candidate) => fs.existsSync(candidate));
  if (!pgIsReady) return undefined;

  const result = spawnSync(
    pgIsReady,
    ["-h", host, "-p", String(port), "-d", "nahda_smart", "-U", "nahda"],
    { stdio: "pipe", windowsHide: true },
  );

  return result.status === 0;
}

const ready = isReady();
const open = ready ?? (await canConnect());

if (open) {
  console.log(`PostgreSQL local Nahda Smart est pret sur ${host}:${port}.`);
  process.exit(0);
}

console.log(`PostgreSQL local Nahda Smart n'est pas pret sur ${host}:${port}.`);
process.exit(1);
