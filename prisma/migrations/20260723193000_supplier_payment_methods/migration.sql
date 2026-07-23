CREATE TYPE "SupplierPaymentMethod" AS ENUM (
  'CASH',
  'BANK_TRANSFER',
  'CHEQUE',
  'BANK_CARD',
  'MOBILE_PAYMENT',
  'BILL_OF_EXCHANGE',
  'DIRECT_DEBIT',
  'OTHER'
);

ALTER TABLE "SupplierPayment"
ALTER COLUMN "method" TYPE "SupplierPaymentMethod"
USING (
  CASE
    WHEN "method" IS NULL OR BTRIM("method") = '' THEN 'CASH'
    WHEN LOWER("method") LIKE '%virement%' THEN 'BANK_TRANSFER'
    WHEN LOWER("method") LIKE '%cheq%' THEN 'CHEQUE'
    WHEN LOWER("method") LIKE '%carte%' THEN 'BANK_CARD'
    WHEN LOWER("method") LIKE '%mobile%' THEN 'MOBILE_PAYMENT'
    WHEN LOWER("method") LIKE '%effet%' THEN 'BILL_OF_EXCHANGE'
    WHEN LOWER("method") LIKE '%prelev%' THEN 'DIRECT_DEBIT'
    WHEN LOWER("method") LIKE '%espece%' OR LOWER("method") = 'initial' THEN 'CASH'
    ELSE 'OTHER'
  END
)::"SupplierPaymentMethod";

ALTER TABLE "SupplierPayment"
ALTER COLUMN "method" SET NOT NULL,
ALTER COLUMN "method" SET DEFAULT 'CASH';
