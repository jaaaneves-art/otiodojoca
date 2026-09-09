"use client";
export default function MessagesError({ reset }: { reset: () => void }) {
  return <div role="alert" className="space-y-3"><p>Não foi possível carregar as mensagens. Tenta novamente dentro de momentos.</p><button className="underline" onClick={reset}>Tentar novamente</button></div>;
}
