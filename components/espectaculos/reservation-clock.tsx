'use client';
import { useEffect, useState } from 'react';
export function ReservationClock({ expiresAt, observedAt }: { expiresAt: string; observedAt: number }) {
  const [now, setNow] = useState(observedAt);
  useEffect(() => { const start = performance.now(); const timer = setInterval(() => setNow(observedAt + performance.now() - start), 1000); return () => clearInterval(timer); }, [observedAt]);
  const seconds = Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / 1000));
  return <p role="timer" aria-label="Tempo restante da reserva" className="rounded bg-amber-50 p-3 font-semibold">{seconds ? `Reserva: ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} restantes` : 'Prazo da reserva terminado. Atualiza o estado da encomenda.'}</p>;
}
