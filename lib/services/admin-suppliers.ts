import {
  AdminRole,
  Prisma,
  SupplierNoteType,
  SupplierPaymentMethod,
  SupplierPurchaseStatus,
  SupplierType,
} from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { logAdminEvent } from "@/lib/auth/admin-auth";
import {
  formatDateTime,
  formatMoney,
  getSupplierPurchaseStatusTone,
  supplierNoteTypeLabels,
  supplierDocumentTypeLabels,
  supplierPaymentMethodLabels,
  supplierPurchaseStatusLabels,
  supplierTypeLabels,
} from "@/lib/admin/labels";
import {
  toAdminPaginatedResult,
  type AdminPagination,
} from "@/lib/admin/pagination";
import { computeCmup } from "@/lib/cmup";
import { roundMoney } from "@/lib/utils";
import {
  isReceivedStatus,
  normalizePurchaseStatus,
} from "@/lib/services/supplier-purchase-status";
import {
  supplierTagLabels,
  type AdminSupplierInput,
  type AdminSupplierPurchaseInput,
} from "@/lib/validations/admin-suppliers";

export type AdminSupplierFilters = {
  q?: string;
  type?: SupplierType;
  city?: string;
  debt?: "with-debt";
  status?: "active" | "inactive";
};

const supplierListInclude = {
  purchases: {
    select: {
      id: true,
      total: true,
      paid: true,
      remaining: true,
      date: true,
      status: true,
    },
  },
} satisfies Prisma.SupplierInclude;

