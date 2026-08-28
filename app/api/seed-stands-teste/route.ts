import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Cria (ou reaproveita) duas contas de teste já ativadas como Stand
// Automóvel verificado, para testar o contacto direto entre stands no
// StandGo sem ter de passar pelo fluxo completo de pedido + aprovação
// manual. Idempotente -- corre outra vez sem criar duplicados.
//
// Uso: POST http://localhost:3000/api/seed-stands-teste
//
// Mesma proteção da rota app/api/seed/route.ts: só corre em
// development, bloqueada (404) fora disso -- nunca deve correr em
// produção, cria contas reais com password conhecida.

const STANDS_TESTE = [
  {
    email: "stand.lisboa@teste.otiodojoca.local",
    password: "TesteStand123!",
    display_name: "Lisboa Motors",
    location: "Lisboa",
    codigo_atividade: "45110",
  },
  {
    email: "stand.porto@teste.otiodojoca.local",
    password: "TesteStand123!",
    display_name: "Porto Auto Comércio",
    location: "Porto",
    codigo_atividade: "45191",
  },
];

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { success: false, error: "Não disponível em produção." },
      { status: 404 }
    );
  }

  try {
    const supabase = createAdminClient();
    const resultado = [];

    for (const stand of STANDS_TESTE) {
      const { data: existente } = await supabase
        .from("profiles")
        .select("id, username, display_name, is_stand_automovel")
        .eq("email", stand.email)
        .maybeSingle();

      let profileId: string;

      if (existente) {
        profileId = existente.id;
      } else {
        const { data: novoUser, error: erroUser } = await supabase.auth.admin.createUser({
          email: stand.email,
          password: stand.password,
          email_confirm: true,
          user_metadata: { display_name: stand.display_name },
        });

        if (erroUser || !novoUser?.user) {
          throw new Error(`Erro ao criar utilizador ${stand.email}: ${erroUser?.message}`);
        }

        profileId = novoUser.user.id;
      }

      // O trigger handle_new_user já criou a linha em profiles a partir
      // do raw_user_meta_data -- aqui só ativamos o acesso StandGo e
      // dispensamos o ecrã de configuração de MFA (mfa_setup_dismissed_at),
      // para o login de teste ir direto ao StandGo em vez de parar no QR.
      const { error: erroUpdate } = await supabase
        .from("profiles")
        .update({
          is_stand_automovel: true,
          location: stand.location,
          mfa_setup_dismissed_at: new Date().toISOString(),
        })
        .eq("id", profileId);

      if (erroUpdate) {
        throw new Error(`Erro ao ativar stand ${stand.email}: ${erroUpdate.message}`);
      }

      // Pedido de entidade correspondente, já aprovado -- só para o
      // histórico em /admin/entidades ficar consistente com a realidade
      // (a ativação acima já aconteceu diretamente, isto não repete-a).
      const { data: pedidoExistente } = await supabase
        .from("entidade_pedidos")
        .select("id")
        .eq("profile_id", profileId)
        .eq("tipo_entidade", "stand_automovel")
        .maybeSingle();

      if (!pedidoExistente) {
        await supabase.from("entidade_pedidos").insert({
          profile_id: profileId,
          tipo_entidade: "stand_automovel",
          nome_entidade: stand.display_name,
          codigo_atividade: stand.codigo_atividade,
          contacto_email: stand.email,
          estado: "aprovado",
          resolvido_em: new Date().toISOString(),
          mensagem: "Conta de teste criada via /api/seed-stands-teste",
        });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, display_name, is_stand_automovel")
        .eq("id", profileId)
        .single();

      resultado.push({ email: stand.email, password: stand.password, ...profile });
    }

    return NextResponse.json({
      success: true,
      data: resultado,
      message: "Entra em cada conta com o email e password devolvidos.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
