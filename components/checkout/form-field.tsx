import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  error,
  helperText,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-black text-nahda-ink"
      >
        {label}
        {required ? <span className="text-nahda-orange"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-bold text-red-600">{error}</p>
      ) : helperText ? (
        <p className="text-xs font-semibold leading-5 text-neutral-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export function formControlClass(error?: string) {
  return cn(
    "focus-ring min-h-11 w-full rounded-control border bg-white px-3 text-sm text-nahda-ink shadow-sm transition placeholder:text-neutral-400 hover:border-nahda-olive/[0.45]",
    error ? "border-red-300" : "border-border-soft",
  );
}
