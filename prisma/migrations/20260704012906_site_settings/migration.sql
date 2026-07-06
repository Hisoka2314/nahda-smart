-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "companyName" TEXT NOT NULL DEFAULT 'Nahda Smart',
    "email" TEXT NOT NULL DEFAULT 'contact@nahdasmart.ma',
    "phone" TEXT NOT NULL DEFAULT '0800 123 456',
    "whatsapp" TEXT NOT NULL DEFAULT '212600000000',
    "addressPrimary" TEXT NOT NULL DEFAULT 'Casablanca, Maarif',
    "addressSecondary" TEXT NOT NULL DEFAULT 'Rabat, Agdal',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);
