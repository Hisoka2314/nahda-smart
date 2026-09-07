"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { getPrismaClient } from "@/lib/db";
import { logAdminEvent } from "@/lib/auth/admin-auth";

// Rattachement d'un code-barres a un produit.
//
// La caisse ne sert a rien tant que les articles n'ont pas leur code : le
// catalogue en comptait quatorze sur trois cent soixante-dix-huit, tous
// arrives avec une facture fournisseur. Les autres se saisissent en magasin,
// article en main.

const rattachementSchema = z.object({
  productId: z.string().min(1),
  // Un code-barres marchandise fait 8, 12, 13 ou 14 chiffres. La contrainte
  // reste large : quelques fournisseurs impriment des codes internes
  // alphanumeriques, et les refuser bloquerait une saisie legitime.
  barcode: z
    .string()
    .trim()
    .min(4, "Code trop court.")
    .max(48, "Code trop long.")
    .regex(/^[A-Za-z0-9-]+$/, "Chiffres, lettres et tirets seulement."),
});

export async function rattacherCodeBarresAction(formData: FormData) {
  const admin = await requireAdminSection("products");

  const parsed = rattachementSchema.safeParse({
    productId: formData.get("productId"),
    barcode: formData.get("barcode"),
  });

  if (!parsed.success) {
    return { erreur: parsed.error.issues[0]?.message ?? "Saisie invalide." };
  }

  const db = getPrismaClient();
  const code = parsed.data.barcode.toUpperCase();

  // Un meme code ne peut pas designer deux articles : la caisse en
  // choisirait un au hasard. Le dire ici evite une vente sur le mauvais
  // produit, et l'erreur serait invisible autrement.
  const occupant = await db.product.findFirst({
    where: { barcode: code, id: { not: parsed.data.productId } },
    select: { name: true, sku: true },
  });

  if (occupant) {
    return {
      erreur: `Ce code est deja celui de ${occupant.name} (${occupant.sku}).`,
    };
  }

  const produit = await db.product.update({
    where: { id: parsed.data.productId },
    data: { barcode: code },
    select: { id: true, name: true, sku: true },
  });

  await logAdminEvent({
    adminId: admin.id,
    action: "ADMIN_PRODUCT_UPDATED",
    entity: "Product",
    entityId: produit.id,
    metadata: { barcode: code, sku: produit.sku },
  });

  revalidatePath("/admin/produits/codes-barres");
  revalidatePath("/admin/caisse");

  return { ok: true, nom: produit.name };
}
