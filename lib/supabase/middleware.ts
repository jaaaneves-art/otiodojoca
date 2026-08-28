import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rotas públicas: nunca exigem sessão nem MFA.
// (login, registo, recuperação de password, callback de email/OAuth)
const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/registo",
  "/forgot-password",
  "/reset-password",
  "/auth",
];

// Secções de conteúdo público -- qualquer visitante pode ver a página
// inicial, navegar os módulos de marketplace, ler o fórum, o almanaque,
// etc., sem sessão nenhuma.
//
// Bug corrigido em 2026-08-27: antes disto, NENHUMA destas secções estava
// listada como pública -- incluindo a própria "/". Um visitante sem conta
// era mandado para /login só por tentar ver a homepage, o que tornava
// impossível navegar o site sem te registares primeiro. Errado para uma
// plataforma comunitária pública (o objetivo do gate de MFA sempre foi
// proteger ações/dados pessoais, não bloquear a leitura pública).
const PUBLIC_CONTENT_PREFIXES = [
  "/almanaque",
  "/alojamento",
  "/calendario",
  "/comer",
  "/forum",
  "/freguesia",
  "/gran-bazar",
  "/imoveis",
  "/lup",
  "/mercado-da-terra",
  "/parceiros",
  "/viaturas",
];

// Dentro das secções públicas acima, estes segmentos continuam sempre a
// exigir sessão -- são ações pessoais (publicar, editar, mensagens,
// favoritos, "os meus anúncios", pedidos de parceria), nunca leitura
// pública, mesmo que vivam debaixo de um prefixo público (ex:
// "/gran-bazar/novo").
const PRIVATE_ACTION_SEGMENTS = [
  "/novo",
  "/editar",
  "/mensagens",
  "/messages",
  "/favoritos",
  "/meus-anuncios",
  "/pedido",
];

// Rotas do próprio fluxo de MFA: exigem sessão (AAL1) mas não AAL2 --
// é precisamente aqui que se completa o AAL2.
const MFA_PATH_PREFIXES = ["/mfa/setup", "/mfa/verify"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isPublicContentRoute(pathname: string) {
  if (pathname === "/") return true;
  if (!matchesPrefix(pathname, PUBLIC_CONTENT_PREFIXES)) return false;
  return !PRIVATE_ACTION_SEGMENTS.some((seg) => pathname.includes(seg));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANTE: não correr código entre createServerClient() e getUser().
  // Um erro aqui pode causar logouts aleatórios e imprevisíveis para os
  // utilizadores (ver documentação do @supabase/ssr).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  // Rotas de API: mantemos apenas o refresh de sessão/cookies. A
  // autorização de cada endpoint é feita no próprio route handler + RLS,
  // nunca só aqui (um redirect HTML quebraria uma resposta JSON).
  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  // Rotas totalmente públicas (login/registo/etc.) e conteúdo público
  // (homepage, módulos de marketplace, fórum, almanaque, ...).
  if (matchesPrefix(pathname, PUBLIC_PATH_PREFIXES) || isPublicContentRoute(pathname)) {
    return supabaseResponse;
  }

  // Sem sessão válida -> login, preservando o destino pretendido.
  if (!user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(redirectUrl);
  }

  // Sessão válida: verificar o nível de segurança (AAL) da sessão atual.
  const { data: aal, error: aalError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aalError) {
    // Não foi possível determinar o AAL -> por segurança, tratar como
    // não autenticado em vez de deixar passar.
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(redirectUrl);
  }

  const mfaSatisfied = aal.currentLevel === "aal2";
  // Tem um fator MFA verificado, mas esta sessão ainda não completou o
  // desafio (currentLevel ainda não subiu a aal2).
  const mfaPending = aal.nextLevel === "aal2" && aal.currentLevel !== "aal2";
  // Não tem nenhum fator MFA verificado -- para "moderator"/"admin" o MFA
  // continua obrigatório; para "user" é opcional (ver abaixo).
  const mfaNotEnrolled = aal.nextLevel !== "aal2";

  if (matchesPrefix(pathname, MFA_PATH_PREFIXES)) {
    // Já cumpriu o AAL2 -- não há razão para estar no fluxo de MFA.
    if (mfaSatisfied) {
      return NextResponse.redirect(new URL("/perfil", request.url));
    }
    // Está em /mfa/verify mas ainda não tem nenhum fator configurado.
    if (pathname.startsWith("/mfa/verify") && mfaNotEnrolled) {
      const redirectUrl = new URL("/mfa/setup", request.url);
      const next = request.nextUrl.searchParams.get("next");
      if (next) redirectUrl.searchParams.set("next", next);
      return NextResponse.redirect(redirectUrl);
    }
    // Está em /mfa/setup mas já tem fator verificado, só falta o desafio.
    if (pathname.startsWith("/mfa/setup") && mfaPending) {
      const redirectUrl = new URL("/mfa/verify", request.url);
      const next = request.nextUrl.searchParams.get("next");
      if (next) redirectUrl.searchParams.set("next", next);
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  // Qualquer outra rota (privada, por omissão) exige AAL2 -- com uma
  // exceção: utilizadores de nível "user" (não moderator/admin) só são
  // obrigados a passar pelo /mfa/setup uma vez; se dispensarem ("Agora
  // não"), deixamos de os forçar a configurar o MFA.
  if (mfaNotEnrolled) {
    let enrollmentRequired = true;
    let dismissed = false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, mfa_setup_dismissed_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      // Só o nível "user" tem o MFA opcional. Sem perfil encontrado,
      // mantemos o comportamento seguro (obrigatório).
      enrollmentRequired = profile.role !== "user";
      dismissed = profile.mfa_setup_dismissed_at !== null;
    }

    if (enrollmentRequired || !dismissed) {
      const redirectUrl = new URL("/mfa/setup", request.url);
      redirectUrl.searchParams.set("next", pathname + search);
      return NextResponse.redirect(redirectUrl);
    }
    // Opcional e já dispensado anteriormente -- deixa passar.
  } else if (mfaPending) {
    const redirectUrl = new URL("/mfa/verify", request.url);
    redirectUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