const supplierDetailInclude = {
  purchases: {
    include: {
      depot: { select: { name: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      },
      payments: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { date: "desc" },
  },
  payments: {
    include: { purchase: { select: { id: true, reference: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  },
  supplierNotes: {
    include: { author: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 40,
  },
} satisfies Prisma.SupplierInclude;

export async function getAdminSuppliersPage(
  filters: AdminSupplierFilters,
  pagination: AdminPagination,
) {
  const db = getPrismaClient();
  const where = buildSupplierWhere(filters);
  const [total, suppliers] = await Promise.all([
    db.supplier.count({ where }),
    db.supplier.findMany({
      where,
      include: supplierListInclude,
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  return toAdminPaginatedResult({
    items: suppliers.map(toSupplierListItem),
    total,
    page: pagination.page,
    perPage: pagination.perPage,
  });
}

export async function getAdminSupplierById(id: string) {
  const db = getPrismaClient();
  const supplier = await db.supplier.findUnique({
    where: { id },
    include: supplierDetailInclude,
  });

  return supplier ? toSupplierDetail(supplier) : null;
}

export async function getAdminSupplierFormData() {
  const db = getPrismaClient();
  const cities = await db.supplier.findMany({
    where: { city: { not: null } },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });

  return { cities: cities.map((item) => item.city).filter(Boolean) };
}

export async function getAdminSupplierPurchaseFormData(supplierId?: string) {
  const db = getPrismaClient();
  const [suppliers, depots, products] = await Promise.all([
    db.supplier.findMany({
      where: { isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
    db.depot.findMany({
      where: { isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
    db.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        priceBuy: true,
        priceSell: true,
        stocks: { select: { quantity: true } },
      },
      orderBy: { name: "asc" },
      take: 250,
    }),
  ]);

  return {
    selectedSupplierId: supplierId,
    suppliers: suppliers.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      typeLabel: supplierTypeLabels[supplier.type],
    })),
    depots: depots.map((depot) => ({
      id: depot.id,
      name: depot.name,
      type: depot.type,
    })),
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      priceBuy: Number(product.priceBuy),
      priceBuyLabel: formatMoney(Number(product.priceBuy)),
      priceSell: Number(product.priceSell),
      stockTotal: product.stocks.reduce((sum, stock) => sum + stock.quantity, 0),
    })),
  };
}

export async function createAdminSupplier({
  adminId,
  input,
}: {
  adminId: string;
  input: AdminSupplierInput;
}) {
  const db = getPrismaClient();
  const supplier = await db.supplier.create({
    data: supplierData(input),
    select: { id: true, name: true, type: true, isActive: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_SUPPLIER_CREATED",
    entity: "Supplier",
    entityId: supplier.id,
    metadata: { name: supplier.name, type: supplier.type },
  });

  return supplier;
}

export async function updateAdminSupplier({
  adminId,
  input,
}: {
  adminId: string;
  input: AdminSupplierInput & { id: string };
}) {
  const db = getPrismaClient();
  const supplier = await db.supplier.update({
    where: { id: input.id },
    data: supplierData(input),
    select: { id: true, name: true, type: true, isActive: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_SUPPLIER_UPDATED",
    entity: "Supplier",
    entityId: supplier.id,
    metadata: { name: supplier.name, type: supplier.type, isActive: supplier.isActive },
  });

  return supplier;
}

export async function addAdminSupplierNote({
  adminId,
  supplierId,
  type,
  content,
}: {
  adminId: string;
  supplierId: string;
  type: SupplierNoteType;
  content: string;
}) {
  const db = getPrismaClient();
  const note = await db.supplierNote.create({
    data: {
      supplierId,
      authorId: adminId,
      type,
      content,
      private: true,
    },
    select: { id: true, supplierId: true, type: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_SUPPLIER_NOTE_CREATED",
    entity: "Supplier",
    entityId: supplierId,
    metadata: { noteId: note.id, type: note.type },
  });

  return note;
}

export async function getAdminSupplierPurchasesPage(
  filters: { q?: string; status?: SupplierPurchaseStatus; supplierId?: string },
  pagination: AdminPagination,
) {
  const db = getPrismaClient();
  const where = buildPurchaseWhere(filters);
  const [total, purchases] = await Promise.all([
    db.supplierPurchase.count({ where }),
    db.supplierPurchase.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, type: true } },
        depot: { select: { name: true } },
        items: { select: { id: true, quantity: true } },
      },
      orderBy: { date: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  return toAdminPaginatedResult({
    items: purchases.map(toPurchaseListItem),
    total,
    page: pagination.page,
    perPage: pagination.perPage,
  });
}

export async function getAdminSupplierPurchaseById(id: string) {
  const db = getPrismaClient();
  const purchase = await db.supplierPurchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      depot: true,
      createdBy: { select: { name: true, email: true } },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              priceBuy: true,
              averageCost: true,
              priceSell: true,
            },
          },
        },
      },
      payments: {
        include: { createdBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return purchase ? toPurchaseDetail(purchase) : null;
}

export async function createAdminSupplierPurchase({
  adminId,
  adminRole,
  input,
}: {
  adminId: string;
  adminRole: AdminRole;
  input: AdminSupplierPurchaseInput;
}) {
  const db = getPrismaClient();
  const canUpdateProductPrice = canManageSupplierMoney(adminRole);

  return db.$transaction(async (tx) => {
    const productIds = input.items.map((item) => item.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, priceSell: true },
    });

    if (products.length !== productIds.length) {
      throw new Error("Produit achat introuvable.");
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const itemTotal = roundMoney(
      input.items.reduce(
        (sum, item) => sum + roundMoney(item.quantity * item.unitBuyPrice),
        0,
      ),
    );
    const total = roundMoney(
      itemTotal + input.transportFee + input.customsFee + input.otherFee,
    );
    // Seuls les roles autorises a gerer l'argent fournisseur peuvent
    // enregistrer un paiement a la creation : sinon le STOCK_MANAGER
    // contournerait la restriction de l'action "ajouter un paiement".
    const paid = canManageSupplierMoney(adminRole) ? roundMoney(input.paid) : 0;
    const remaining = roundMoney(total - paid);
    const status = normalizePurchaseStatus(input.status, paid, total);
    const shouldReceive = isReceivedStatus(status);

    const purchase = await tx.supplierPurchase.create({
      data: {
        supplierId: input.supplierId,
        depotId: input.depotId,
        reference: input.reference,
        documentType: input.documentType,
        status,
        total,
        paid,
        remaining,
        transportFee: input.transportFee,
        customsFee: input.customsFee,
        otherFee: input.otherFee,
        date: input.date,
        receivedAt: shouldReceive ? new Date() : undefined,
        notes: input.notes,
        createdById: adminId,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitBuyPrice: item.unitBuyPrice,
            total: roundMoney(item.quantity * item.unitBuyPrice),
          })),
        },
      },
      select: { id: true, supplierId: true, status: true, total: true },
    });

    if (paid > 0) {
      await tx.supplierPayment.create({
        data: {
          supplierId: input.supplierId,
          purchaseId: purchase.id,
          amount: paid,
          method: input.paymentMethod,
          note: "Paiement enregistre lors de la creation achat.",
          createdById: adminId,
        },
      });
    }

    if (shouldReceive) {
      for (const item of input.items) {
        // CMUP d'abord (il se base sur le stock d'avant reception).
        await applyCmupForReception({
          tx,
          productId: item.productId,
          quantity: item.quantity,
          unitBuyPrice: item.unitBuyPrice,
        });
        await applyIncomingStock({
          tx,
          productId: item.productId,
          depotId: input.depotId,
          quantity: item.quantity,
          reference: input.reference ?? purchase.id,
          adminId,
          reason: "Achat fournisseur recu",
        });

        if (item.updateProductPrice && canUpdateProductPrice) {
          const product = productMap.get(item.productId);
          if (product) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                priceBuy: item.unitBuyPrice,
                margin: Number(product.priceSell) - item.unitBuyPrice,
              },
            });
          }
        }
      }
    }

    await tx.adminLog.create({
      data: {
        adminId,
        action: "ADMIN_SUPPLIER_PURCHASE_CREATED",
        entity: "SupplierPurchase",
        entityId: purchase.id,
        metadata: {
          supplierId: input.supplierId,
          depotId: input.depotId,
          status,
          total,
          paid,
          itemCount: input.items.length,
          stockReceived: shouldReceive,
        },
      },
    });

    return purchase;
  });
}

