// app/consultorios/novo/page.tsx
//
// Página de teste — mesma lógica de app/retailing/novo/page.tsx, para
// o módulo Consultórios. A pasta perdeu o acento em 08/09/2026 (rota
// passou a "/consultorios") porque o Next.js/Turbopack dava 404 na
// rota acentuada neste ambiente (o nome de ficheiro já estava em NFC,
// não era normalização Unicode); ver
// docs/pendentes/RETAILING-CAE-CORRECAO-20260908.md. router.push() em
// consultorio-form.tsx e revalidatePath() em consultorio-actions.ts
// foram atualizados a par.
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ConsultorioForm } from '@/components/marketplace/consultorio-form';

export default async function NovoConsultorioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <ConsultorioForm userId={user.id} modo="criar" />;
}
