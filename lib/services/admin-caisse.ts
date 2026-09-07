import { getPrismaClient } from "@/lib/db";
import { formatMoney } from "@/lib/admin/labels";

// Vente au comptoir.
//
// Le magasin notait ses ventes sur papier. La caisse remplace le carnet : on
// scanne, on encaisse, la commande et le stock suivent.
//
// L'encaissement lui-meme n'est pas ici : il passe par
// createAdminManualOrder, qui sait deja creer la commande, decrementer le
// stock sans fenetre de course et journaliser. Deux chemins d'ecriture
// auraient fini par diverger.

export type ArticleCaisse = {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  brandName: string;
  price: number;
  priceLabel: string;
  stock: number;
  // Un brouillon reste scannable mais pas vendable : le magasin vient de le
  // recevoir et n'a pas encore fixe son prix. Le trouver et lire "prix a
  // saisir" vaut mieux qu'un "code inconnu" qui laisse croire a une erreur
  // de scan.
  vendable: boolean;
};

// Client par defaut du comptoir.
//
// Une commande exige un client, et la plupart des ventes au comptoir se font
// sans en enregistrer un : on rattache alors la vente a ce client generique.
// Le vendeur peut toujours en choisir un vrai quand le client est connu.
export const TELEPHONE_COMPTOIR = "COMPTOIR";

export async function getClientComptoir() {
  const db = getPrismaClient();

  const existant = await db.customer.findFirst({
    where: { phone: TELEPHONE_COMPTOIR },
    select: { id: true, name: true },
  });

  if (existant) return existant;

  return db.customer.create({
    data: {
      name: "Vente au comptoir",
      phone: TELEPHONE_COMPTOIR,
      type: "INDIVIDUAL",
    },
    select: { id: true, name: true },
  });
}

// Le catalogue scannable part en entier vers le navigateur.
//
// La recherche du code se fait donc cote client, sans aller-retour reseau :
// la douchette enchaine les scans plus vite qu'une requete ne revient, et le
// comptoir doit rester utilisable meme quand la connexion faiblit. Seuls les
// champs necessaires sont envoyes.
export async function getArticlesCaisse(): Promise<ArticleCaisse[]> {
  const db = getPrismaClient();

  const produits = await db.product.findMany({
    // Les brouillons sont inclus : ils portent souvent un code-barres tout
    // juste recu du fournisseur, et le vendeur doit pouvoir le scanner pour
    // comprendre pourquoi l'article ne peut pas encore partir.
    where: { status: { in: ["PUBLISHED", "ON_ORDER", "OUT_OF_STOCK", "DRAFT"] } },
    select: {
      id: true,
      sku: true,
      barcode: true,
      name: true,
      status: true,
      priceSell: true,
      promoPrice: true,
      brand: { select: { name: true } },
      stocks: { select: { quantity: true } },
    },
    orderBy: { name: "asc" },
  });

  return produits.map((produit) => {
    const price = Number(produit.promoPrice ?? produit.priceSell);

    return {
      id: produit.id,
      sku: produit.sku,
      barcode: produit.barcode ?? "",
      name: produit.name,
      brandName: produit.brand.name,
      price,
      priceLabel: formatMoney(price),
      stock: produit.stocks.reduce((somme, stock) => somme + stock.quantity, 0),
      vendable: produit.status !== "DRAFT" && price > 0,
    };
  });
}

export async function getDepotsCaisse() {
  const db = getPrismaClient();
  const depots = await db.depot.findMany({
    where: { isActive: true },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return depots;
}

// Clients enregistres, pour rattacher une vente a un client connu.
export async function getClientsCaisse() {
  const db = getPrismaClient();
  const clients = await db.customer.findMany({
    where: { phone: { not: TELEPHONE_COMPTOIR } },
    orderBy: { name: "asc" },
    take: 500,
    select: { id: true, name: true, phone: true, organizationName: true },
  });

  return clients.map((client) => ({
    id: client.id,
    label: client.organizationName
      ? `${client.name} — ${client.organizationName}`
      : `${client.name} — ${client.phone}`,
  }));
}