export async function receiveAdminSupplierPurchase({
  adminId,
  purchaseId,
}: {
  adminId: string;
  purchaseId: string;
}) {
  const db = getPrismaClient();

  return db.$transaction(async (tx) => {
    const purchase = await tx.supplierPurchase.findUnique({
      where: { id: purchaseId },
      include: { items: true },
    });

    if (!purchase || !purchase.depotId) throw new Error("Achat introuvable.");
    if (purchase.status !== "DRAFT") {
      throw new Error("Seuls les achats brouillons peuvent etre recus ici.");
    }

    const status = normalizePurchaseStatus(
      "RECEIVED",
      Number(purchase.paid),
      Number(purchase.total),
    );

    // Verrou optimiste pose AVANT toute ecriture de stock : on revendique la
    // transition DRAFT -> RECEIVED. Si un autre appel (double clic, second
    // admin) l'a deja prise, count vaut 0 et la transaction est annulee. Sans
    // cette garde, les deux appels passaient le test de statut ci-dessus et
    // le stock etait incremente deux fois, avec un CMUP recalcule deux fois.
    const claimed = await tx.supplierPurchase.updateMany({
      where: { id: purchase.id, status: "DRAFT" },
      data: { status, receivedAt: new Date() },
    });

    if (claimed.count !== 1) {
      throw new Error(
        "Cet achat vient d'etre receptionne par un autre utilisateur. Rechargez la page.",
      );
    }

    for (const item of purchase.items) {
      // CMUP d'abord (il se base sur le stock d'avant reception).
      await applyCmupForReception({
        tx,
        productId: item.productId,
        quantity: item.quantity,
        unitBuyPrice: Number(item.unitBuyPrice),
      });
      await applyIncomingStock({
        tx,
        productId: item.productId,
        depotId: purchase.depotId,
        quantity: item.quantity,
        reference: purchase.reference ?? purchase.id,
        adminId,
        reason: "Validation achat fournisseur",
      });
    }

    const updated = {
      id: purchase.id,
      supplierId: purchase.supplierId,
      status,
    };

    await tx.adminLog.create({
      data: {
        adminId,
        action: "ADMIN_SUPPLIER_PURCHASE_RECEIVED",
        entity: "SupplierPurchase",
        entityId: purchase.id,
        metadata: { supplierId: purchase.supplierId, status },
      },
    });

    return updated;
  });
}

