// lib/marketplace/mensagens-actions.ts
//
// Fusão de app/gran-bazar/mensagens/actions.ts e
// app/mercado-da-terra/messages/actions.ts. Ver
// docs/pendentes/RELATORIO-BACKEND-API-BLOCO6-20260823.md, secção 10
// (Duplicação-01, 🔵 FUNDIR).
//
// Cada módulo mantém o seu próprio app/<modulo>/<rota>/actions.ts como
// wrapper fino, só a chamar estas funções com `module` e `routeSegment`
// fixos (routeSegment porque os dois módulos usam nomes de rota diferentes:
// "mensagens" no Gran Bazar, "messages" no Mercado da Terra). Sem
// "use server" aqui de propósito, pela mesma razão de favoritos-actions.ts.
//
// Correção incluída nesta fusão: a versão do Mercado da Terra não validava
// que o anúncio pertencia mesmo ao módulo antes de abrir conversa — só a
// versão do Gran Bazar tinha `ad.module !== "gran-bazar"`. Na prática dava
// para iniciar conversa a partir de um adId de qualquer outro módulo. A
// verificação `ad.module !== module` abaixo aplica-se agora aos dois lados.

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function startConversationAction(
  module: string,
  routeSegment: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Utilizador nao autenticado');
  }

  const adId = parseInt(formData.get('adId') as string);
  const content = (formData.get('content') as string)?.trim();

  if (!adId || !content) {
    throw new Error('Dados invalidos');
  }

  const { data: ad, error: adError } = await supabase
    .from('marketplace_ads')
    .select('author_id, module')
    .eq('id', adId)
    .single();

  if (adError || !ad || ad.module !== module) {
    throw new Error('Anuncio nao encontrado');
  }

  if (ad.author_id === user.id) {
    throw new Error('Nao podes enviar mensagem para o teu proprio anuncio');
  }

  const { data: existing } = await supabase
    .from('marketplace_conversations')
    .select('id')
    .eq('ad_id', adId)
    .eq('buyer_id', user.id)
    .maybeSingle();

  let conversationId: number;

  if (existing) {
    conversationId = existing.id;
  } else {
    const { data: newConv, error: convError } = await supabase
      .from('marketplace_conversations')
      .insert({ ad_id: adId, buyer_id: user.id, seller_id: ad.author_id })
      .select('id')
      .single();

    if (convError || !newConv) {
      throw new Error('Erro ao iniciar conversa');
    }

    conversationId = newConv.id;
  }

  const { error: msgError } = await supabase
    .from('marketplace_messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, content });

  if (msgError) {
    throw new Error('Erro ao enviar mensagem');
  }

  await supabase
    .from('marketplace_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  redirect(`/${module}/${routeSegment}/${conversationId}`);
}

export async function sendMessageAction(
  module: string,
  routeSegment: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Utilizador nao autenticado');
  }

  const conversationId = parseInt(formData.get('conversationId') as string);
  const content = (formData.get('content') as string)?.trim();

  if (!conversationId || !content) {
    throw new Error('Dados invalidos');
  }

  const { data: conv } = await supabase
    .from('marketplace_conversations')
    .select('id')
    .eq('id', conversationId)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single();

  if (!conv) {
    throw new Error('Conversa nao encontrada');
  }

  const { error } = await supabase
    .from('marketplace_messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, content });

  if (error) {
    throw new Error('Erro ao enviar mensagem');
  }

  await supabase
    .from('marketplace_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  revalidatePath(`/${module}/${routeSegment}/${conversationId}`);
  revalidatePath(`/${module}/${routeSegment}`);
}

export async function markAsReadAction(
  module: string,
  routeSegment: string,
  conversationId: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from('marketplace_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .is('read_at', null);

  // Sem revalidatePath aqui de propósito: esta função é chamada durante o
  // render da página da conversa (app/<modulo>/<rota>/[id]/page.tsx), e o
  // Next.js 16 não permite revalidatePath durante o render -- dá "used
  // revalidatePath ... during render which is unsupported" (mesmo bug
  // encontrado e corrigido em Gran Bazar, Imóveis, Lup, Mercado da Terra e
  // Viaturas em 28/08/2026 -- ver claude/STANDGO-STANDS-VERIFICADOS-
  // CONTACTO-DIRETO-20260828.md, projeto Claude "otj"). O próprio pedido
  // já traz os dados frescos; a lista de conversas de cada módulo já corre
  // sempre dinâmica (usa auth/cookies), não fica em cache.
}
