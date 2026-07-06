"use client";

import {
  Building2,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Landmark,
  Store,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { customerTypeLabels } from "@/lib/orders";
import { cn } from "@/lib/utils";
import type { CustomerType } from "@/types/order";

type CustomerTypeSelectProps = {
  value: CustomerType;
  onChange: (value: CustomerType) => void;
  error?: string;
};

const customerTypeIcons: Record<CustomerType, LucideIcon> = {
  individual: UserRound,
  company: Building2,
  school: GraduationCap,
  administration: Landmark,
  reseller: Store,
  association: HeartHandshake,
};

const customerTypeDescriptions: Record<CustomerType, string> = {
  individual: "Commande personnelle",
  company: "Besoin société ou PME",
  school: "Équipement pédagogique",
  administration: "Achat institutionnel",
  reseller: "Achat revendeur",
  association: "Projet associatif",
};

export function CustomerTypeSelect({
  value,
  onChange,
  error,
}: CustomerTypeSelectProps) {
  return (
    <div className="grid gap-2">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {(Object.keys(customerTypeLabels) as CustomerType[]).map((type) => {
          const Icon = customerTypeIcons[type] ?? Handshake;
          const selected = value === type;

          return (
            <button
              key={type}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(type)}
              className={cn(
                "focus-ring flex min-h-[74px] items-center gap-3 rounded-control border p-3 text-left transition",
                selected
                  ? "border-nahda-olive bg-nahda-olive-soft shadow-card"
                  : "border-border-soft bg-white hover:border-nahda-olive/[0.45] hover:bg-surface-muted",
              )}
            >
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-[10px]",
                  selected
                    ? "bg-white text-nahda-olive"
                    : "bg-nahda-olive-soft text-nahda-olive",
                )}
              >
                <Icon size={19} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black text-nahda-ink">
                  {customerTypeLabels[type]}
                </span>
                <span className="mt-0.5 block text-xs font-semibold leading-4 text-neutral-500">
                  {customerTypeDescriptions[type]}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {error ? <p className="text-xs font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