export async function addAdminSupplierPayment({
  adminId,
  purchaseId,
  amount,
  method,
  note,
}: {
  adminId: string;
  purchaseId: string;
  amount: number;
  method: SupplierPaymentMethod;
  note?: string;
}) {
  const db = getPrismaClient();

  return db.$transaction(async (tx) => {
    const purchase = await tx.supplierPurchase.findUnique({
      where: { id: purchaseId },
      select: {
        id: true,
        supplierId: true,
        total: true,
        paid: true,
        status: true,
      },
    });

    if (!purchase || purchase.status === "CANCELLED") {
      throw new Error("Achat fournisseur introuvable.");
    }

    const total = roundMoney(Number(purchase.total));
    const currentPaid = roundMoney(Number(purchase.paid));
    const nextPaid = roundMoney(currentPaid + amount);
    if (amount <= 0 || nextPaid > total) {
      throw new Error("Montant paiement invalide.");
    }

    const remaining = roundMoney(total - nextPaid);
    const status = normalizePurchaseStatus(purchase.status, nextPaid, total);

    await tx.supplierPayment.create({
      data: {
        supplierId: purchase.supplierId,
        purchaseId: purchase.id,
        amount,
        method,
        note,
        createdById: adminId,
      },
    });

    // Verrou optimiste sur le montant lu : deux paiements simultanes lisaient
    // le meme "paid" et le second ecrasait le premier, faisant disparaitre un
    // reglement du solde fournisseur alors que sa ligne SupplierPayment
    // existait bien. On n'ecrit que si "paid" n'a pas bouge entre-temps.
    const claimed = await tx.supplierPurchase.updateMany({
      where: { id: purchase.id, paid: purchase.paid },
      data: { paid: nextPaid, remaining, status },
    });

    if (claimed.count !== 1) {
      throw new Error(
        "Un autre paiement vient d'etre enregistre sur cet achat. Rechargez la page.",
      );
    }

    const updated = {
      id: purchase.id,
      supplierId: purchase.supplierId,
      paid: nextPaid,
      remaining,
      status,
    };

    await tx.adminLog.create({
      data: {
        adminId,
        action: "ADMIN_SUPPLIER_PAYMENT_ADDED",
        entity: "SupplierPurchase",
        entityId: purchase.id,
        metadata: { supplierId: purchase.supplierId, amount, status },
      },
    });

    return updated;
  });
}

export async function cancelAdminSupplierPurchase({
  adminId,
  purchaseId,
}: {
  adminId: string;
  purchaseId: string;
}) {
  const db = getPrismaClient();

  return db.$transaction(async (tx) => {
    const purchase = await tx.supplierPurchase.findUnique({
      where: { id: purchaseId },
      select: { id: true, supplierId: true, status: true, paid: true },
    });

    if (!purchase || purchase.status !== "DRAFT" || Number(purchase.paid) > 0) {
      throw new Error("Seul un achat brouillon sans paiement peut etre annule.");
    }

    // Meme verrou : l'achat ne doit etre annule que s'il est toujours
    // brouillon et sans reglement au moment de l'ecriture.
    const claimed = await tx.supplierPurchase.updateMany({
      where: { id: purchase.id, status: "DRAFT", paid: purchase.paid },
      data: { status: "CANCELLED" },
    });

    if (claimed.count !== 1) {
      throw new Error(
        "Cet achat vient d'etre modifie par un autre utilisateur. Rechargez la page.",
      );
    }

    const updated = {
      id: purchase.id,
      supplierId: purchase.supplierId,
      status: "CANCELLED" as const,
    };

    await tx.adminLog.create({
      data: {
        adminId,
        action: "ADMIN_SUPPLIER_PURCHASE_CANCELLED",
        entity: "SupplierPurchase",
        entityId: purchase.id,
        metadata: { supplierId: purchase.supplierId },
      },
    });

    return updated;
  });
}

