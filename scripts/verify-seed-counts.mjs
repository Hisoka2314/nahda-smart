import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL est requis pour verifier les donnees seed.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const tables = {
  categories: prisma.category,
  marques: prisma.brand,
  produits: prisma.product,
  imagesProduits: prisma.productImage,
  groupesFiltres: prisma.filterGroup,
  attributsFiltres: prisma.filterAttribute,
  optionsFiltres: prisma.filterOption,
  valeursAttributsProduits: prisma.productAttributeValue,
  depots: prisma.depot,
  stocks: prisma.stock,
  mouvementsStock: prisma.stockMovement,
  clients: prisma.customer,
  notesClients: prisma.customerNote,
  commandes: prisma.order,
  articlesCommandes: prisma.orderItem,
  historiquesCommandes: prisma.orderStatusHistory,
  devis: prisma.quote,
  messagesContact: prisma.contactMessage,
  fournisseurs: prisma.supplier,
  achatsFournisseurs: prisma.supplierPurchase,
  articlesAchatsFournisseurs: prisma.supplierPurchaseItem,
  paiementsFournisseurs: prisma.supplierPayment,
  notesFournisseurs: prisma.supplierNote,
  ticketsSav: prisma.serviceTicket,
  notesSav: prisma.serviceTicketNote,
  historiquesSav: prisma.serviceTicketStatusHistory,
  admins: prisma.adminUser,
  sessionsAdmin: prisma.adminSession,
  logsAdmin: prisma.adminLog,
};

try {
  const counts = {};

  for (const [label, model] of Object.entries(tables)) {
    counts[label] = await model.count();
  }

  console.table(counts);
  console.log(JSON.stringify(counts, null, 2));
} catch (error) {
  const code = error?.code ?? error?.cause?.code ?? "UNKNOWN";
  const message =
    code === "ECONNREFUSED"
      ? "PostgreSQL est indisponible pour DATABASE_URL. Verifiez l'hote, le port et que la DB locale est lancee."
      : code === "P1000"
        ? "Authentification PostgreSQL refusee. Verifiez le user/password de DATABASE_URL."
        : "Impossible de verifier les counts Prisma.";

  console.error(`[prisma:counts] ${message}`);
  console.error(`[prisma:counts] Code: ${code}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
