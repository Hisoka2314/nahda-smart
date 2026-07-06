import type { ReactNode } from "react";

type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: SectionTitleProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <span className="text-xs font-black uppercase text-nahda-olive">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="mt-2 text-2xl font-black tracking-normal text-nahda-ink md:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
