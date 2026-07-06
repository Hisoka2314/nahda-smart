import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const placeholderAdminHash = "$2b$12$replace-with-a-secure-hash";

function isUsableAdminHash(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 24 &&
    value !== placeholderAdminHash &&
    value.startsWith("scrypt:")
  );
}

const connectionString = process.env.DATABASE_URL;
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const adminName = process.env.ADMIN_NAME?.trim() || "Super Admin Nahda Smart";
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

if (!connectionString) {
  console.error("DATABASE_URL est requis.");
  process.exit(1);
}

if (!adminEmail) {
  console.error("ADMIN_EMAIL est requis.");
  process.exit(1);
}

if (!isUsableAdminHash(adminPasswordHash)) {
  console.error(
    "ADMIN_PASSWORD_HASH absent, placeholder ou invalide. Lancez d'abord npm.cmd run admin:hash puis copiez uniquement le hash dans .env.",
  );
  process.exit(1);
}

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
        source: "scripts/upsert-admin.mjs",
        role: "SUPER_ADMIN",
      },
    },
  });

  console.log(`Admin SUPER_ADMIN configure: ${admin.email}`);
} finally {
  await prisma.$disconnect();
}
