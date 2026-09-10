import { CarFront } from "lucide-react";

export function StandGoBrand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#b7f34a] text-slate-950 shadow-[0_0_24px_rgba(183,243,74,.22)]">
        <CarFront size={22} strokeWidth={2.3} aria-hidden="true" />
        <span className="absolute inset-x-2 bottom-1 h-px bg-slate-950/30" />
      </span>
      <span className="leading-none">
        <span className="block text-[1.35rem] font-black tracking-[-0.06em] text-white">
          Stand<span className="text-[#b7f34a]">Go</span>
        </span>
        {!compact && (
          <span className="mt-1 block text-[0.6rem] font-bold uppercase tracking-[0.22em] text-slate-400">
            mobilidade sem voltas
          </span>
        )}
      </span>
    </span>
  );
}
