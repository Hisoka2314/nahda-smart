-- CreateEnum
CREATE TYPE "SupplierDocumentType" AS ENUM ('INVOICE', 'QUOTE', 'PURCHASE_ORDER');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "averageCost" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "SupplierPurchase" ADD COLUMN     "documentType" "SupplierDocumentType" NOT NULL DEFAULT 'INVOICE';
