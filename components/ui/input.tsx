import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <label className="grid gap-2 text-sm font-semibold text-nahda-ink">
        {label ? <span>{label}</span> : null}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "focus-ring h-11 rounded-control border border-border-soft bg-white px-3 text-sm text-nahda-ink shadow-sm transition placeholder:text-neutral-400 hover:border-nahda-olive/[0.45]",
            className,
          )}
          {...props}
        />
        {helperText ? (
          <span className="text-xs font-normal text-neutral-500">
            {helperText}
          </span>
        ) : null}
      </label>
    );
  },
);

Input.displayName = "Input";
