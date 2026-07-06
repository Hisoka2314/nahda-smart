"use client";

import { Store, Truck } from "lucide-react";
import { deliveryMethodLabels } from "@/lib/orders";
import { cn } from "@/lib/utils";
import type { DeliveryMethod } from "@/types/order";

type DeliveryMethodSelectorProps = {
  value: DeliveryMethod;
  onChange: (value: DeliveryMethod) => void;
};

const deliveryOptions: Array<{
  value: DeliveryMethod;
  detail: string;
  icon: typeof Truck;
}> = [
  {
    value: "home_delivery",
    detail: "À partir de 30 DH selon la ville.",
    icon: Truck,
  },
  {
    value: "store_pickup",
    detail: "Retrait en magasin après confirmation de disponibilité.",
    icon: Store,
  },
];

export function DeliveryMethodSelector({
  value,
  onChange,
}: DeliveryMethodSelectorProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {deliveryOptions.map((option) => {
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
                {deliveryMethodLabels[option.value]}
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
