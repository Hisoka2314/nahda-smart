import { getPrismaClient } from "@/lib/db";
import { notifyInBackground } from "@/lib/notifications";

// Verifie apres un mouvement si des lignes de stock sont passees sous leur
// seuil et notifie. Fire-and-forget : jamais bloquant pour le flux appelant,
// et appele hors transaction (le stock est deja commite).
export function checkLowStockAndNotify(productIds: string[]) {
  if (productIds.length === 0) return;

  void (async () => {
    try {
      const db = getPrismaClient();
      const rows = await db.stock.findMany({
        where: {
          productId: { in: productIds },
          depot: { isActive: true },
        },
        include: {
          product: { select: { name: true, sku: true } },
          depot: { select: { name: true } },
        },
      });

      for (const row of rows) {
        if (row.quantity > row.lowStockThreshold) continue;

        notifyInBackground({
          kind: "stock",
          subject: `Stock bas : ${row.product.name} (${row.quantity} restant)`,
          text: [
            `Produit : ${row.product.name} (SKU ${row.product.sku})`,
            `Depot : ${row.depot.name}`,
            `Quantite restante : ${row.quantity} (seuil : ${row.lowStockThreshold})`,
            ``,
            `Voir : /admin/stock`,
          ].join("\n"),
        });
      }
    } catch {
      // L'alerte ne doit jamais faire echouer l'operation d'origine.
    }
  })();
}
