'use client';
import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { checkIn } from '@/lib/espectaculos/actions';
const labels: Record<string, string> = { accepted: 'Entrada aceite.', already_used: 'Bilhete já utilizado. Não permitir nova entrada.', cancelled: 'Bilhete cancelado. Não permitir entrada.', refunded: 'Bilhete reembolsado. Não permitir entrada.', refund_pending: 'Reembolso pendente. Entrada suspensa.', wrong_session: 'Evento ou sessão errados. Confirma a sessão do bilhete.', review: 'Bilhete suspenso. Encaminha para o responsável.', invalid: 'Bilhete inválido para esta sessão.', error: 'Não foi possível validar. Confirma a ligação e as permissões.' };
export function CheckinScanner({ sessionId }: { sessionId: number }) {
  const video = useRef<HTMLVideoElement>(null); const stream = useRef<MediaStream | null>(null);
  const lock = useRef(false);
  const [resultCode, setResultCode] = useState('');
  const frame = useRef(0); const retry = useRef<{ token: string; id: string } | null>(null);
  const [token, setToken] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [camera, setCamera] = useState(false);
  function stop() { cancelAnimationFrame(frame.current); stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; setCamera(false); }
  useEffect(() => () => { cancelAnimationFrame(frame.current); stream.current?.getTracks().forEach(t => t.stop()); }, []);
  async function validate(value: string) {
    if (lock.current) return;
    lock.current = true; setBusy(true); stop();
    const attempt = retry.current?.token === value ? retry.current : { token: value, id: crypto.randomUUID() };
    retry.current = attempt;
    try { const result = await checkIn(sessionId, value, attempt.id); setResultCode(result.result); setMessage(labels[result.result] ?? labels.error); if (result.result !== 'error') { retry.current = null; setToken(''); } }
    catch { setResultCode('error'); setMessage(labels.error); }
    finally { lock.current = false; setBusy(false); }
  }
  async function start() {
    stop(); setMessage('');
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      stream.current = media;
      if (!video.current) { stop(); return; }
      video.current.srcObject = media; await video.current.play(); setCamera(true);
      const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const scan = () => {
        const v = video.current;
        if (!v || !stream.current || !ctx) return;
        if (v.readyState >= 2 && v.videoWidth) {
          canvas.width = Math.min(v.videoWidth, 720); canvas.height = Math.round(v.videoHeight * canvas.width / v.videoWidth);
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qr = jsQR(pixels.data, pixels.width, pixels.height);
          if (qr) { setToken(qr.data); void validate(qr.data); return; }
        }
        frame.current = requestAnimationFrame(scan);
      };
      frame.current = requestAnimationFrame(scan);
    } catch { stop(); setMessage('Não foi possível abrir a câmara. Podes utilizar um leitor externo.'); }
  }
  return <section className="space-y-4">
    <p>Validação online. Aguarda sempre a confirmação antes de permitir a entrada.</p>
    <video ref={video} muted playsInline className={`max-h-80 w-full rounded ${camera ? '' : 'hidden'}`} />
    <button className="rounded border px-4 py-2" disabled={busy} onClick={() => camera ? stop() : void start()}>{camera ? 'Parar câmara' : 'Ler QR com a câmara'}</button>
    <form onSubmit={e => { e.preventDefault(); void validate(token.trim()); }} className="flex gap-2">
      <input autoComplete="off" aria-label="Código lido pelo leitor QR" className="min-w-0 flex-1 rounded border p-2" value={token} onChange={e => setToken(e.target.value)} maxLength={100} />
      <button disabled={busy || !token} className="rounded bg-rose-600 px-4 py-2 text-white">Validar</button>
    </form><p role="status" className={`rounded border p-4 text-lg font-semibold ${resultCode === 'accepted' ? 'bg-green-100 text-green-950' : resultCode ? 'bg-amber-100 text-amber-950' : ''}`} >{busy ? 'A validar…' : message || 'Pronto para ler um bilhete.'}</p>
  </section>;
}
