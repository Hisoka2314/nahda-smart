import { Prisma, StockMovementType } from "@prisma/client";

type StockTx = Prisma.TransactionClient;

export class StockReservationError extends Error {
  constructor(message = "Stock insuffisant pour réserver la commande.") {
    super(message);
    this.name = "StockReservationError";
  }
}

export type StockReservationItem = {
  productId: string;
  quantity: number;
};

export async function reserveStockForOrderItems(
  tx: StockTx,
  orderNumber: string,
  items: StockReservationItem[],
) {
  for (const item of items) {
    if (item.quantity <= 0) {
      throw new StockReservationError("Quantité invalide pour la réservation.");
    }

    const stocks = await tx.stock.findMany({
      where: {
        productId: item.productId,
        quantity: { gt: 0 },
        depot: { isActive: true },
      },
      orderBy: [{ quantity: "desc" }],
    });

    const available = stocks.reduce((total, stock) => total + stock.quantity, 0);

    if (available < item.quantity) {
      throw new StockReservationError(
        "Stock insuffisant pour un ou plusieurs produits.",
      );
    }

    let remaining = item.quantity;

    for (const stock of stocks) {
      if (remaining <= 0) break;

      const quantityToReserve = Math.min(stock.quantity, remaining);
      await decrementStock(tx, stock.id, quantityToReserve);
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          depotId: stock.depotId,
          type: StockMovementType.RESERVED,
          quantity: quantityToReserve,
          reference: orderNumber,
          reason: "Réservation commande site web",
        },
      });

      remaining -= quantityToReserve;
    }

    if (remaining > 0) {
      throw new StockReservationError(
        "Stock insuffisant pour finaliser la réservation.",
      );
    }
  }
}

async function decrementStock(tx: StockTx, stockId: string, quantity: number) {
  const updated = await tx.stock.updateMany({
    where: {
      id: stockId,
      quantity: { gte: quantity },
    },
    data: {
      quantity: { decrement: quantity },
    },
  });

  if (updated.count !== 1) {
    throw new Error("Stock insuffisant. Le stock ne peut pas devenir négatif.");
  }
}
