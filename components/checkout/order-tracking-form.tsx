"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PackageSearch, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMad } from "@/lib/utils";
import type { OrderTrackingDTO } from "@/types/public-dtos";

type TrackingApiResponse =
  | { ok: true; order: OrderTrackingDTO }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function OrderTrackingForm() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<OrderTrackingDTO | null>(null);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setResult(null);
    setFieldErrors({});

    if (!orderNumber.trim() || !phone.trim()) {
      setMessage("Indiquez le numéro de commande et le téléphone.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phone }),
      });
      const payload = (await response.json()) as TrackingApiResponse;

      if (!response.ok || !payload.ok) {
        setFieldErrors(payload.ok ? {} : payload.fieldErrors ?? {});
        setMessage(
          payload.ok
            ? "Commande introuvable. Vérifiez le numéro et le téléphone."
            : payload.message,
        );
        return;
      }

      setResult(payload.order);
    } catch {
      setMessage(
        "Le suivi commande est momentanément indisponible. Veuillez réessayer plus tard.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="rounded-card border border-border-soft bg-white p-5 shadow-premium md:p-7">
        <div>
          <p className="text-sm font-black uppercase text-nahda-olive">
            Suivi commande
          </p>
          <h1 className="mt-2 text-3xl font-black text-nahda-ink md:text-4xl">
            Suivre ma commande
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-neutral-500">
            Saisissez votre numéro de commande et le téléphone utilisé lors de
            l&apos;achat. Nous affichons uniquement les informations utiles au
            suivi.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-7 grid gap-4 md:grid-cols-[1fr_1fr_auto]"
        >
          <label className="grid gap-2 text-sm font-black text-nahda-ink">
            Numéro commande
            <input
              id="orderNumber"
              value={orderNumber}
              onChange={(event) => {
                setOrderNumber(event.target.value);
                setFieldErrors((current) => ({ ...current, orderNumber: "" }));
              }}
              className="focus-ring h-11 rounded-control border border-border-soft bg-white px-3 text-sm shadow-sm"
              placeholder="CMD-2026-0001ABC"
            />
            {fieldErrors.orderNumber ? (
              <span className="text-xs font-bold text-red-600">
                {fieldErrors.orderNumber}
              </span>
            ) : null}
          </label>
          <label className="grid gap-2 text-sm font-black text-nahda-ink">
            Téléphone
            <input
              id="phone"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                setFieldErrors((current) => ({ ...current, phone: "" }));
              }}
              className="focus-ring h-11 rounded-control border border-border-soft bg-white px-3 text-sm shadow-sm"
              placeholder="0600000000"
            />
            {fieldErrors.phone ? (
              <span className="text-xs font-bold text-red-600">
                {fieldErrors.phone}
              </span>
            ) : null}
          </label>
          <Button type="submit" className="self-end" disabled={isSubmitting}>
            <Search size={17} />
            {isSubmitting ? "Recherche..." : "Suivre"}
          </Button>
        </form>

        {message ? (
          <div className="mt-5 rounded-card border border-border-soft bg-surface-muted p-4 text-sm font-bold text-neutral-700">
            {message}
          </div>
        ) : null}

        {result ? (
          <div className="mt-6 rounded-card border border-nahda-olive/[0.24] bg-nahda-olive-soft p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-nahda-olive-dark">
                  Commande trouvée
                </p>
                <p className="mt-1 text-2xl font-black text-nahda-ink">
                  {result.orderNumber}
                </p>
              </div>
              <Badge variant="success">{result.statusLabel}</Badge>
            </div>
            <dl className="mt-5 grid gap-3 text-sm font-bold text-neutral-700 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-neutral-500">Client</dt>
                <dd className="mt-1 text-nahda-ink">{result.customer.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-neutral-500">Total</dt>
                <dd className="mt-1 text-nahda-ink">{formatMad(result.total)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-neutral-500">Livraison</dt>
                <dd className="mt-1 text-nahda-ink">
                  {result.deliveryMethodLabel}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-neutral-500">Paiement</dt>
                <dd className="mt-1 text-nahda-ink">
                  {result.paymentMethodLabel}
                </dd>
              </div>
            </dl>

            <div className="mt-5 grid gap-2">
              {result.items.map((item) => (
                <div
                  key={`${item.productSlug}-${item.quantity}`}
                  className="flex items-center gap-3 rounded-[10px] bg-white/70 p-2"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[8px] border border-border-soft bg-white">
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-black text-nahda-ink">
                      {item.productName}
                    </p>
                    <p className="text-xs font-bold text-neutral-500">
                      {item.quantity} × {formatMad(item.unitPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <aside className="rounded-card border border-border-soft bg-nahda-ink p-5 text-white shadow-premium lg:self-start">
        <span className="grid h-12 w-12 place-items-center rounded-[12px] bg-white/[0.1] text-[#a8c84c]">
          <PackageSearch size={24} />
        </span>
        <h2 className="mt-4 text-xl font-black">Besoin d&apos;aide ?</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-white/68">
          Si une commande n&apos;apparaît pas, vérifiez le numéro et le
          téléphone utilisés lors de la commande. Notre équipe peut aussi vous
          aider.
        </p>
        <Link
          href="/demande-devis"
          className="focus-ring mt-5 inline-flex h-11 items-center justify-center rounded-control bg-nahda-olive px-4 text-sm font-black text-white transition hover:bg-nahda-olive-dark"
        >
          Demander un devis
        </Link>
      </aside>
    </div>
  );
}
