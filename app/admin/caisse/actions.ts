"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { createAdminManualOrder } from "@/lib/services/admin-clients";

// Encaissement d'une vente au comptoir.
//
// Rien n'est reecrit ici : l'action valide ce qui arrive du navigateur, puis
// delegue a createAdminManualOrder. C'est elle qui cree la commande,
// decremente le stock par une mise a jour conditionnelle -- donc sans fenetre
// de course si deux ventes partent en meme temps -- et journalise.
//
// La commande part directement en CONFIRMED : au comptoir, le client repart
// avec la marchandise. Une commande en attente de confirmation n'aurait aucun
// sens, et surtout ne toucherait pas au stock.

const venteSchema = z.object({
  depotId: z.string().min(1, "Dépôt obligatoire."),
  customerId: z.string().min(1, "Client obligatoire."),
  paymentMethod: z.enum(["PAY_ON_SITE", "CASH_ON_DELIVERY"]),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .min(1, "Le ticket est vide."),
});

export async function encaisserVenteAction(formData: FormData) {
  const admin = await requireAdminSection("orders");

  let lignes: unknown;
  try {
    lignes = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { erreur: "Ticket illisible." };
  }

  const parsed = venteSchema.safeParse({
    depotId: formData.get("depotId"),
    customerId: formData.get("customerId"),
    paymentMethod: formData.get("paymentMethod"),
    items: lignes,
  });

  if (!parsed.success) {
    return { erreur: parsed.error.issues[0]?.message ?? "Vente invalide." };
  }

  let commande: { id: string; orderNumber: string };

  try {
    commande = await createAdminManualOrder({
      adminId: admin.id,
      adminRole: admin.role,
      input: {
        customerId: parsed.data.customerId,
        depotId: parsed.data.depotId,
        deliveryMethod: "PICKUP_IN_STORE",
        paymentMethod: parsed.data.paymentMethod,
        status: "CONFIRMED",
        customerNote: undefined,
        internalNote: "Vente au comptoir (caisse).",
        items: parsed.data.items.map((ligne) => ({
          productId: ligne.productId,
          quantity: ligne.quantity,
          unitPrice: 0,
          discount: 0,
        })),
      },
    });
  } catch (error) {
    unstable_rethrow(error);
    // Le message porte la raison utile -- "Stock insuffisant pour X" -- et
    // doit remonter au vendeur tel quel.
    return {
      erreur:
        error instanceof Error ? error.message : "Encaissement impossible.",
    };
  }

  revalidatePath("/admin/caisse");
  revalidatePath("/admin/commandes");
  revalidatePath("/admin/stock");

  // La facture s'ouvre dans la foulee : c'est ce que le client attend au
  // comptoir, et cela evite au vendeur de chercher la commande.
  redirect(`/admin/commandes/${commande.id}/facture`);
}
