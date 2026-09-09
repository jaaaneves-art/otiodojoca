// app/mediacao/novo/page.tsx
//
// Página de teste — mesma lógica de app/retailing/novo/page.tsx, para
// o módulo Mediação. Criada em 07/09/2026 só para destravar o teste
// manual.
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MediacaoForm } from '@/components/marketplace/mediacao-form';

export default async function NovoMediacaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <MediacaoForm userId={user.id} modo="criar" />;
}
