import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prismaClient?: PrismaClient;
};

export function getPrismaClient() {
  if (globalForPrisma.prismaClient) return globalForPrisma.prismaClient;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL est manquant. Configurez .env avant d'utiliser les services Prisma.",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  globalForPrisma.prismaClient = prisma;

  return prisma;
}
