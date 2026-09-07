import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { CodesBarresClient } from "@/components/admin/codes-barres-client";
import { rattacherCodeBarresAction } from "@/app/admin/produits/codes-barres/actions";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { getPrismaClient } from "@/lib/db";

export const dynamic = "force-dynamic";

// Saisie des codes-barres, article en main.
//
// La caisse ne peut rien scanner tant que le catalogue n'a pas ses codes. Le
// formulaire produit porte bien le champ, mais le remplir pour deux cents
// references en passant par la fiche complete prendrait la journee. Ici on
// choisit l'article, on scanne, et le suivant prend la place.

export default async function AdminCodesBarresPage() {
  const admin = await requireAdminSection("products");
  const db = getPrismaClient();

  const produits = await db.product.findMany({
    where: {
      status: { in: ["PUBLISHED", "ON_ORDER", "OUT_OF_STOCK", "DRAFT"] },
      OR: [{ barcode: null }, { barcode: "" }],
    },
    select: {
      id: true,
      sku: true,
      name: true,
      brand: { select: { name: true } },
      stocks: { select: { quantity: true } },
    },
    orderBy: { name: "asc" },
  });

  const liste = produits.map((produit) => ({
    id: produit.id,
    sku: produit.sku,
    name: produit.name,
    brandName: produit.brand.name,
    stock: produit.stocks.reduce((somme, stock) => somme + stock.quantity, 0),
  }));

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <Link
          href="/admin/produits"
          className="inline-flex items-center gap-2 text-sm font-black text-white/60 transition hover:text-nahda-olive"
        >
          <ArrowLeft size={16} />
          Retour aux produits
        </Link>

        <AdminPageHeader
          eyebrow="Caisse"
          title="Codes-barres"
          description={`${liste.length} article(s) sans code. Sans lui, la caisse ne peut pas les scanner.`}
        />

        <CodesBarresClient
          produits={liste}
          rattacher={rattacherCodeBarresAction}
        />
      </div>
    </AdminLayout>
  );
}
