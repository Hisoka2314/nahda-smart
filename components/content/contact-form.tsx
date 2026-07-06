"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { contactMessageSchema } from "@/lib/validations/contact";

type ContactValues = {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
};

type ContactApiResponse =
  | { ok: true; contact: { id: string } }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const initialValues: ContactValues = {
  name: "",
  phone: "",
  email: "",
  subject: "",
  message: "",
};

export function ContactForm() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const setField = (field: keyof ContactValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setGeneralError("");
    setSuccess(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGeneralError("");

    const parsed = contactMessageSchema.safeParse(values);

    if (!parsed.success) {
      setErrors(formatContactErrors(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json()) as ContactApiResponse;

      if (!response.ok || !payload.ok) {
        setErrors(payload.ok ? {} : payload.fieldErrors ?? {});
        setGeneralError(
          payload.ok
            ? "Impossible d'enregistrer le message pour le moment."
            : payload.message,
        );
        return;
      }

      setSuccess(true);
      setValues(initialValues);
    } catch {
      setGeneralError(
        "Le service contact est momentanément indisponible. Veuillez réessayer ou nous contacter par WhatsApp.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-full overflow-hidden rounded-card border border-border-soft bg-white p-5 shadow-premium md:p-6"
    >
      <h2 className="text-2xl font-black text-nahda-ink">
        Envoyer un message
      </h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-neutral-600">
        Votre message sera enregistré et traité par l&apos;équipe Nahda Smart.
      </p>

      {success ? (
        <div className="mt-5 flex gap-3 rounded-card border border-nahda-olive/[0.24] bg-nahda-olive-soft p-4 text-sm font-bold leading-6 text-nahda-olive-dark">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
          Votre message a été envoyé. Notre équipe vous contactera rapidement.
        </div>
      ) : null}

      {generalError ? (
        <div className="mt-5 rounded-card border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {generalError}
        </div>
      ) : null}

      <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
        <ContactField
          id="contactName"
          label="Nom complet"
          value={values.name}
          error={errors.name}
          required
          onChange={(value) => setField("name", value)}
        />
        <ContactField
          id="contactPhone"
          label="Téléphone"
          value={values.phone}
          error={errors.phone}
          required
          onChange={(value) => setField("phone", value)}
        />
        <ContactField
          id="contactEmail"
          label="Email"
          value={values.email}
          error={errors.email}
          onChange={(value) => setField("email", value)}
        />
        <ContactField
          id="contactSubject"
          label="Sujet"
          value={values.subject}
          error={errors.subject}
          required
          onChange={(value) => setField("subject", value)}
        />
      </div>

      <label className="mt-4 grid min-w-0 gap-2 text-sm font-black text-nahda-ink">
        Message <span className="sr-only">obligatoire</span>
        <textarea
          id="contactMessage"
          value={values.message}
          onChange={(event) => setField("message", event.target.value)}
          className={`focus-ring min-h-32 max-w-full rounded-control border bg-white px-3 py-3 text-sm leading-6 text-nahda-ink shadow-sm transition placeholder:text-neutral-400 hover:border-nahda-olive/[0.45] ${
            errors.message ? "border-red-300" : "border-border-soft"
          }`}
          placeholder="Décrivez votre besoin, produit recherché ou question SAV..."
        />
        {errors.message ? (
          <span className="text-xs font-bold text-red-600">
            {errors.message}
          </span>
        ) : null}
      </label>

      <Button
        type="submit"
        size="lg"
        className="mt-5 w-full sm:w-auto"
        disabled={submitting}
      >
        {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        {submitting ? "Envoi..." : "Envoyer le message"}
      </Button>
    </form>
  );
}

function ContactField({
  id,
  label,
  value,
  error,
  required,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-black text-nahda-ink">
      {label}
      {required ? <span className="sr-only">obligatoire</span> : null}
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`focus-ring h-11 max-w-full rounded-control border bg-white px-3 text-sm text-nahda-ink shadow-sm transition placeholder:text-neutral-400 hover:border-nahda-olive/[0.45] ${
          error ? "border-red-300" : "border-border-soft"
        }`}
      />
      {error ? <span className="text-xs font-bold text-red-600">{error}</span> : null}
    </label>
  );
}

function formatContactErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  return error.issues.reduce<Record<string, string>>((errors, issue) => {
    const field = issue.path[0];

    if (typeof field === "string" && !errors[field]) {
      errors[field] = issue.message;
    }

    return errors;
  }, {});
}
