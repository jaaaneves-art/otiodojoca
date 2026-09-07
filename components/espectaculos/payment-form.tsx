'use client';
import { useMemo, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { startPayment } from '@/lib/espectaculos/actions';
function Confirm({ orderId, expiresAt }: { orderId: string; expiresAt: string }) {
  const lock = useRef(false);
  const stripe = useStripe(); const elements = useElements();
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  return <form onSubmit={async e => {
    e.preventDefault(); if (!stripe || !elements || lock.current) return;
    if (Date.parse(expiresAt) <= Date.now()) { setMessage('A reserva expirou. Consulta a encomenda antes de tentar novamente.'); return; }
    lock.current = true;
    setBusy(true);
    try {
      const { error } = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${window.location.origin}/espectaculos/encomendas/${orderId}` } });
      setMessage(error?.message ?? 'Consulta o estado da encomenda.');
    } catch { setMessage('Não foi possível concluir. Consulta a encomenda antes de tentar novamente.'); }
    finally { lock.current = false; setBusy(false); }
  }} className="space-y-4"><PaymentElement /><button disabled={!stripe || busy} className="rounded bg-rose-600 px-4 py-2 text-white">{busy ? 'A processar…' : 'Pagar'}</button><p role="status">{message}</p></form>;
}
export function PaymentForm({ orderId, expiresAt }: { orderId: string; expiresAt: string }) {
  const lock = useRef(false);
  const [clientSecret, setSecret] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const stripe = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_ESPECTACULOS_STRIPE_KEY;
    return key?.startsWith('pk_test_') ? loadStripe(key) : null;
  }, []);
  if (!stripe) return <p>Pagamentos online ainda indisponíveis.</p>;
  if (clientSecret) return <Elements stripe={stripe} options={{ clientSecret, locale: 'pt' }}><Confirm orderId={orderId} expiresAt={expiresAt} /></Elements>;
  return <div><button disabled={busy} className="rounded bg-rose-600 px-4 py-2 text-white" onClick={async () => {
    if (lock.current) return;
    if (Date.parse(expiresAt) <= Date.now()) { setError('A reserva expirou. Consulta a encomenda.'); return; }
    lock.current = true; setBusy(true); const f = new FormData(); f.set('order_id', orderId);
    try { const result = await startPayment(f); if ('error' in result) setError(result.error); else setSecret(result.clientSecret); }
    catch { setError('Não foi possível iniciar o pagamento.'); } finally { lock.current = false; setBusy(false); }
  }}>{busy ? 'A preparar…' : 'Continuar para pagamento'}</button><p role="status" className="mt-2">{error}</p></div>;
}