function supplierData(input: AdminSupplierInput): Prisma.SupplierUncheckedCreateInput {
  return {
    name: input.name,
    phone: cleanOptional(input.phone),
    email: cleanOptional(input.email),
    city: cleanOptional(input.city),
    address: cleanOptional(input.address),
    type: input.type,
    notes: cleanOptional(input.notes),
    tags: input.tags,
    isActive: input.isActive,
  };
}

function toSupplierListItem(
  supplier: Prisma.SupplierGetPayload<{ include: typeof supplierListInclude }>,
) {
  const totals = supplier.purchases.reduce(
    (sum, purchase) => ({
      total: sum.total + Number(purchase.total),
      paid: sum.paid + Number(purchase.paid),
      remaining: sum.remaining + Number(purchase.remaining),
    }),
    { total: 0, paid: 0, remaining: 0 },
  );
  const lastPurchase = supplier.purchases
    .slice()
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

  return {
    id: supplier.id,
    reference: supplier.reference,
    name: supplier.name,
    phone: supplier.phone ?? "-",
    email: supplier.email ?? "",
    city: supplier.city ?? "-",
    type: supplier.type,
    typeLabel: supplierTypeLabels[supplier.type],
    isActive: supplier.isActive,
    tags: supplier.tags,
    tagLabels: supplier.tags.map((tag) => supplierTagLabels[tag as keyof typeof supplierTagLabels] ?? tag),
    purchaseCount: supplier.purchases.length,
    totalPurchases: totals.total,
    totalPurchasesLabel: formatMoney(totals.total),
    totalPaidLabel: formatMoney(totals.paid),
    remaining: totals.remaining,
    remainingLabel: formatMoney(totals.remaining),
    lastPurchaseAt: lastPurchase ? formatDateTime(lastPurchase.date) : "-",
    createdAt: formatDateTime(supplier.createdAt),
    updatedAt: formatDateTime(supplier.updatedAt),
  };
}

function toSupplierDetail(
  supplier: Prisma.SupplierGetPayload<{ include: typeof supplierDetailInclude }>,
) {
  const base = toSupplierListItem(supplier);
  const productMap = new Map<
    string,
    { id: string; name: string; sku: string; quantity: number; total: number; lastUnitBuyPrice: number }
  >();

  supplier.purchases.forEach((purchase) => {
    purchase.items.forEach((item) => {
      const current = productMap.get(item.productId);
      productMap.set(item.productId, {
        id: item.productId,
        name: item.product.name,
        sku: item.product.sku,
        quantity: (current?.quantity ?? 0) + item.quantity,
        total: (current?.total ?? 0) + Number(item.total),
        // Les achats sont tries par date decroissante : la premiere
        // occurrence rencontree est bien le dernier prix d'achat.
        lastUnitBuyPrice: current?.lastUnitBuyPrice ?? Number(item.unitBuyPrice),
      });
    });
  });

  return {
    ...base,
    address: supplier.address ?? "",
    notes: supplier.notes ?? "",
    productsBought: Array.from(productMap.values()).map((product) => ({
      ...product,
      totalLabel: formatMoney(product.total),
      lastUnitBuyPriceLabel: formatMoney(product.lastUnitBuyPrice),
    })),
    purchases: supplier.purchases.map((purchase) => ({
      id: purchase.id,
      reference: purchase.reference ?? "-",
      status: purchase.status,
      statusLabel: supplierPurchaseStatusLabels[purchase.status],
      statusTone: getSupplierPurchaseStatusTone(purchase.status),
    documentType: purchase.documentType,
    documentTypeLabel: supplierDocumentTypeLabels[purchase.documentType],
      depotName: purchase.depot?.name ?? "-",
      totalLabel: formatMoney(Number(purchase.total)),
      paidLabel: formatMoney(Number(purchase.paid)),
      remainingLabel: formatMoney(Number(purchase.remaining)),
      itemCount: purchase.items.length,
      date: formatDateTime(purchase.date),
    })),
    payments: supplier.payments.map((payment) => ({
      id: payment.id,
      purchaseReference: payment.purchase.reference ?? payment.purchaseId,
      amountLabel: formatMoney(Number(payment.amount)),
      method: supplierPaymentMethodLabels[payment.method],
      note: payment.note ?? "",
      createdAt: formatDateTime(payment.createdAt),
    })),
    supplierNotes: supplier.supplierNotes.map((note) => ({
      id: note.id,
      type: note.type,
      typeLabel: supplierNoteTypeLabels[note.type],
      content: note.content,
      author: note.author?.name ?? "Admin",
      createdAt: formatDateTime(note.createdAt),
    })),
  };
}

