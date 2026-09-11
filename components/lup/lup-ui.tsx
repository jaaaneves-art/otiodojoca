import Link from "next/link";
import { ArrowLeft, Leaf, Recycle, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function LupBrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`${compact ? "h-9 w-9" : "h-11 w-11"} relative grid shrink-0 place-items-center overflow-hidden rounded-[1rem] bg-lup-400 text-lup-950 shadow-[0_8px_24px_rgba(34,180,94,0.28)]`}>
        <Recycle className={compact ? "h-5 w-5" : "h-6 w-6"} strokeWidth={2.4} />
        <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-amber-300" />
      </span>
      <span>
        <span className="block text-lg font-extrabold leading-none tracking-[-0.04em] text-white">LUP</span>
        {!compact && <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-lup-200">Nada se perde</span>}
      </span>
    </span>
  );
}

export function LupPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon = Leaf,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-lup-600">
            <Icon className="h-4 w-4" /> {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-black tracking-[-0.04em] text-lup-950 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-sm leading-6 text-lup-800 sm:text-base">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function LupBackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-lup-700 transition hover:-translate-x-0.5 hover:text-lup-950">
      <ArrowLeft className="h-4 w-4" /> {children}
    </Link>
  );
}

export function LupEmptyState({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-lup-200/80 bg-white px-6 py-14 text-center shadow-[0_18px_50px_rgba(15,74,44,0.06)]">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-lup-100/70" />
      <div className="absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-amber-100/60" />
      <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-lup-100 text-lup-700">
        <Sparkles className="h-7 w-7" />
      </div>
      <h2 className="relative mt-5 text-xl font-extrabold text-lup-950">{title}</h2>
      <p className="relative mx-auto mt-2 max-w-md text-sm leading-6 text-lup-700">{description}</p>
      <Link href={href} className="relative mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-lup-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-lup-800/15 transition hover:-translate-y-0.5 hover:bg-lup-800">
        {actionLabel}
      </Link>
    </div>
  );
}

export const lupPageClass = "min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(184,245,207,0.55),_transparent_32rem),linear-gradient(180deg,#f7fff9_0%,#f0fdf5_45%,#ffffff_100%)]";
export const lupMainClass = "mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8";
