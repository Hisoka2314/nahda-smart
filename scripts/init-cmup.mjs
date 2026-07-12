// Initialise le CMUP (averageCost) au prix d'achat actuel pour les produits
// qui n'en ont pas encore. A lancer UNE fois apres la migration document_type_cmup
// sur une base existante : node scripts/init-cmup.mjs
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const products = await prisma.product.findMany({
  where: { averageCost: null },
  select: { id: true, priceBuy: true },
});

for (const product of products) {
  await prisma.product.update({
    where: { id: product.id },
    data: { averageCost: product.priceBuy },
  });
}

console.log(`CMUP initialise sur ${products.length} produit(s).`);
await prisma.$disconnect();
