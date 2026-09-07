'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
export function OrderRefresh({ pending }: { pending: boolean }) {
  const router = useRouter();
  useEffect(() => { if (!pending) return; const timer = setInterval(() => router.refresh(), 10000); return () => clearInterval(timer); }, [pending, router]);
  return <button className="rounded border px-3 py-2" onClick={() => router.refresh()}>Atualizar estado</button>;
}