function toPurchaseListItem(
  purchase: Prisma.SupplierPurchaseGetPayload<{
    include: {
      supplier: { select: { id: true; name: true; type: true } };
      depot: { select: { name: true } };
      items: { select: { id: true; quantity: true } };
    };
  }>,
) {
  return {
    id: purchase.id,
    supplierId: purchase.supplierId,
    supplierName: purchase.supplier.name,
    supplierTypeLabel: supplierTypeLabels[purchase.supplier.type],
    reference: purchase.reference ?? "-",
    status: purchase.status,
    statusLabel: supplierPurchaseStatusLabels[purchase.status],
    statusTone: getSupplierPurchaseStatusTone(purchase.status),
    documentType: purchase.documentType,
    documentTypeLabel: supplierDocumentTypeLabels[purchase.documentType],
    depotName: purchase.depot?.name ?? "-",
    itemCount: purchase.items.length,
    quantityTotal: purchase.items.reduce((sum, item) => sum + item.quantity, 0),
    totalLabel: formatMoney(Number(purchase.total)),
    paidLabel: formatMoney(Number(purchase.paid)),
    remaining: Number(purchase.remaining),
    remainingLabel: formatMoney(Number(purchase.remaining)),
    date: formatDateTime(purchase.date),
  };
}

function toPurchaseDetail(
  purchase: Prisma.SupplierPurchaseGetPayload<{
    include: {
      supplier: true;
      depot: true;
      createdBy: { select: { name: true; email: true } };
      items: {
        include: {
          product: {
            select: {
              id: true;
              name: true;
              sku: true;
              priceBuy: true;
              averageCost: true;
              priceSell: true;
            };
          };
        };
      };
      payments: {
        include: { createdBy: { select: { name: true } } };
      };
    };
  }>,
) {
  return {
    id: purchase.id,
    supplierId: purchase.supplierId,
    supplierName: purchase.supplier.name,
    supplierTypeLabel: supplierTypeLabels[purchase.supplier.type],
    reference: purchase.reference ?? "-",
    status: purchase.status,
    statusLabel: supplierPurchaseStatusLabels[purchase.status],
    statusTone: getSupplierPurchaseStatusTone(purchase.status),
    documentType: purchase.documentType,
    documentTypeLabel: supplierDocumentTypeLabels[purchase.documentType],
    depotName: purchase.depot?.name ?? "-",
    total: Number(purchase.total),
    totalLabel: formatMoney(Number(purchase.total)),
    paidLabel: formatMoney(Number(purchase.paid)),
    remaining: Number(purchase.remaining),
    remainingLabel: formatMoney(Number(purchase.remaining)),
    transportFeeLabel: formatMoney(Number(purchase.transportFee)),
    customsFeeLabel: formatMoney(Number(purchase.customsFee)),
    otherFeeLabel: formatMoney(Number(purchase.otherFee)),
    date: formatDateTime(purchase.date),
    receivedAt: purchase.receivedAt ? formatDateTime(purchase.receivedAt) : "",
    createdBy: purchase.createdBy?.name ?? "-",
    notes: purchase.notes ?? "",
    quantityTotal: purchase.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    ),
    items: purchase.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productSku: item.product.sku,
      quantity: item.quantity,
      unitBuyPrice: Number(item.unitBuyPrice),
      unitBuyPriceLabel: formatMoney(Number(item.unitBuyPrice)),
      currentBuyPriceLabel: formatMoney(Number(item.product.priceBuy)),
      currentAverageCostLabel: formatMoney(
        Number(item.product.averageCost ?? item.product.priceBuy),
      ),
      totalLabel: formatMoney(Number(item.total)),
    })),
    payments: purchase.payments.map((payment) => ({
      id: payment.id,
      amountLabel: formatMoney(Number(payment.amount)),
      method: supplierPaymentMethodLabels[payment.method],
      note: payment.note ?? "",
      createdBy: payment.createdBy?.name ?? "-",
      createdAt: formatDateTime(payment.createdAt),
    })),
  };
}

