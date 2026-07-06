-- CreateEnum
CREATE TYPE "SupplierPurchaseStatus" AS ENUM ('DRAFT', 'RECEIVED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SupplierNoteType" AS ENUM ('INFORMATION', 'PAYMENT', 'DELIVERY', 'QUALITY', 'SAV', 'COMMERCIAL', 'DISPUTE');

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "SupplierPurchase" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "customsFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "depotId" TEXT,
ADD COLUMN     "otherFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "receivedAt" TIMESTAMP(3),
ADD COLUMN     "status" "SupplierPurchaseStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "transportFee" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SupplierPayment" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierNote" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "authorId" TEXT,
    "type" "SupplierNoteType" NOT NULL DEFAULT 'INFORMATION',
    "content" TEXT NOT NULL,
    "private" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplierPayment_supplierId_idx" ON "SupplierPayment"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierPayment_purchaseId_idx" ON "SupplierPayment"("purchaseId");

-- CreateIndex
CREATE INDEX "SupplierPayment_createdById_idx" ON "SupplierPayment"("createdById");

-- CreateIndex
CREATE INDEX "SupplierPayment_createdAt_idx" ON "SupplierPayment"("createdAt");

-- CreateIndex
CREATE INDEX "SupplierNote_supplierId_idx" ON "SupplierNote"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierNote_authorId_idx" ON "SupplierNote"("authorId");

-- CreateIndex
CREATE INDEX "SupplierNote_type_idx" ON "SupplierNote"("type");

-- CreateIndex
CREATE INDEX "SupplierNote_createdAt_idx" ON "SupplierNote"("createdAt");

-- CreateIndex
CREATE INDEX "Supplier_city_idx" ON "Supplier"("city");

-- CreateIndex
CREATE INDEX "Supplier_isActive_idx" ON "Supplier"("isActive");

-- CreateIndex
CREATE INDEX "SupplierPurchase_depotId_idx" ON "SupplierPurchase"("depotId");

-- CreateIndex
CREATE INDEX "SupplierPurchase_status_idx" ON "SupplierPurchase"("status");

-- CreateIndex
CREATE INDEX "SupplierPurchase_createdById_idx" ON "SupplierPurchase"("createdById");

-- AddForeignKey
ALTER TABLE "SupplierPurchase" ADD CONSTRAINT "SupplierPurchase_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPurchase" ADD CONSTRAINT "SupplierPurchase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "SupplierPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierNote" ADD CONSTRAINT "SupplierNote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierNote" ADD CONSTRAINT "SupplierNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
