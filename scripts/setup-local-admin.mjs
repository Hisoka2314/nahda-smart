import "dotenv/config";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { stdin as input, stdout as output } from "node:process";

const envPath = ".env";
const defaultAdminEmail = "admin@nahdasmart.ma";
const defaultAdminName = "Super Admin Nahda Smart";

function readHiddenLine(prompt) {
  return new Promise((resolve) => {
    const chars = [];
    const wasRaw = input.isRaw;

    output.write(prompt);
    input.resume();
    input.setEncoding("utf8");
    input.setRawMode?.(true);

    function cleanup() {
      input.off("data", onData);
      input.setRawMode?.(wasRaw);
      input.pause();
      output.write("\n");
    }

    function onData(chunk) {
      for (const char of chunk) {
        const code = char.charCodeAt(0);

        if (code === 3) {
          cleanup();
          process.exit(130);
        }

        if (code === 13 || code === 10) {
          cleanup();
          resolve(chars.join(""));
          return;
        }

        if (code === 8 || code === 127) {
          chars.pop();
          continue;
        }

        chars.push(char);
      }
    }

    input.on("data", onData);
  });
}

function upsertEnvValue(content, key, value) {
  const escaped = `${key}="${value}"`;
  const linePattern = new RegExp(`^${key}=.*$`, "m");

  if (linePattern.test(content)) {
    return content.replace(linePattern, escaped);
  }

  return `${content.trimEnd()}\n${escaped}\n`;
}

function generatePasswordHash(password) {
  const salt = randomBytes(16).toString("hex");
  const keyLength = 64;
  const hash = scryptSync(password, salt, keyLength).toString("hex");

  return `scrypt:${salt}:${hash}`;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL est requis dans .env.");
  process.exit(1);
}

if (!existsSync(envPath)) {
  console.error(".env est introuvable. Creez-le depuis .env.example.");
  process.exit(1);
}

const password = await readHiddenLine("Mot de passe admin local: ");
const confirm = await readHiddenLine("Confirmer le mot de passe admin: ");

if (!password || password.length < 12) {
  console.error("Le mot de passe doit contenir au moins 12 caracteres.");
  process.exit(1);
}

if (
  password.length !== confirm.length ||
  !timingSafeEqual(Buffer.from(password), Buffer.from(confirm))
) {
  console.error("Les mots de passe ne correspondent pas.");
  process.exit(1);
}

const adminEmail =
  process.env.ADMIN_EMAIL?.trim().toLowerCase() || defaultAdminEmail;
const adminName = process.env.ADMIN_NAME?.trim() || defaultAdminName;
const adminPasswordHash = generatePasswordHash(password);

const currentEnv = readFileSync(envPath, "utf8");
const nextEnv = [
  ["ADMIN_EMAIL", adminEmail],
  ["ADMIN_NAME", adminName],
  ["ADMIN_PASSWORD_HASH", adminPasswordHash],
].reduce(
  (content, [key, value]) => upsertEnvValue(content, key, value),
  currentEnv,
);

writeFileSync(envPath, nextEnv);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

try {
  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      active: true,
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      active: true,
    },
  });

  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: "ADMIN_UPSERT",
      entity: "AdminUser",
      entityId: admin.id,
      metadata: {
        source: "scripts/setup-local-admin.mjs",
        role: "SUPER_ADMIN",
      },
    },
  });

  console.log(`Admin SUPER_ADMIN configure: ${admin.email}`);
  console.log("Le hash admin a ete enregistre localement dans .env.");
} finally {
  await prisma.$disconnect();
}
