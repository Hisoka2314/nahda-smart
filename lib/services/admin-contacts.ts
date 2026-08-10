import { ContactMessageStatus, Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { logAdminEvent } from "@/lib/auth/admin-auth";
import {
  contactStatusLabels,
  formatDateTime,
} from "@/lib/admin/labels";
import {
  toAdminPaginatedResult,
  type AdminPagination,
} from "@/lib/admin/pagination";
import { adminContactFiltersSchema } from "@/lib/validations/admin";

export type AdminContactListItem = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  shortMessage: string;
  status: ContactMessageStatus;
  statusLabel: string;
  callAttempts: number;
  callbackAt: string | null;
  lastContactAt: string | null;
  internalNote: string;
  customerId: string | null;
};

type AdminContactFilters = {
  q?: string;
  status?: ContactMessageStatus;
};

export async function getAdminContacts(rawFilters: AdminContactFilters = {}) {
  const filters = adminContactFiltersSchema.parse(rawFilters);
  const db = getPrismaClient();
  const contacts = await db.contactMessage.findMany({
    where: buildContactWhere(filters),
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return contacts.map(toAdminContactListItem);
}

// Idem commandes et devis : les leads plus anciens que les 50 derniers
// sortaient purement et simplement du back-office.
export async function getAdminContactsPage(
  rawFilters: AdminContactFilters = {},
  pagination: AdminPagination,
) {
  const filters = adminContactFiltersSchema.parse(rawFilters);
  const db = getPrismaClient();
  const where = buildContactWhere(filters);
  const [total, contacts] = await Promise.all([
    db.contactMessage.count({ where }),
    db.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  return toAdminPaginatedResult({
    items: contacts.map(toAdminContactListItem),
    total,
    page: pagination.page,
    perPage: pagination.perPage,
  });
}

function toAdminContactListItem(
  contact: Prisma.ContactMessageGetPayload<object>,
): AdminContactListItem {
  const message = contact.message.trim();

  return {
    id: contact.id,
    createdAt: formatDateTime(contact.createdAt),
    name: contact.name,
    phone: contact.phone,
    email: contact.email ?? undefined,
    subject: contact.subject,
    message,
    shortMessage: message.length > 130 ? `${message.slice(0, 130)}...` : message,
    status: contact.status,
    statusLabel: contactStatusLabels[contact.status],
    callAttempts: contact.callAttempts,
    callbackAt: contact.callbackAt ? formatDateTime(contact.callbackAt) : null,
    lastContactAt: contact.lastContactAt
      ? formatDateTime(contact.lastContactAt)
      : null,
    internalNote: contact.internalNote ?? "",
    customerId: contact.customerId,
  };
}

export async function updateAdminContactStatus({
  adminId,
  contactId,
  status,
}: {
  adminId: string;
  contactId: string;
  status: ContactMessageStatus;
}) {
  const db = getPrismaClient();
  const contact = await db.contactMessage.update({
    where: { id: contactId },
    data: { status },
    select: { id: true, subject: true, status: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_CONTACT_STATUS_UPDATED",
    entity: "ContactMessage",
    entityId: contact.id,
    metadata: {
      subject: contact.subject,
      nextStatus: contact.status,
    },
  });

  return contact;
}

// Tentative d'appel sans réponse : incrémente le compteur et repasse le lead
// dans la file "pas de réponse" pour relance.
export async function registerContactCallAttempt({
  adminId,
  contactId,
}: {
  adminId: string;
  contactId: string;
}) {
  const db = getPrismaClient();
  const contact = await db.contactMessage.update({
    where: { id: contactId },
    data: {
      status: ContactMessageStatus.NO_ANSWER,
      callAttempts: { increment: 1 },
      lastContactAt: new Date(),
    },
    select: { id: true, callAttempts: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_LEAD_NO_ANSWER",
    entity: "ContactMessage",
    entityId: contact.id,
    metadata: { callAttempts: contact.callAttempts },
  });

  return contact;
}

export async function scheduleContactCallback({
  adminId,
  contactId,
  callbackAt,
}: {
  adminId: string;
  contactId: string;
  callbackAt: Date;
}) {
  const db = getPrismaClient();
  const contact = await db.contactMessage.update({
    where: { id: contactId },
    data: {
      status: ContactMessageStatus.CALLBACK,
      callbackAt,
      lastContactAt: new Date(),
    },
    select: { id: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_LEAD_CALLBACK_SCHEDULED",
    entity: "ContactMessage",
    entityId: contact.id,
    metadata: { callbackAt: callbackAt.toISOString() },
  });

  return contact;
}

export async function saveContactNote({
  adminId,
  contactId,
  note,
}: {
  adminId: string;
  contactId: string;
  note: string;
}) {
  const db = getPrismaClient();
  const contact = await db.contactMessage.update({
    where: { id: contactId },
    data: { internalNote: note.trim() || null },
    select: { id: true },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_LEAD_NOTE_SAVED",
    entity: "ContactMessage",
    entityId: contact.id,
  });

  return contact;
}

// Convertit un lead en client : réutilise la fiche existante si le téléphone
// est déjà connu, sinon crée un client minimal depuis les infos du message.
export async function convertContactToCustomer({
  adminId,
  contactId,
}: {
  adminId: string;
  contactId: string;
}) {
  const db = getPrismaClient();
  const contact = await db.contactMessage.findUniqueOrThrow({
    where: { id: contactId },
  });

  const existing = await db.customer.findFirst({
    where: { phone: contact.phone },
    select: { id: true },
  });

  const customer =
    existing ??
    (await db.customer.create({
      data: {
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        type: "INDIVIDUAL",
        source: "WEBSITE",
        internalNotes: `Converti depuis un message contact (${contact.subject}).`,
      },
      select: { id: true },
    }));

  await db.contactMessage.update({
    where: { id: contactId },
    data: {
      status: ContactMessageStatus.CONVERTED,
      customerId: customer.id,
      lastContactAt: new Date(),
    },
  });

  await logAdminEvent({
    adminId,
    action: "ADMIN_LEAD_CONVERTED",
    entity: "ContactMessage",
    entityId: contactId,
    metadata: { customerId: customer.id, existingCustomer: Boolean(existing) },
  });

  return { customerId: customer.id, wasExisting: Boolean(existing) };
}

// Leads à rappeler : rappels planifiés arrivés à échéance (aujourd'hui inclus)
// + nouveaux leads jamais traités. Affiché sur le tableau de bord.
export async function getLeadFollowUps() {
  const db = getPrismaClient();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [callbacks, newLeadsCount] = await Promise.all([
    db.contactMessage.findMany({
      where: {
        status: ContactMessageStatus.CALLBACK,
        callbackAt: { lte: endOfToday },
      },
      orderBy: { callbackAt: "asc" },
      take: 10,
    }),
    db.contactMessage.count({
      where: { status: ContactMessageStatus.NEW },
    }),
  ]);

  return {
    newLeadsCount,
    callbacks: callbacks.map((lead) => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      subject: lead.subject,
      callbackAt: lead.callbackAt ? formatDateTime(lead.callbackAt) : "",
      overdue: lead.callbackAt ? lead.callbackAt.getTime() < Date.now() : false,
    })),
  };
}

function buildContactWhere(filters: AdminContactFilters): Prisma.ContactMessageWhereInput {
  const where: Prisma.ContactMessageWhereInput = {};

  if (filters.status) where.status = filters.status;

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
      { message: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}
