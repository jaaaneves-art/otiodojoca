import Link from "next/link";

export const metadata = {
  title: "Eliminar os meus dados — O Tio do Joca",
  description:
    "Como pedir a eliminação da tua conta e dos teus dados pessoais na plataforma O Tio do Joca.",
};

export default function EliminarDadosPage() {
  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-terra-800">
            Almanaque
          </Link>
          <Link href="/" className="text-sm text-terra-600 hover:text-terra-800">
            Voltar ao início
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-6 py-10 space-y-8 text-terra-800">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Eliminar os meus dados</h1>
          <p className="text-sm text-terra-500">Última atualização: 11 de setembro de 2026</p>
        </header>

        <section className="space-y-3">
          <p>
            Tens o direito de pedir, a qualquer momento, a eliminação da tua
            conta e dos dados pessoais associados a ela na plataforma{" "}
            <strong>O Tio do Joca</strong>, incluindo se entraste através da
            tua conta Google ou Facebook. Esta página explica como o fazer,
            de acordo com a nossa{" "}
            <Link href="/privacidade" className="underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Como pedir a eliminação</h2>
          <p>
            Envia um email para{" "}
            <a href="mailto:jaaaneves@gmail.com" className="underline">
              jaaaneves@gmail.com
            </a>{" "}
            a partir do endereço de email associado à tua conta, com o
            assunto <strong>&quot;Eliminar conta&quot;</strong>, indicando o
            nome de utilizador ou email da conta a eliminar.
          </p>
          <p>
            Confirmamos a receção do pedido e procedemos à eliminação no
            prazo máximo de <strong>30 dias</strong>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">O que é eliminado</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Dados de conta e perfil: nome de utilizador, email,
              palavra-passe, nome apresentado, biografia, localização e
              fotografia de perfil;
            </li>
            <li>Fatores de verificação em duas etapas (MFA) associados à conta;</li>
            <li>
              Anúncios, favoritos e conversas privadas de que és o único
              participante.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">O que pode ser mantido, e porquê</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Registos de auditoria de segurança</strong>{" "}
              (ex: tentativas de autenticação, envio de emails): mantidos
              até 90 dias após a eliminação, para deteção de fraude e
              resposta a incidentes, ao abrigo de interesse legítimo — ver
              a secção 3 e 7 da{" "}
              <Link href="/privacidade" className="underline">
                Política de Privacidade
              </Link>
              ;
            </li>
            <li>
              <strong>Conteúdo publicado em conversas com outros
              utilizadores</strong> (ex: mensagens de fórum com respostas,
              ou conversas de mercado com outra pessoa): pode manter-se
              visível para preservar o contexto da conversa para a outra
              parte, mas deixa de estar associado à tua identidade — é
              anonimizado (ex: substituído por &quot;utilizador
              removido&quot;);
            </li>
            <li>
              <strong>Obrigações legais</strong>: dados que sejamos
              legalmente obrigados a conservar (ex: por ordem judicial) são
              mantidos apenas pelo tempo estritamente necessário para
              cumprir essa obrigação.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Login com Google ou Facebook</h2>
          <p>
            Eliminar a tua conta na Plataforma remove a ligação entre a tua
            conta Google/Facebook e o O Tio do Joca do nosso lado. Isto não
            elimina a tua conta Google ou Facebook em si — para gerir ou
            remover essas contas, usa as definições de privacidade
            diretamente no Google ou no Facebook.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Dúvidas</h2>
          <p>
            Para qualquer questão sobre este processo, contacta-nos através
            de{" "}
            <a href="mailto:jaaaneves@gmail.com" className="underline">
              jaaaneves@gmail.com
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
