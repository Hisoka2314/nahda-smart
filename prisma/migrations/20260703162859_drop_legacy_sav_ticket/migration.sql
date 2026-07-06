/*
  Warnings:

  - You are about to drop the `SAVTicket` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SAVTicket" DROP CONSTRAINT "SAVTicket_customerId_fkey";

-- DropForeignKey
ALTER TABLE "SAVTicket" DROP CONSTRAINT "SAVTicket_productId_fkey";

-- DropForeignKey
ALTER TABLE "SAVTicket" DROP CONSTRAINT "SAVTicket_supplierId_fkey";

-- DropTable
DROP TABLE "SAVTicket";

-- DropEnum
DROP TYPE "SAVStatus";
