import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rotas públicas: nunca exigem sessão nem MFA.
// (página inicial, login, registo, recuperação de password, callback de
// email/OAuth) -- a página inicial ("/") é a montra pública do site: tem de
// abrir para visitantes não autenticados, com a caixa de entrar/criar conta,
// e não deve nunca forçar redirect para /login. Os módulos aqui listados são
// conteúdo informativo/institucional sem nenhuma rota de ação separada, por
// isso ficam públicos por inteiro (a árvore toda do prefixo).
const PUBLIC_PATH_PREFIXES = [
  "/",
  "/login",
  "/registo",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/forum",
  "/calendario",
  "/comer",
  "/alojamento",
  "/freguesia",
  "/freguesias",
];

// Módulos tipo "montra" (mercados/leilões): ver anúncios e detalhes é
// público -- só as ações que pressupõem conta (publicar, editar, mensagens,
// meus anúncios, favoritos, pedidos) continuam a exigir sessão. Registo só é
// obrigatório para interagir, nunca só para ver. A chave é o prefixo do
// módulo; o valor é a lista dos primeiros segmentos a seguir ao prefixo que
// ficam de fora do acesso público (todo o resto -- a listagem, "/leiloes",
// e a página de detalhe "/[id]" -- é público).
const PUBLIC_VIEW_MODULES: Record<string, string[]> = {
  "/gran-bazar": ["novo", "editar", "mensagens", "meus-anuncios", "favoritos"],
  "/imoveis": ["novo", "editar", "mensagens", "meus-anuncios", "favoritos"],
  "/lup": ["novo", "editar", "mensagens", "meus-anuncios", "favoritos"],
  "/viaturas": ["novo", "editar", "mensagens", "meus-anuncios", "favoritos"],
  "/mercado-da-terra": ["novo", "editar", "messages", "meus-anuncios", "favoritos"],
  "/almanaque": ["dashboard"],
  "/parceiros": ["pedido"],
};

// Rotas do próprio fluxo de MFA: exigem sessão (AAL1) mas não AAL2 --
// é precisamente aqui que se completa o AAL2.
const MFA_PATH_PREFIXES = ["/mfa/setup", "/mfa/verify"];

// Rotas do próprio fluxo de autenticação: nunca interceptar por causa de
// um desafio de MFA pendente, para não criar ciclos de redirect nem
// quebrar login/registo/recuperação de password/callback de email-OAuth.
const AUTH_FLOW_PREFIXES = [
  "/login",
  "/registo",
  "/forgot-password",
  "/reset-password",
  "/auth",
];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isPublicModuleView(pathname: string) {
  for (const [moduleRoot, privateSegments] of Object.entries(
    PUBLIC_VIEW_MODULES
  )) {
    if (pathname === moduleRoot) return true;
    if (pathname.startsWith(`${moduleRoot}/`)) {
      const firstSegment = pathname.slice(moduleRoot.length + 1).split("/")[0];
      return !privateSegments.includes(firstSegment);
    }
  }
  return false;
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

  // Sem sessão -> as rotas públicas continuam livres, o resto vai para
  // /login, preservando o destino pretendido.
  if (!user) {
    if (
      matchesPrefix(pathname, PUBLIC_PATH_PREFIXES) ||
      isPublicModuleView(pathname)
    ) {
      return supabaseResponse;
    }
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(redirectUrl);
  }

  // A partir daqui há sempre sessão. Verificamos o nível de segurança (AAL)
  // já aqui -- mesmo em rotas públicas -- porque um desafio de MFA
  // pendente (a conta já tem um fator verificado, mas esta sessão ainda
  // não completou o desafio) tem de ser resolvido logo a seguir ao login,
  // seja qual for o destino. Antes, isto só era verificado em rotas
  // privadas; como o destino por omissão do login passou a ser "/"
  // (pública, ver login-form.tsx), o pedido do código deixava de
  // acontecer -- bug reportado em 29/08/2026.
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
      return NextResponse.redirect(new URL("/", request.url));
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

  // Desafio de MFA pendente: resolve-se antes de mais nada, mesmo em
  // rotas públicas -- exceto as do próprio fluxo de autenticação, para não
  // criar ciclos nem interferir com login/registo/recuperação/callback.
  if (mfaPending && !matchesPrefix(pathname, AUTH_FLOW_PREFIXES)) {
    const redirectUrl = new URL("/mfa/verify", request.url);
    redirectUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(redirectUrl);
  }

  // Rotas totalmente públicas + páginas de visualização dos módulos tipo
  // montra (ver é público, interagir exige conta -- ver PUBLIC_VIEW_MODULES).
  // Chegam aqui já sem desafio de MFA por resolver.
  if (
    matchesPrefix(pathname, PUBLIC_PATH_PREFIXES) ||
    isPublicModuleView(pathname)
  ) {
    return supabaseResponse;
  }

  // Qualquer outra rota (privada, por omissão) exige MFA configurado --
  // com uma exceção: utilizadores de nível "user" (não moderator/admin) só
  // são obrigados a passar pelo /mfa/setup uma vez; se dispensarem ("Agora
  // não"), deixamos de os forçar a configurar o MFA. O caso de desafio
  // pendente (mfaPending) já foi tratado acima, antes da exceção pública.
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
  }

  return supabaseResponse;
}
