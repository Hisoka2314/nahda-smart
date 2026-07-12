// Cout Moyen Unitaire Pondere (CMUP), methode standard de valorisation :
// CMUP = (stock avant reception x CMUP actuel + quantite recue x prix unitaire)
//        / (stock avant reception + quantite recue)

export function computeCmup({
  stockBefore,
  currentCmup,
  receivedQuantity,
  unitPrice,
}: {
  stockBefore: number;
  currentCmup: number | null;
  receivedQuantity: number;
  unitPrice: number;
}): number {
  if (receivedQuantity <= 0) {
    throw new Error("La quantité reçue doit être positive.");
  }

  // Pas de stock existant (ou pas de CMUP connu) : le CMUP repart
  // du prix de cette réception.
  const safeStock = Math.max(0, stockBefore);

  if (safeStock === 0 || currentCmup === null || currentCmup <= 0) {
    return roundMoney(unitPrice);
  }

  const totalValue = safeStock * currentCmup + receivedQuantity * unitPrice;
  const totalQuantity = safeStock + receivedQuantity;

  return roundMoney(totalValue / totalQuantity);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
