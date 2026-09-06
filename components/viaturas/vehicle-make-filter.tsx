"use client";

import { useEffect, useState } from "react";
import type { VehicleMakeSuggestion } from "@/lib/viaturas/vehicle-catalog";

export function VehicleMakeFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [items, setItems] = useState<VehicleMakeSuggestion[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/viaturas/catalogo?kind=makes&q=${encodeURIComponent(value)}&limit=30`,
          { signal: controller.signal },
        );
        if (r.ok) {
          const json = await r.json();
          setItems(json.items ?? []);
        }
      } catch {}
    }, 150);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder="Todas"
        autoComplete="off"
        className="w-full border border-viaturas-200 rounded-lg p-2 mt-1"
      />
      {open && items.length > 0 && (
        <div className="absolute z-50 left-0 right-0 bg-white border border-viaturas-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-viaturas-50"
          >
            Todas
          </button>
          {items.map((m) => (
            <button
              key={m.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(m.name);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-viaturas-50"
            >
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
