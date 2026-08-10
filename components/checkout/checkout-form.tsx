"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  PackageCheck,
  ShoppingCart,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { CustomerTypeSelect } from "@/components/checkout/customer-type-select";
import { DeliveryMethodSelector } from "@/components/checkout/delivery-method-selector";
import {
  FormField,
  formControlClass,
} from "@/components/checkout/form-field";
import { PaymentMethodSelector } from "@/components/checkout/payment-method-selector";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  calculateCartSubtotal,
  checkoutSchema,
  formatZodErrors,
  getDeliveryFee,
  getInitialCheckoutValues,
  isProfessionalCustomerType,
} from "@/lib/orders";
import type {
  CheckoutFormValues,
  CustomerType,
  DeliveryMethod,
  PaymentMethod,
} from "@/types/order";

type OrderApiResponse =
  | { ok: true; order: { orderNumber: string } }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function CheckoutForm() {
  const router = useRouter();
  const { items, clearCart, homeDeliveryFee } = useCart();
  const [values, setValues] = useState<CheckoutFormValues>(
    getInitialCheckoutValues,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = useMemo(() => calculateCartSubtotal(items), [items]);
  const deliveryFee = getDeliveryFee(values.deliveryMethod, homeDeliveryFee);
  const total = subtotal + deliveryFee;
  const showOrganizationField = isProfessionalCustomerType(values.customerType);

  const setField = <Key extends keyof CheckoutFormValues>(
    field: Key,
    value: CheckoutFormValues[Key],
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
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

  const handleDeliveryChange = (deliveryMethod: DeliveryMethod) => {
    setValues((current) => ({
      ...current,
      deliveryMethod,
      paymentMethod:
        deliveryMethod === "store_pickup"
          ? "pay_in_store"
          : "cash_on_delivery",
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.deliveryMethod;
      delete next.paymentMethod;
      delete next.address;
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGeneralError("");

    if (items.length === 0) {
      setGeneralError("Votre panier est vide.");
      return;
    }

    const parsed = checkoutSchema.safeParse(values);

    if (!parsed.success) {
      setErrors(formatZodErrors(parsed.error));
      setGeneralError("Veuillez corriger les champs indiqués.");
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            fullName: parsed.data.fullName,
            phone: parsed.data.phone,
            email: parsed.data.email,
            city: parsed.data.city,
            address: parsed.data.address,
            customerType: parsed.data.customerType,
            organizationName: parsed.data.organizationName,
            note: parsed.data.note,
          },
          deliveryMethod: parsed.data.deliveryMethod,
          paymentMethod: parsed.data.paymentMethod,
          items: items.map((item) => ({
            productSlug: item.product.slug,
            quantity: item.quantity,
          })),
        }),
      });
      const result = (await response.json()) as OrderApiResponse;

      if (!response.ok || !result.ok) {
        setErrors(result.ok ? {} : result.fieldErrors ?? {});
        setGeneralError(
          result.ok
            ? "Impossible d'enregistrer la commande pour le moment."
            : result.message,
        );
        setIsSubmitting(false);
        return;
      }

      clearCart();
      router.push(
        `/commande-confirmee?orderNumber=${encodeURIComponent(result.order.orderNumber)}`,
      );
    } catch (error) {
      setGeneralError(
        error instanceof Error
          ? error.message
          : "Le service de commande est momentanément indisponible. Veuillez réessayer ou nous contacter par WhatsApp.",
      );
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        className="my-10"
        title="Votre panier est vide"
        description="Ajoutez des produits avant de lancer le checkout hors ligne. Votre commande sera ensuite confirmée par notre équipe."
        action={
          <Link
            href="/catalogue"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-control bg-nahda-olive px-4 text-sm font-black text-white transition hover:bg-nahda-olive-dark"
          >
            <ShoppingCart size={17} />
            Retour au catalogue
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
      <section className="min-w-0">
        <nav
          aria-label="Fil d'Ariane"
          className="mb-5 flex flex-wrap items-center gap-2 text-sm font-bold text-neutral-500"
        >
          <Link href="/" className="transition hover:text-nahda-olive">
            Accueil
          </Link>
          <span>/</span>
          <Link href="/panier" className="transition hover:text-nahda-olive">
            Panier
          </Link>
          <span>/</span>
          <span className="text-nahda-ink">Checkout</span>
        </nav>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-nahda-olive">
              Tunnel hors ligne
            </p>
            <h1 className="text-3xl font-black text-nahda-ink md:text-4xl">
              Finaliser ma commande
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-neutral-500">
              Aucun paiement en ligne. Votre commande démarre avec le statut
              En attente de confirmation.
            </p>
          </div>
          <Link
            href="/panier"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-control border border-nahda-olive/[0.45] bg-white px-4 text-sm font-black text-nahda-olive-dark transition hover:bg-nahda-olive-soft"
          >
            <ArrowLeft size={17} />
            Retour panier
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <CheckoutStep
            number="1"
            title="Informations client"
            description="Coordonnées nécessaires pour confirmer la commande."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Nom complet"
                htmlFor="fullName"
                error={errors.fullName}
                required
              >
                <input
                  id="fullName"
                  value={values.fullName}
                  onChange={(event) => setField("fullName", event.target.value)}
                  className={formControlClass(errors.fullName)}
                  placeholder="Ex. Mohamed Amrani"
                  autoComplete="name"
                />
              </FormField>
              <FormField
                label="Téléphone"
                htmlFor="phone"
                error={errors.phone}
                helperText="Format accepté : 0600000000 ou +212600000000"
                required
              >
                <input
                  id="phone"
                  value={values.phone}
                  onChange={(event) => setField("phone", event.target.value)}
                  className={formControlClass(errors.phone)}
                  placeholder="0600000000"
                  autoComplete="tel"
                />
              </FormField>
              <FormField label="Email" htmlFor="email" error={errors.email}>
                <input
                  id="email"
                  value={values.email}
                  onChange={(event) => setField("email", event.target.value)}
                  className={formControlClass(errors.email)}
                  placeholder="client@email.ma"
                  autoComplete="email"
                />
              </FormField>
              <FormField
                label="Ville"
                htmlFor="city"
                error={errors.city}
                required
              >
                <input
                  id="city"
                  value={values.city}
                  onChange={(event) => setField("city", event.target.value)}
                  className={formControlClass(errors.city)}
                  placeholder="Casablanca"
                  autoComplete="address-level2"
                />
              </FormField>
            </div>

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

            {showOrganizationField ? (
              <FormField
                label="Nom société / école / administration"
                htmlFor="organizationName"
                error={errors.organizationName}
                required
              >
                <input
                  id="organizationName"
                  value={values.organizationName}
                  onChange={(event) =>
                    setField("organizationName", event.target.value)
                  }
                  className={formControlClass(errors.organizationName)}
                  placeholder="Nom de l'organisation"
                  autoComplete="organization"
                />
              </FormField>
            ) : null}

            <FormField label="Note client" htmlFor="note" error={errors.note}>
              <textarea
                id="note"
                value={values.note}
                onChange={(event) => setField("note", event.target.value)}
                className={`${formControlClass(errors.note)} min-h-24 resize-y py-3 leading-6`}
                placeholder="Disponibilité, créneau préféré, remarque technique..."
              />
            </FormField>
          </CheckoutStep>

          <CheckoutStep
            number="2"
            title="Livraison"
            description="Choisissez la livraison à domicile ou le retrait sur place."
          >
            <DeliveryMethodSelector
              value={values.deliveryMethod}
              onChange={handleDeliveryChange}
            />
            {values.deliveryMethod === "home_delivery" ? (
              <FormField
                label="Adresse de livraison"
                htmlFor="address"
                error={errors.address}
                required
              >
                <textarea
                  id="address"
                  value={values.address}
                  onChange={(event) => setField("address", event.target.value)}
                  className={`${formControlClass(errors.address)} min-h-24 resize-y py-3 leading-6`}
                  placeholder="Adresse complète, quartier, repère..."
                  autoComplete="street-address"
                />
              </FormField>
            ) : (
              <div className="rounded-card border border-nahda-olive/[0.22] bg-nahda-olive-soft p-4 text-sm font-bold leading-6 text-nahda-olive-dark">
                Retrait sur place : l&apos;équipe Nahda Smart vous confirmera le
                magasin et le créneau disponibles.
              </div>
            )}
          </CheckoutStep>

          <CheckoutStep
            number="3"
            title="Paiement"
            description="Paiement hors ligne uniquement au lancement."
          >
            <PaymentMethodSelector
              value={values.paymentMethod}
              onChange={(paymentMethod: PaymentMethod) =>
                setField("paymentMethod", paymentMethod)
              }
            />
            <div className="rounded-card border border-border-soft bg-white p-4 text-sm leading-6 text-neutral-600">
              <strong className="text-nahda-ink">Aucun paiement carte actif.</strong>{" "}
              Les méthodes disponibles sont le paiement à la livraison et le
              paiement sur place / retrait magasin.
            </div>
          </CheckoutStep>

          <CheckoutStep
            number="4"
            title="Confirmation"
            description="Dernière vérification avant enregistrement sécurisé."
          >
            {generalError ? (
              <div className="flex gap-3 rounded-card border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                <AlertCircle size={19} className="mt-0.5 shrink-0" />
                {generalError}
              </div>
            ) : (
              <div className="flex gap-3 rounded-card border border-nahda-olive/[0.22] bg-nahda-olive-soft p-4 text-sm font-bold leading-6 text-nahda-olive-dark">
                <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
                Votre commande sera enregistrée en base puis confirmée par
                téléphone ou WhatsApp par l&apos;équipe Nahda Smart.
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 size={19} className="animate-spin" />
              ) : (
                <PackageCheck size={19} />
              )}
              {isSubmitting ? "Enregistrement..." : "Confirmer la commande"}
            </Button>
          </CheckoutStep>
        </form>
      </section>

      <CheckoutSummary
        items={items}
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        total={total}
        deliveryMethod={values.deliveryMethod}
        paymentMethod={values.paymentMethod}
      />
    </div>
  );
}

function CheckoutStep({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border-soft bg-white p-4 shadow-card md:p-5">
      <div className="mb-5 flex gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-nahda-olive text-sm font-black text-white">
          {number}
        </span>
        <div>
          <h2 className="text-lg font-black text-nahda-ink">{title}</h2>
          <p className="mt-1 text-sm font-semibold leading-5 text-neutral-500">
            {description}
          </p>
        </div>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}
