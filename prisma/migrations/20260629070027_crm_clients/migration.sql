-- CreateEnum
CREATE TYPE "CustomerRelationshipStatus" AS ENUM ('GOOD', 'NORMAL', 'LOYAL', 'VIP', 'WATCH', 'LATE_PAYER', 'DISPUTE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CustomerNoteType" AS ENUM ('INFORMATION', 'FOLLOW_UP', 'PAYMENT', 'DELIVERY', 'DISPUTE', 'SAV', 'COMMERCIAL');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "relationshipStatus" "CustomerRelationshipStatus" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "CustomerNote" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "authorId" TEXT,
    "type" "CustomerNoteType" NOT NULL DEFAULT 'INFORMATION',
    "content" TEXT NOT NULL,
    "private" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerNote_customerId_idx" ON "CustomerNote"("customerId");

-- CreateIndex
CREATE INDEX "CustomerNote_authorId_idx" ON "CustomerNote"("authorId");

-- CreateIndex
CREATE INDEX "CustomerNote_type_idx" ON "CustomerNote"("type");

-- CreateIndex
CREATE INDEX "CustomerNote_createdAt_idx" ON "CustomerNote"("createdAt");

-- CreateIndex
CREATE INDEX "Customer_relationshipStatus_idx" ON "Customer"("relationshipStatus");

-- AddForeignKey
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
