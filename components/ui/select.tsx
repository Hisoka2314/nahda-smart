import type { SelectHTMLAttributes } from "react";
import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: SelectOption[];
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, id, ...props }, ref) => {
    const selectId = id ?? props.name;

    return (
      <label className="grid gap-2 text-sm font-semibold text-nahda-ink">
        {label ? <span>{label}</span> : null}
        <span className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              "focus-ring h-11 w-full appearance-none rounded-control border border-border-soft bg-white px-3 pr-10 text-sm text-nahda-ink shadow-sm transition hover:border-nahda-olive/[0.45]",
              className,
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={17}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
          />
        </span>
      </label>
    );
  },
);

Select.displayName = "Select";
