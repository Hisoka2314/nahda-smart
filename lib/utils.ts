export function cn(
  ...inputs: Array<string | false | null | undefined>
): string {
  return inputs.filter(Boolean).join(" ");
}

// Les montants sont manipules en Number (float) avant d'etre persistes en
// Decimal : arrondir a 2 decimales a chaque etape de calcul evite les derives
// d'arrondi flottant (ex. un paiement final refuse pour un ecart de 1e-13).
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatMad(amount: number): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("MAD", "DH");
}
