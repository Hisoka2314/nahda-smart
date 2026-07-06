import { z } from "zod";
import { getPrismaClient } from "@/lib/db";
import { formatDateTime } from "@/lib/admin/labels";

const emailSchema = z.string().trim().toLowerCase().email();

export type NewsletterSubscribeResult = {
  ok: boolean;
  message: string;
};

export async function subscribeToNewsletter(
  rawEmail: unknown,
): Promise<NewsletterSubscribeResult> {
  const parsed = emailSchema.safeParse(rawEmail);

  if (!parsed.success) {
    return { ok: false, message: "Adresse e-mail invalide." };
  }

  const db = getPrismaClient();
  await db.newsletterSubscriber.upsert({
    where: { email: parsed.data },
    create: { email: parsed.data },
    update: {},
  });

  return {
    ok: true,
    message: "Inscription confirmée. Merci, à bientôt dans votre boîte mail !",
  };
}

export async function getNewsletterSubscribers() {
  const db = getPrismaClient();
  const subscribers = await db.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return subscribers.map((subscriber) => ({
    id: subscriber.id,
    email: subscriber.email,
    createdAt: formatDateTime(subscriber.createdAt),
  }));
}
