// app/retailing/novo/page.tsx
//
// Página de teste — permite abrir o formulário do Retailing no browser
// para testar a criação de um estabelecimento. Segue o mesmo padrão
// das outras páginas do projeto (createClient + auth.getUser +
// redirect se não houver sessão). Criada em 07/09/2026 só para
// destravar o teste manual — não é a Fase 2/3 do plano original
// (hub, listagem, card, página de detalhe continuam por fazer).
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RetailingForm } from '@/components/marketplace/retailing-form';

export default async function NovoRetailingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <RetailingForm userId={user.id} modo="criar" />;
}
