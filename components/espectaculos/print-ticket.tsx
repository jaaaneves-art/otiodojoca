'use client';
export function PrintTicket() { return <button className="rounded bg-rose-600 px-4 py-2 text-white print:hidden" onClick={() => window.print()}>Imprimir / guardar como PDF</button>; }
