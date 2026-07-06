import nodemailer from "nodemailer";

// Notifications internes (nouvelle commande, stock bas...).
// Canal email active uniquement si SMTP_HOST + NOTIFY_EMAIL_TO sont configures ;
// sinon l'evenement est simplement journalise en JSON sur stderr (greppable).

type NotificationInput = {
  subject: string;
  text: string;
  kind: "order" | "stock" | "lead";
};

function getTransport() {
  const host = process.env.SMTP_HOST;

  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" }
      : undefined,
  });
}

export async function sendInternalNotification(input: NotificationInput) {
  console.error(
    JSON.stringify({
      level: "notify",
      kind: input.kind,
      subject: input.subject,
      timestamp: new Date().toISOString(),
    }),
  );

  const to = process.env.NOTIFY_EMAIL_TO;
  const transport = getTransport();

  if (!to || !transport) return;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@nahdasmart.ma",
      to,
      subject: `[Nahda Smart] ${input.subject}`,
      text: input.text,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        source: "notifications",
        message: error instanceof Error ? error.message : "sendMail failed",
        timestamp: new Date().toISOString(),
      }),
    );
  }
}

// Fire-and-forget : ne bloque jamais le flux appelant (commande client...).
export function notifyInBackground(input: NotificationInput) {
  void sendInternalNotification(input);
}
