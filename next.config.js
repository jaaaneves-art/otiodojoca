/** @type {import('next').NextConfig} */
const nextConfig = {
  // Espetaculos Fase 6: a bateria E2E local (scripts/espectaculos/e2e/start.mjs)
  // arranca `next dev` no proprio root do projeto, mas com um distDir dedicado
  // para nao colidir com o `.next` do `next dev` normal nem com o build de
  // producao. So e ativado quando OTJ_ESPECTACULOS_E2E === "1".
  ...(process.env.OTJ_ESPECTACULOS_E2E === "1" ? { distDir: ".next-e2e" } : {}),
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    // Headers de segurança globais -- ver AUDITORIA-VALIDACAO-INDEPENDENTE-
    // 20260911.md, achado "Headers de segurança e configuração": não
    // existia nenhum header global de CSP/HSTS/etc.
    //
    // A CSP abaixo é um PONTO DE PARTIDA, não um valor final -- os
    // domínios do Supabase e do Stripe dependem do projeto/conta em uso.
    // Antes de aplicar em produção:
    //   1. confirmar NEXT_PUBLIC_SUPABASE_URL está definido no ambiente
    //      de build (já é exigido pelo resto da app);
    //   2. testar primeiro como "Content-Security-Policy-Report-Only"
    //      (trocar a key abaixo) num ambiente de staging, a navegar pelo
    //      site todo -- login/MFA, Stripe Checkout de Espetáculos, chat/
    //      chamadas do módulo social, upload de imagens dos marketplaces
    //      -- e só promover a "Content-Security-Policy" depois de não
    //      aparecerem violações inesperadas na consola;
    //   3. rever se o módulo social usa LiveKit ou outro serviço externo
    //      de chamadas em produção -- se sim, os domínios desse serviço
    //      têm de entrar em connect-src/media-src/frame-src também (não
    //      encontrei essa configuração neste pacote, pelo que não está
    //      incluída abaixo).
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseOrigin = supabaseUrl.replace(/\/$/, "");
    const supabaseWs = supabaseOrigin.replace(/^https:/, "wss:");

    const csp = [
      `default-src 'self'`,
      `base-uri 'self'`,
      `object-src 'none'`,
      `frame-ancestors 'self'`,
      // Next.js precisa de 'unsafe-inline' para os scripts de hidratação
      // que injeta inline; 'unsafe-eval' NÃO está incluído -- se o build
      // de produção falhar por causa disto, investigar a origem em vez
      // de reintroduzir 'unsafe-eval' às cegas.
      `script-src 'self' 'unsafe-inline' https://js.stripe.com`,
      // Tailwind/estilos inline -- 'unsafe-inline' aqui é um risco muito
      // menor do que em script-src.
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data: blob: ${supabaseOrigin}`,
      `font-src 'self' data:`,
      `connect-src 'self' ${supabaseOrigin} ${supabaseWs} https://api.stripe.com`,
      `frame-src 'self' https://js.stripe.com https://hooks.stripe.com`,
      `worker-src 'self'`,
      `manifest-src 'self'`,
      `media-src 'self' ${supabaseOrigin}`,
      `form-action 'self'`,
      `upgrade-insecure-requests`,
    ].join("; ");

    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      {
        // Aplica-se a todas as rotas. Next.js junta headers de blocos
        // diferentes que correspondam à mesma rota, por isso isto não
        // anula os headers específicos de "/sw.js" acima.
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            // camera=(self): o scanner de check-in de Espetáculos
            // (components/espectaculos/checkin-scanner.tsx) usa
            // getUserMedia(). Não encontrei uso de microfone/chamadas
            // neste pacote apesar de existirem tabelas call_rooms/
            // call_participants no schema social -- se essa
            // funcionalidade estiver ativa em produção, mudar
            // microphone=() para microphone=(self) também.
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), payment=(self)",
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      // Os formulários de anúncio (Mercado da Terra e Gran Bazar) enviam as
      // imagens como File dentro do FormData diretamente para o server
      // action (createBazarAd/updateBazarAd, etc.), sem passar por upload
      // separado. O limite por omissão do Next (1MB) rejeita isto assim que
      // há pelo menos uma foto real anexada — <ImageUpload maxFiles={5}
      // maxSizeMB={5}> permite até 5 imagens de 5MB cada, por isso o limite
      // tem de cobrir esse caso (com alguma margem para o overhead do
      // multipart/form-data). Se estes valores de maxFiles/maxSizeMB forem
      // alterados no futuro, rever este limite também.
      bodySizeLimit: "15mb",
    },
  },
};

module.exports = nextConfig;
