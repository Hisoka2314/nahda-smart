import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAdminFeedbackMessage } from "@/lib/admin/messages";

type Tone = "success" | "warning" | "danger" | "info" | "muted";

const toneClasses: Record<Tone, string> = {
  success: "border-emerald-400/30 bg-emerald-400/12 text-emerald-200",
  warning: "border-amber-400/30 bg-amber-400/12 text-amber-200",
  danger: "border-red-400/30 bg-red-400/12 text-red-200",
  info: "border-sky-400/30 bg-sky-400/12 text-sky-200",
  muted: "border-white/10 bg-white/[0.07] text-white/60",
};

export function AdminPageHeader({
  title,
  description,
  eyebrow,
  action,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {breadcrumbs?.length ? <AdminBreadcrumbs items={breadcrumbs} /> : null}
        {eyebrow ? (
          <p className="text-xs font-black uppercase text-nahda-olive">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-2xl font-black text-white md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/58">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function AdminBreadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold text-white/42">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
          {index > 0 ? <span className="text-white/20">/</span> : null}
          {item.href ? (
            <Link href={item.href} className="hover:text-nahda-olive">
              {item.label}
            </Link>
          ) : (
            <span className="text-white/70">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

export function AdminStatCard({
  label,
  value,
  helper,
  icon,
  tone = "info",
}: {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="rounded-card border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_44px_rgb(0_0_0_/_0.2)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white/58">{label}</p>
          <p className="mt-2 text-2xl font-black text-white">{value}</p>
          {helper ? <p className="mt-2 text-xs text-white/44">{helper}</p> : null}
        </div>
        {icon ? (
          <span className={cn("rounded-control border p-3", toneClasses[tone])}>
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function AdminStatusBadge({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-[8px] border px-2.5 py-1 text-xs font-black uppercase",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}

export function AdminPanel({
  title,
  action,
  children,
  description,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  description?: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-card border border-white/10 bg-white/[0.045] shadow-[0_18px_44px_rgb(0_0_0_/_0.2)]",
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-black text-white">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-white/48">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function AdminTable({
  children,
}: {
  children: ReactNode;
  // Conservé pour compat d'appel, ignoré : les tables s'adaptent à l'écran
  // au lieu de forcer une largeur minimale (pas de scrollbar horizontale).
  minWidth?: string;
}) {
  return (
    <div className="rounded-control border border-white/10 bg-[#071112]/55">
      <table className="w-full text-left text-sm text-white/70">
        {children}
      </table>
    </div>
  );
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-white/10 text-xs font-black uppercase text-white/44">
      {children}
    </thead>
  );
}

export function AdminTableCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={cn("px-3 py-3 align-top", className)}>{children}</td>;
}

export function AdminEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-control border border-dashed border-white/15 p-8 text-center">
      <p className="font-black text-white">{title}</p>
      <p className="mt-2 text-sm text-white/52">{description}</p>
    </div>
  );
}

export function AdminSearchBox({
  name = "q",
  placeholder,
  defaultValue,
}: {
  name?: string;
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-control border border-white/10 bg-white/[0.06] px-3 text-white/70">
      <Search size={16} />
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/34"
      />
    </label>
  );
}

export function AdminFilterBar({
  children,
  columns = "xl:grid-cols-[1.5fr_repeat(4,minmax(0,1fr))_auto_auto]",
}: {
  children: ReactNode;
  columns?: string;
}) {
  return (
    <form className={cn("grid gap-3", columns)}>
      {children}
    </form>
  );
}

export function AdminSelect({
  name,
  defaultValue,
  children,
  className,
}: {
  name: string;
  defaultValue?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      className={cn(
        "h-10 rounded-control border border-white/10 bg-[#0c1718] px-3 text-sm font-semibold text-white outline-none focus:border-nahda-olive/70",
        className,
      )}
    >
      {children}
    </select>
  );
}

export function AdminField({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs font-black uppercase text-white/44">{label}</span>
      {children}
      {hint ? <span className="text-xs text-white/38">{hint}</span> : null}
    </label>
  );
}

export function AdminTextInput({
  name,
  defaultValue,
  placeholder,
  type = "text",
  required,
  disabled,
}: {
  name: string;
  defaultValue?: string | number;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <input
      name={name}
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="h-11 w-full rounded-control border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-white outline-none placeholder:text-white/34 focus:border-nahda-olive/70"
    />
  );
}

export function AdminTextarea({
  name,
  defaultValue,
  placeholder,
  rows = 5,
  required,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <textarea
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className="w-full rounded-control border border-white/10 bg-white/[0.055] p-3 text-sm font-semibold text-white outline-none placeholder:text-white/34 focus:border-nahda-olive/70"
    />
  );
}

export function AdminCheckbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex min-h-10 items-center gap-2 rounded-control border border-white/10 bg-white/[0.045] px-3 py-2 text-sm font-bold text-white/72">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-nahda-olive"
      />
      {label}
    </label>
  );
}

export function AdminHiddenFields({
  values,
}: {
  values: Record<string, string | number | boolean | undefined>;
}) {
  return (
    <>
      {Object.entries(values).map(([key, value]) =>
        value === undefined || value === "" ? null : (
          <input key={key} type="hidden" name={key} value={String(value)} />
        ),
      )}
    </>
  );
}

export function AdminPagination({
  basePath,
  searchParams,
  page,
  perPage,
  total,
  totalPages,
}: {
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}) {
  if (total === 0) return null;

  const start = (page - 1) * perPage + 1;
  const end = Math.min(total, page * perPage);
  const previousDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-control border border-white/10 bg-white/[0.035] p-3 text-sm text-white/58 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Affichage de <span className="font-black text-white">{start}</span> a{" "}
        <span className="font-black text-white">{end}</span> sur{" "}
        <span className="font-black text-white">{total}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {previousDisabled ? (
          <span className="inline-flex h-9 items-center gap-2 rounded-control border border-white/10 px-3 text-white/25">
            <ChevronLeft size={15} />
            Precedent
          </span>
        ) : (
          <Link
            href={adminPageHref(basePath, searchParams, page - 1, perPage)}
            className="inline-flex h-9 items-center gap-2 rounded-control border border-white/10 px-3 font-bold text-white hover:bg-white/[0.08]"
          >
            <ChevronLeft size={15} />
            Precedent
          </Link>
        )}
        <span className="rounded-control bg-white/[0.06] px-3 py-2 font-black text-white">
          {page} / {totalPages}
        </span>
        {nextDisabled ? (
          <span className="inline-flex h-9 items-center gap-2 rounded-control border border-white/10 px-3 text-white/25">
            Suivant
            <ChevronRight size={15} />
          </span>
        ) : (
          <Link
            href={adminPageHref(basePath, searchParams, page + 1, perPage)}
            className="inline-flex h-9 items-center gap-2 rounded-control border border-white/10 px-3 font-bold text-white hover:bg-white/[0.08]"
          >
            Suivant
            <ChevronRight size={15} />
          </Link>
        )}
      </div>
    </div>
  );
}

export function AdminFeedback({
  success,
  error,
}: {
  success?: string;
  error?: string;
}) {
  const feedback = getAdminFeedbackMessage({ success, error });

  if (!feedback) return null;

  return (
    <div
      className={cn(
        "rounded-control border px-4 py-3 text-sm font-bold",
        feedback.tone === "success"
          ? "border-emerald-400/30 bg-emerald-400/12 text-emerald-100"
          : "border-red-400/30 bg-red-400/12 text-red-100",
      )}
    >
      {feedback.message}
    </div>
  );
}

function adminPageHref(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
  page: number,
  perPage: number,
) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    const single = Array.isArray(value) ? value[0] : value;
    if (single && key !== "page") params.set(key, single);
  });

  params.set("page", String(page));
  params.set("perPage", String(perPage));
  return `${basePath}?${params.toString()}`;
}

export function AdminBackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-bold text-nahda-olive hover:text-white"
    >
      <ArrowLeft size={16} />
      Retour
    </Link>
  );
}
