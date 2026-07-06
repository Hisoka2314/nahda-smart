-- CreateEnum
CREATE TYPE "ServiceTicketType" AS ENUM ('RETURN', 'REPAIR', 'EXCHANGE', 'WARRANTY_CLAIM', 'TECH_SUPPORT');

-- CreateEnum
CREATE TYPE "ServiceTicketStatus" AS ENUM ('NEW', 'IN_REVIEW', 'DIAGNOSIS_DONE', 'IN_PROGRESS', 'WAITING_PARTS', 'REPAIRED', 'REPLACED', 'REFUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ServiceTicketUrgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ServiceTicketNoteType" AS ENUM ('INTERNAL', 'TECHNICAL', 'CLIENT', 'PARTS', 'RESOLUTION');

-- CreateTable
CREATE TABLE "ServiceTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "productId" TEXT,
    "supplierId" TEXT,
    "type" "ServiceTicketType" NOT NULL,
    "urgency" "ServiceTicketUrgency" NOT NULL DEFAULT 'MEDIUM',
    "status" "ServiceTicketStatus" NOT NULL DEFAULT 'NEW',
    "problem" TEXT NOT NULL,
    "internalNotes" TEXT,
    "createdById" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTicketNote" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT,
    "type" "ServiceTicketNoteType" NOT NULL DEFAULT 'INTERNAL',
    "content" TEXT NOT NULL,
    "private" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceTicketNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTicketStatusHistory" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "status" "ServiceTicketStatus" NOT NULL,
    "note" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceTicketStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTicket_ticketNumber_key" ON "ServiceTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "ServiceTicket_ticketNumber_idx" ON "ServiceTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "ServiceTicket_customerId_idx" ON "ServiceTicket"("customerId");

-- CreateIndex
CREATE INDEX "ServiceTicket_orderId_idx" ON "ServiceTicket"("orderId");

-- CreateIndex
CREATE INDEX "ServiceTicket_productId_idx" ON "ServiceTicket"("productId");

-- CreateIndex
CREATE INDEX "ServiceTicket_supplierId_idx" ON "ServiceTicket"("supplierId");

-- CreateIndex
CREATE INDEX "ServiceTicket_type_idx" ON "ServiceTicket"("type");

-- CreateIndex
CREATE INDEX "ServiceTicket_urgency_idx" ON "ServiceTicket"("urgency");

-- CreateIndex
CREATE INDEX "ServiceTicket_status_idx" ON "ServiceTicket"("status");

-- CreateIndex
CREATE INDEX "ServiceTicket_createdById_idx" ON "ServiceTicket"("createdById");

-- CreateIndex
CREATE INDEX "ServiceTicket_createdAt_idx" ON "ServiceTicket"("createdAt");

-- CreateIndex
CREATE INDEX "ServiceTicketNote_ticketId_idx" ON "ServiceTicketNote"("ticketId");

-- CreateIndex
CREATE INDEX "ServiceTicketNote_authorId_idx" ON "ServiceTicketNote"("authorId");

-- CreateIndex
CREATE INDEX "ServiceTicketNote_type_idx" ON "ServiceTicketNote"("type");

-- CreateIndex
CREATE INDEX "ServiceTicketNote_createdAt_idx" ON "ServiceTicketNote"("createdAt");

-- CreateIndex
CREATE INDEX "ServiceTicketStatusHistory_ticketId_idx" ON "ServiceTicketStatusHistory"("ticketId");

-- CreateIndex
CREATE INDEX "ServiceTicketStatusHistory_status_idx" ON "ServiceTicketStatusHistory"("status");

-- CreateIndex
CREATE INDEX "ServiceTicketStatusHistory_changedById_idx" ON "ServiceTicketStatusHistory"("changedById");

-- CreateIndex
CREATE INDEX "ServiceTicketStatusHistory_createdAt_idx" ON "ServiceTicketStatusHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicketNote" ADD CONSTRAINT "ServiceTicketNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicketNote" ADD CONSTRAINT "ServiceTicketNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicketStatusHistory" ADD CONSTRAINT "ServiceTicketStatusHistory_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicketStatusHistory" ADD CONSTRAINT "ServiceTicketStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
