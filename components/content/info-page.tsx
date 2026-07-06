import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Headphones,
  MessageCircle,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export type InfoPageAction = {
  label: string;
  href: string;
  variant?: "primary" | "outline" | "dark";
};

export type InfoPageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: InfoPageAction[];
};

export type InfoCard = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

export type InfoSection = {
  title: string;
  description?: string;
  items: InfoCard[];
};

type InfoPageProps = InfoPageHeroProps & {
  sections?: InfoSection[];
  children?: ReactNode;
};

export function InfoPage({
  eyebrow,
  title,
  description,
  actions,
  sections,
  children,
}: InfoPageProps) {
  return (
    <Container className="py-8 md:py-12">
      <InfoHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={actions}
      />
      {sections ? (
        <div className="mt-8 grid gap-6">
          {sections.map((section) => (
            <InfoSectionBlock key={section.title} section={section} />
          ))}
        </div>
      ) : null}
      {children}
    </Container>
  );
}

export function InfoHero({
  eyebrow,
  title,
  description,
  actions,
}: InfoPageHeroProps) {
  return (
    <section className="relative max-w-full overflow-hidden rounded-card bg-nahda-ink p-4 text-white shadow-premium md:p-5">
      <div className="absolute inset-0 tech-grid opacity-35" />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(110deg,transparent,rgba(132,163,39,0.18))]" />
      <div className="relative max-w-4xl min-w-0">
        <p className="text-[11px] font-black uppercase text-[#a8c84c]">
          {eyebrow}
        </p>
        <h1 className="mt-1.5 max-w-full break-words text-lg font-black leading-snug [overflow-wrap:anywhere] sm:text-xl md:text-2xl">
          {title}
        </h1>
        <p className="mt-1.5 max-w-3xl break-words text-xs font-semibold leading-5 text-white/72 [overflow-wrap:anywhere] md:text-sm md:leading-6">
          {description}
        </p>
        {actions?.length ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {actions.map((action) => (
              <InfoAction key={action.href + action.label} action={action} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function InfoSectionBlock({ section }: { section: InfoSection }) {
  return (
    <section className="max-w-full overflow-hidden rounded-card border border-border-soft bg-white p-5 shadow-card md:p-6">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-black text-nahda-ink">
          {section.title}
        </h2>
        {section.description ? (
          <p className="mt-2 text-sm font-semibold leading-6 text-neutral-600">
            {section.description}
          </p>
        ) : null}
      </div>
      <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {section.items.map((item) => (
          <InfoCardBlock key={item.title} item={item} />
        ))}
      </div>
    </section>
  );
}

export function InfoCardBlock({ item }: { item: InfoCard }) {
  const Icon = item.icon ?? CheckCircle2;

  return (
    <article className="min-w-0 rounded-card border border-border-soft bg-surface-muted p-4">
      <span className="grid h-11 w-11 place-items-center rounded-[11px] bg-white text-nahda-olive shadow-sm">
        <Icon size={21} />
      </span>
      <h3 className="mt-4 text-base font-black text-nahda-ink">
        {item.title}
      </h3>
      <p className="mt-2 break-words text-sm font-semibold leading-6 text-neutral-600">
        {item.description}
      </p>
    </article>
  );
}

export function CtaBand({
  title,
  description,
  primaryHref = "/contact",
  primaryLabel = "Nous contacter",
  secondaryHref = "/demande-devis",
  secondaryLabel = "Demander un devis",
}: {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="mt-8 max-w-full overflow-hidden rounded-card border border-nahda-olive/[0.24] bg-nahda-olive-soft p-5 shadow-card md:flex md:items-center md:justify-between md:gap-6 md:p-6">
      <div>
        <p className="text-xl font-black text-nahda-ink">{title}</p>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-neutral-700">
          {description}
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap md:mt-0">
        <Link
          href={primaryHref}
          className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-control bg-nahda-olive px-4 text-sm font-black text-white transition hover:bg-nahda-olive-dark sm:w-auto"
        >
          <Headphones size={17} />
          {primaryLabel}
        </Link>
        <Link
          href={secondaryHref}
          className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-control border border-nahda-olive/[0.45] bg-white px-4 text-sm font-black text-nahda-olive-dark transition hover:bg-white sm:w-auto"
        >
          <FileText size={17} />
          {secondaryLabel}
        </Link>
      </div>
    </section>
  );
}

export function InfoAction({ action }: { action: InfoPageAction }) {
  return (
    <Link
      href={action.href}
      className={cn(
        "focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-control px-4 text-sm font-black transition sm:w-auto",
        action.variant === "outline"
          ? "border border-white/40 bg-white/[0.06] text-white hover:bg-white/[0.14]"
          : action.variant === "dark"
            ? "bg-nahda-ink text-white hover:bg-[#172016]"
            : "bg-nahda-olive text-white hover:bg-nahda-olive-dark",
      )}
    >
      {action.label}
      <ArrowRight size={16} />
    </Link>
  );
}

export function WhatsappLink({
  href,
  label = "WhatsApp",
}: {
  href: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-control border border-[#25d366]/40 bg-white px-4 text-sm font-black text-[#1a7f3c] transition hover:bg-[#eefbf3]"
    >
      <MessageCircle size={17} />
      {label}
    </a>
  );
}
