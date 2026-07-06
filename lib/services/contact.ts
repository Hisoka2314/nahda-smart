import { ContactMessageStatus } from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import {
  contactMessageSchema,
  type ContactMessageInput,
} from "@/lib/validations/contact";
import type { ContactResultDTO } from "@/types/public-dtos";

const contactStatusLabels: Record<ContactMessageStatus, string> = {
  NEW: "Nouveau",
  READ: "En cours",
  NO_ANSWER: "Pas de réponse",
  CALLBACK: "À rappeler",
  CONVERTED: "Converti client",
  LOST: "Perdu",
  ARCHIVED: "Archivé",
};

export async function createContactMessage(input: ContactMessageInput) {
  const db = getPrismaClient();
  const data = contactMessageSchema.parse(input);

  const message = await db.contactMessage.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: emptyToUndefined(data.email),
      subject: data.subject,
      message: data.message,
      status: ContactMessageStatus.NEW,
    },
  });

  return toContactResultDTO(message);
}

function toContactResultDTO(message: {
  id: string;
  status: ContactMessageStatus;
  createdAt: Date;
}): ContactResultDTO {
  return {
    id: message.id,
    status: message.status,
    statusLabel: contactStatusLabels[message.status],
    createdAt: message.createdAt.toISOString(),
  };
}

function emptyToUndefined(value?: string) {
  return value?.trim() ? value.trim() : undefined;
}
