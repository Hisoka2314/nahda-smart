-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContactMessageStatus" ADD VALUE 'NO_ANSWER';
ALTER TYPE "ContactMessageStatus" ADD VALUE 'CALLBACK';
ALTER TYPE "ContactMessageStatus" ADD VALUE 'CONVERTED';
ALTER TYPE "ContactMessageStatus" ADD VALUE 'LOST';

-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN     "callAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "callbackAt" TIMESTAMP(3),
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "internalNote" TEXT,
ADD COLUMN     "lastContactAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "facebookUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "instagramUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "mapsUrl" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "addressSecondary" SET DEFAULT '';

-- CreateIndex
CREATE INDEX "ContactMessage_callbackAt_idx" ON "ContactMessage"("callbackAt");

-- CreateIndex
CREATE INDEX "ContactMessage_customerId_idx" ON "ContactMessage"("customerId");

-- AddForeignKey
ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
