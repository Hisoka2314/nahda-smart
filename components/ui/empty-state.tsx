import type { ReactNode } from "react";
import { PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-card border border-dashed border-border-soft bg-white p-10 text-center",
        className,
      )}
    >
      <PackageSearch className="text-nahda-olive" size={34} />
      <h3 className="mt-4 text-lg font-black text-nahda-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-neutral-600">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