function buildSupplierWhere(filters: AdminSupplierFilters): Prisma.SupplierWhereInput {
  const where: Prisma.SupplierWhereInput = {};
  const q = filters.q?.trim();

  if (filters.type) where.type = filters.type;
  if (filters.city) where.city = { contains: filters.city, mode: "insensitive" };
  if (filters.status === "active") where.isActive = true;
  if (filters.status === "inactive") where.isActive = false;
  if (filters.debt === "with-debt") {
    where.purchases = { some: { remaining: { gt: 0 }, status: { not: "CANCELLED" } } };
  }
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildPurchaseWhere(filters: {
  q?: string;
  status?: SupplierPurchaseStatus;
  supplierId?: string;
}): Prisma.SupplierPurchaseWhereInput {
  const where: Prisma.SupplierPurchaseWhereInput = {};
  const q = filters.q?.trim();

  if (filters.status) where.status = filters.status;
  if (filters.supplierId) where.supplierId = filters.supplierId;
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { supplier: { name: { contains: q, mode: "insensitive" } } },
      { items: { some: { product: { sku: { contains: q, mode: "insensitive" } } } } },
      { items: { some: { product: { name: { contains: q, mode: "insensitive" } } } } },
    ];
  }

  return where;
}

// Recalcule le CMUP du produit pour une reception : a appeler AVANT
// l'increment de stock (le calcul utilise le stock d'avant reception).
async function applyCmupForReception({
  tx,
  productId,
  quantity,
  unitBuyPrice,
}: {
  tx: Prisma.TransactionClient;
  productId: string;
  quantity: number;
  unitBuyPrice: number;
}) {
  const [stockAggregate, product] = await Promise.all([
    tx.stock.aggregate({
      where: { productId, depot: { isActive: true } },
      _sum: { quantity: true },
    }),
    tx.product.findUnique({
      where: { id: productId },
      select: { averageCost: true, priceBuy: true },
    }),
  ]);

  if (!product) return;

  const currentCmup =
    product.averageCost !== null
      ? Number(product.averageCost)
      : Number(product.priceBuy) || null;
  const nextCmup = computeCmup({
    stockBefore: stockAggregate._sum.quantity ?? 0,
    currentCmup,
    receivedQuantity: quantity,
    unitPrice: unitBuyPrice,
  });

  await tx.product.update({
    where: { id: productId },
    data: { averageCost: nextCmup },
  });
}

async function applyIncomingStock({
  tx,
  productId,
  depotId,
  quantity,
  reference,
  adminId,
  reason,
}: {
  tx: Prisma.TransactionClient;
  productId: string;
  depotId: string;
  quantity: number;
  reference: string;
  adminId: string;
  reason: string;
}) {
  // Increment atomique : un read-modify-write perdrait des mises a jour si
  // deux receptions du meme produit arrivent en parallele.
  const updated = await tx.stock.updateMany({
    where: { productId, depotId },
    data: { quantity: { increment: quantity } },
  });

  if (updated.count === 0) {
    await tx.stock.create({
      data: { productId, depotId, quantity },
    });
  }

  await tx.stockMovement.create({
    data: {
      productId,
      depotId,
      type: "IN",
      quantity,
      reason,
      reference,
      createdById: adminId,
    },
  });
}

function canManageSupplierMoney(role: AdminRole) {
  return role === "SUPER_ADMIN" || role === "MANAGER" || role === "ACCOUNTANT";
}

function cleanOptional(value?: string | null) {
  const text = value?.trim();
  return text ? text : undefined;
}
