"use client";

import { useState } from "react";
import { CarFront, ImageIcon } from "lucide-react";

type Photo = { id: number; storage_path: string };

export function ViaturaGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-100 via-blue-50 to-blue-100 text-blue-700">
        <div className="text-center"><CarFront className="mx-auto" size={68} strokeWidth={1.25} /><p className="mt-3 text-sm font-bold text-slate-500">Sem fotografias</p></div>
      </div>
    );
  }

  const selected = photos[Math.min(active, photos.length - 1)];

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-slate-100">
        <img src={selected.storage_path} alt={`${title} — fotografia ${active + 1}`} className="h-full w-full object-cover" />
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/75 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
          <ImageIcon size={14} aria-hidden="true" /> {active + 1}/{photos.length}
        </span>
      </div>
      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {photos.map((photo, index) => (
            <button key={photo.id} type="button" onClick={() => setActive(index)} className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition ${index === active ? "border-blue-600 ring-2 ring-blue-100" : "border-transparent opacity-70 hover:opacity-100"}`} aria-label={`Mostrar fotografia ${index + 1}`} aria-pressed={index === active}>
              <img src={photo.storage_path} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
