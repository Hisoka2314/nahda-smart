"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  Loader2,
  PackageCheck,
  Send,
} from "lucide-react";
import { CustomerTypeSelect } from "@/components/checkout/customer-type-select";
import {
  FormField,
  formControlClass,
} from "@/components/checkout/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatZodErrors,
  getInitialQuoteValues,
  isProfessionalCustomerType,
  quoteNeedLabels,
  quoteSchema,
  quoteStatusLabels,
  quoteUrgencyLabels,
} from "@/lib/orders";
import { formatMad } from "@/lib/utils";
import type { CatalogProduct } from "@/types/catalogue";
import type {
  CustomerType,
  QuoteFormValues,
  QuoteNeed,
  QuoteUrgency,
} from "@/types/order";

type QuoteRequestFormProps = {
  product?: CatalogProduct;
};

type QuoteApiResponse =
  | { ok: true; quote: { quoteNumber: string } }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function QuoteRequestForm({ product }: QuoteRequestFormProps) {
  const [values, setValues] = useState<QuoteFormValues>(() =>
    getInitialQuoteValues(
      product ? { slug: product.slug, name: product.name } : undefined,
    ),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [successQuoteNumber, setSuccessQuoteNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showOrganizationField = isProfessionalCustomerType(values.customerType);

  const setField = <Key extends keyof QuoteFormValues>(
    field: Key,
    value: QuoteFormValues[Key],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleCustomerTypeChange = (customerType: CustomerType) => {
    setValues((current) => ({
      ...current,
      customerType,
      organizationName: isProfessionalCustomerType(customerType)
        ? current.organizationName
        : "",
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.customerType;
      delete next.organizationName;
      return next;
    });
  };

  const toggleNeed = (need: QuoteNeed) => {
    setValues((current) => {
      const needs = current.needs.includes(need)
        ? current.needs.filter((item) => item !== need)
        : [...current.needs, need];

      return { ...current, needs };
    });
    setErrors((current) => {
      const next = { ...current };
      delete next.needs;
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGeneralError("");

    const parsed = quoteSchema.safeParse(values);

    if (!parsed.success) {
      setErrors(formatZodErrors(parsed.error));
      setGeneralError("Veuillez corriger les champs indiqués.");
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = (await response.json()) as QuoteApiResponse;

      if (!response.ok || !result.ok) {
        setErrors(result.ok ? {} : result.fieldErrors ?? {});
        setGeneralError(
          result.ok
            ? "Impossible d'enregistrer la demande pour le moment."
            : result.message,
        );
        setIsSubmitting(false);
        return;
      }

      setSuccessQuoteNumber(result.quote.quoteNumber);
      setIsSubmitting(false);
    } catch {
      setGeneralError(
        "Le service de devis est momentanément indisponible. Veuillez réessayer ou nous contacter par WhatsApp.",
      );
      setIsSubmitting(false);
    }
  };

  if (successQuoteNumber) {
    return (
      <div className="mx-auto max-w-4xl overflow-hidden rounded-card border border-border-soft bg-white shadow-premium">
        <div className="bg-nahda-ink px-6 py-8 text-white">
          <span className="grid h-14 w-14 place-items-center rounded-[14px] bg-nahda-olive text-white">
            <CheckCircle2 size={30} />
          </span>
          <h1 className="mt-5 text-3xl font-black">Demande envoyée</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-white/75">
            Votre demande de devis a été envoyée. Notre équipe vous contactera
            rapidement.
          </p>
        </div>
        <div className="grid gap-5 p-6">
          <div className="rounded-card border border-nahda-olive/[0.22] bg-nahda-olive-soft p-5">
            <p className="text-xs font-black uppercase text-nahda-olive-dark">
              Numéro devis
            </p>
            <p className="mt-1 text-2xl font-black text-nahda-ink">
              {successQuoteNumber}
            </p>
            <Badge variant="success" className="mt-3">
              {quoteStatusLabels.new}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/catalogue"
              className="focus-ring inline-flex h-11 items-center justify-center rounded-control bg-nahda-olive px-4 text-sm font-black text-white transition hover:bg-nahda-olive-dark"
            >
              Retour au catalogue
            </Link>
            <button
              type="button"
              onClick={() => {
                setSuccessQuoteNumber("");
                setValues(getInitialQuoteValues());
              }}
              className="focus-ring inline-flex h-11 items-center justify-center rounded-control border border-nahda-olive/[0.45] bg-white px-4 text-sm font-black text-nahda-olive-dark transition hover:bg-nahda-olive-soft"
            >
              Nouvelle demande
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0">
        <div className="mb-6">
          <p className="text-sm font-black uppercase text-nahda-olive">
            Devis B2B & projets
          </p>
          <h1 className="text-3xl font-black text-nahda-ink md:text-4xl">
            Demander un devis
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-neutral-500">
            Décrivez votre besoin, les quantités et le contexte. Statut initial
            de la demande : Nouveau.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <section className="rounded-card border border-border-soft bg-white p-4 shadow-card md:p-5">
            <h2 className="text-lg font-black text-nahda-ink">Coordonnées</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <FormField
                label="Nom complet"
                htmlFor="quoteFullName"
                error={errors.fullName}
                required
              >
                <input
                  id="quoteFullName"
                  value={values.fullName}
                  onChange={(event) => setField("fullName", event.target.value)}
                  className={formControlClass(errors.fullName)}
                  placeholder="Nom et prénom"
                />
              </FormField>
              <FormField
                label="Téléphone"
                htmlFor="quotePhone"
                error={errors.phone}
                required
              >
                <input
                  id="quotePhone"
                  value={values.phone}
                  onChange={(event) => setField("phone", event.target.value)}
                  className={formControlClass(errors.phone)}
                  placeholder="0600000000"
                />
              </FormField>
              <FormField label="Email" htmlFor="quoteEmail" error={errors.email}>
                <input
                  id="quoteEmail"
                  value={values.email}
                  onChange={(event) => setField("email", event.target.value)}
                  className={formControlClass(errors.email)}
                  placeholder="client@email.ma"
                />
              </FormField>
              <FormField
                label="Ville"
                htmlFor="quoteCity"
                error={errors.city}
                required
              >
                <input
                  id="quoteCity"
                  value={values.city}
                  onChange={(event) => setField("city", event.target.value)}
                  className={formControlClass(errors.city)}
                  placeholder="Casablanca"
                />
              </FormField>
            </div>

            <div className="mt-4">
              <FormField
                label="Type client"
                error={errors.customerType}
                required
              >
                <CustomerTypeSelect
                  value={values.customerType}
                  onChange={handleCustomerTypeChange}
                  error={errors.customerType}
                />
              </FormField>
            </div>

            {showOrganizationField ? (
              <div className="mt-4">
                <FormField
                  label="Nom organisation"
                  htmlFor="quoteOrganization"
                  error={errors.organizationName}
                  required
                >
                  <input
                    id="quoteOrganization"
                    value={values.organizationName}
                    onChange={(event) =>
                      setField("organizationName", event.target.value)
                    }
                    className={formControlClass(errors.organizationName)}
                    placeholder="Nom société / école / administration"
                  />
                </FormField>
              </div>
            ) : null}
          </section>

          <section className="rounded-card border border-border-soft bg-white p-4 shadow-card md:p-5">
            <h2 className="text-lg font-black text-nahda-ink">Besoin</h2>
            <div className="mt-5 grid gap-4">
              <FormField
                label="Produits souhaités"
                htmlFor="desiredProducts"
                error={errors.desiredProducts}
                helperText={
                  product
                    ? "Le produit sélectionné est déjà associé à la demande."
                    : "Ex. 10 PC portables, 2 switchs PoE, installation caméra..."
                }
              >
                <textarea
                  id="desiredProducts"
                  value={values.desiredProducts}
                  onChange={(event) =>
                    setField("desiredProducts", event.target.value)
                  }
                  className={`${formControlClass(errors.desiredProducts)} min-h-28 resize-y py-3 leading-6`}
                  placeholder="Liste produits, références ou besoin global..."
                />
              </FormField>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  label="Quantité souhaitée"
                  htmlFor="desiredQuantity"
                  error={errors.desiredQuantity}
                  required
                >
                  <input
                    id="desiredQuantity"
                    type="number"
                    min={1}
                    value={values.desiredQuantity}
                    onChange={(event) =>
                      setField("desiredQuantity", event.target.value)
                    }
                    className={formControlClass(errors.desiredQuantity)}
                  />
                </FormField>
                <FormField
                  label="Budget estimatif"
                  htmlFor="estimatedBudget"
                  error={errors.estimatedBudget}
                >
                  <input
                    id="estimatedBudget"
                    type="number"
                    min={0}
                    value={values.estimatedBudget}
                    onChange={(event) =>
                      setField("estimatedBudget", event.target.value)
                    }
                    className={formControlClass(errors.estimatedBudget)}
                    placeholder="Ex. 25000"
                  />
                </FormField>
                <FormField
                  label="Urgence"
                  htmlFor="urgency"
                  error={errors.urgency}
                  required
                >
                  <select
                    id="urgency"
                    value={values.urgency}
                    onChange={(event) =>
                      setField("urgency", event.target.value as QuoteUrgency)
                    }
                    className={formControlClass(errors.urgency)}
                  >
                    {(Object.keys(quoteUrgencyLabels) as QuoteUrgency[]).map(
                      (urgency) => (
                        <option key={urgency} value={urgency}>
                          {quoteUrgencyLabels[urgency]}
                        </option>
                      ),
                    )}
                  </select>
                </FormField>
              </div>

              <FormField label="Besoin" error={errors.needs} required>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(Object.keys(quoteNeedLabels) as QuoteNeed[]).map((need) => {
                    const selected = values.needs.includes(need);

                    return (
                      <button
                        key={need}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleNeed(need)}
                        className={`focus-ring min-h-11 rounded-control border px-3 text-left text-sm font-black transition ${
                          selected
                            ? "border-nahda-olive bg-nahda-olive-soft text-nahda-olive-dark"
                            : "border-border-soft bg-white text-nahda-ink hover:border-nahda-olive/[0.45]"
                        }`}
                      >
                        {quoteNeedLabels[need]}
                      </button>
                    );
                  })}
                </div>
              </FormField>

              <FormField label="Message" htmlFor="message" error={errors.message}>
                <textarea
                  id="message"
                  value={values.message}
                  onChange={(event) => setField("message", event.target.value)}
                  className={`${formControlClass(errors.message)} min-h-28 resize-y py-3 leading-6`}
                  placeholder="Contexte, installation, délais, contraintes techniques..."
                />
              </FormField>
            </div>
          </section>

          {generalError ? (
            <div className="rounded-card border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {generalError}
            </div>
          ) : null}

          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 size={19} className="animate-spin" />
            ) : (
              <Send size={19} />
            )}
            {isSubmitting ? "Envoi en cours..." : "Envoyer la demande"}
          </Button>
        </form>
      </section>

      <aside className="lg:sticky lg:top-[170px] lg:self-start">
        <div className="rounded-card border border-border-soft bg-white p-5 shadow-premium">
          <span className="grid h-12 w-12 place-items-center rounded-[12px] bg-nahda-olive-soft text-nahda-olive">
            <FileText size={24} />
          </span>
          <h2 className="mt-4 text-xl font-black text-nahda-ink">
            Devis personnalisé
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-neutral-600">
            Les demandes sont enregistrées en base avec le statut Nouveau pour
            préparer le traitement commercial.
          </p>

          {product ? (
            <div className="mt-5 overflow-hidden rounded-card border border-border-soft bg-[#f7f9f4]">
              <div className="relative aspect-[4/3]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="360px"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <Badge variant="olive">Produit concerné</Badge>
                <p className="mt-3 text-lg font-black leading-6 text-nahda-ink">
                  {product.name}
                </p>
                <p className="mt-2 text-sm font-bold text-nahda-olive-dark">
                  {formatMad(product.price)}
                </p>
                <Link
                  href={`/produit/${product.slug}`}
                  className="mt-3 inline-flex text-sm font-black text-nahda-olive-dark underline-offset-4 hover:underline"
                >
                  Revoir la fiche produit
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex gap-3 rounded-card border border-nahda-olive/[0.22] bg-nahda-olive-soft p-4">
              <PackageCheck size={20} className="mt-0.5 shrink-0 text-nahda-olive" />
              <p className="text-sm font-bold leading-6 text-nahda-olive-dark">
                Vous pouvez demander un devis sans produit précis : indiquez le
                besoin global dans la liste produits souhaités.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
