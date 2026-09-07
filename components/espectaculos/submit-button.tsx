'use client';
import { useFormStatus } from 'react-dom';
export function SubmitButton({ children, disabled = false }: { children: React.ReactNode; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return <button disabled={disabled || pending} aria-disabled={disabled || pending} className="rounded bg-rose-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{pending ? 'A processar…' : children}</button>;
}
