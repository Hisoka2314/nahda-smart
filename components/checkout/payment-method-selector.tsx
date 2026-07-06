"use client";

import { Banknote, Store } from "lucide-react";
import { paymentMethodLabels } from "@/lib/orders";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types/order";

type PaymentMethodSelectorProps = {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
};

const paymentOptions: Array<{
  value: PaymentMethod;
  detail: string;
  icon: typeof Banknote;
}> = [
  {
    value: "cash_on_delivery",
    detail: "Payez à la réception après confirmation de la commande.",
    icon: Banknote,
  },
  {
    value: "pay_in_store",
    detail: "Réglez sur place au moment du retrait magasin.",
    icon: Store,
  },
];

export function PaymentMethodSelector({
  value,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {paymentOptions.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "focus-ring flex min-h-[104px] items-start gap-3 rounded-card border p-4 text-left transition",
              selected
                ? "border-nahda-olive bg-nahda-olive-soft shadow-card"
                : "border-border-soft bg-white hover:border-nahda-olive/[0.45] hover:bg-surface-muted",
            )}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[11px] bg-white text-nahda-olive shadow-sm">
              <option.icon size={21} />
            </span>
            <span>
              <span className="block text-sm font-black text-nahda-ink">
                {paymentMethodLabels[option.value]}
              </span>
              <span className="mt-1 block text-sm leading-5 text-neutral-600">
                {option.detail}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
