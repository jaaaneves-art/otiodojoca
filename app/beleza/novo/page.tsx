// app/beleza/novo/page.tsx
//
// Página de teste — mesma lógica de app/retailing/novo/page.tsx, para
// o módulo Beleza. Criada em 07/09/2026 só para destravar o teste
// manual.
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BelezaForm } from '@/components/marketplace/beleza-form';

export default async function NovoBelezaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <BelezaForm userId={user.id} modo="criar" />;
}
