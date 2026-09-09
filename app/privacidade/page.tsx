import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade — O Tio do Joca",
  description:
    "Como o O Tio do Joca recolhe, usa e protege os teus dados pessoais.",
};

export default function PoliticaPrivacidadePage() {
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
          <h1 className="text-3xl font-bold">Política de Privacidade</h1>
          <p className="text-sm text-terra-500">Última atualização: 9 de setembro de 2026</p>
        </header>

        <section className="space-y-3">
          <p>
            Esta Política de Privacidade explica como a plataforma{" "}
            <strong>O Tio do Joca</strong> (&quot;a Plataforma&quot;, &quot;nós&quot;) recolhe, usa,
            partilha e protege os dados pessoais dos seus utilizadores, em
            conformidade com o Regulamento Geral sobre a Proteção de Dados
            (RGPD — Regulamento (UE) 2016/679) e demais legislação
            portuguesa aplicável.
          </p>
          <p>
            O Tio do Joca é um projeto em desenvolvimento (fase beta) que
            reúne conteúdos e serviços ligados à cultura, à vida rural e à
            comunidade portuguesa: fórum, mercado local, imóveis, viaturas,
            eventos e módulos afins.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Quem é o responsável pelo tratamento</h2>
          <p>
            O responsável pelo tratamento dos dados pessoais recolhidos
            nesta Plataforma é o promotor do projeto O Tio do Joca. Para
            qualquer questão relacionada com privacidade e proteção de
            dados, podes contactar-nos através de{" "}
            <a href="mailto:jaaaneves@gmail.com" className="underline">
              jaaaneves@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Que dados recolhemos</h2>
          <p>Consoante a forma como utilizas a Plataforma, podemos recolher:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Dados de registo e conta:</strong> nome de utilizador,
              email, palavra-passe (encriptada), nome apresentado, biografia,
              localização e fotografia de perfil, todos fornecidos por ti.
            </li>
            <li>
              <strong>Início de sessão por terceiros (Google / Facebook):</strong>{" "}
              se optares por entrar através da tua conta Google ou Facebook,
              recebemos do fornecedor o teu nome, endereço de email e,
              quando disponível, a fotografia associada a essa conta — nunca
              a tua palavra-passe dessas contas.
            </li>
            <li>
              <strong>Conteúdo que publicas:</strong> mensagens de fórum,
              anúncios, comentários, avaliações e mensagens privadas
              trocadas com outros utilizadores.
            </li>
            <li>
              <strong>Dados técnicos:</strong> endereço IP, tipo de
              dispositivo/navegador e registos de utilização, usados para
              segurança, deteção de abuso e diagnóstico técnico.
            </li>
            <li>
              <strong>Verificação em duas etapas (MFA):</strong> se
              ativares esta funcionalidade, é guardado o estado da
              verificação (não guardamos o código secreto da tua app de
              autenticação — esse fica apenas no teu dispositivo).
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Para que usamos os teus dados, e com que base jurídica</h2>
          <p>
            O RGPD exige que cada finalidade tenha uma base jurídica
            específica (artigo 6.º, n.º 1). É esta a correspondência:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Criar e gerir a tua conta, autenticação e MFA</strong> —
              execução do contrato que aceitas ao registares-te (al. b)),
              complementada por interesse legítimo na segurança da conta
              (al. f)).
            </li>
            <li>
              <strong>Disponibilizar as funcionalidades que usas</strong>{" "}
              (fórum, mercado, mensagens, eventos, entre outras) — execução
              do contrato (al. b)).
            </li>
            <li>
              <strong>Emails operacionais</strong> (confirmação de conta,
              recuperação de password, notificações que ativares) —
              execução do contrato (al. b)).
            </li>
            <li>
              <strong>Prevenção de fraude, abuso e violações das regras da
              comunidade</strong> — interesse legítimo (al. f)), ponderado
              para não prevalecer indevidamente sobre os teus direitos.
            </li>
            <li>
              <strong>Cumprimento de obrigações legais</strong> (ex:
              resposta a uma ordem judicial ou de autoridade competente) —
              obrigação legal (al. c)).
            </li>
          </ul>
          <p>
            Não tomamos decisões automatizadas, incluindo definição de
            perfis (profiling), que produzam efeitos jurídicos ou
            similarmente significativos sobre ti. Não vendemos os teus
            dados pessoais a terceiros, nem os usamos para publicidade
            comportamental.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Com quem partilhamos dados</h2>
          <p>
            Recorremos a alguns prestadores de serviços que tratam dados em
            nosso nome, apenas para operar a Plataforma:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Supabase</strong> — base de dados, autenticação e alojamento de ficheiros;</li>
            <li><strong>SendGrid</strong> — envio de emails transacionais (confirmação de conta, recuperação de password);</li>
            <li><strong>Vercel</strong> — alojamento da aplicação web;</li>
            <li><strong>Google e/ou Meta (Facebook)</strong> — apenas se optares por entrar através dessas contas.</li>
          </ul>
          <p>
            Estes prestadores só têm acesso aos dados estritamente
            necessários para prestar o respetivo serviço e estão contratual
            ou tecnicamente limitados quanto ao seu uso.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Transferências internacionais de dados</h2>
          <p>
            Alguns dos prestadores listados na secção anterior (nomeadamente
            Vercel, SendGrid, e Google/Meta quando usas o início de sessão
            por essas contas) podem processar ou armazenar dados em
            servidores localizados fora do Espaço Económico Europeu,
            tipicamente nos Estados Unidos. Quando isso acontece, a
            transferência é feita ao abrigo de um mecanismo de salvaguarda
            reconhecido pelo RGPD — normalmente Cláusulas Contratuais-Tipo
            aprovadas pela Comissão Europeia, ou uma decisão de adequação
            aplicável ao país de destino.
          </p>
          <p>
            Ainda estamos a confirmar e a documentar, prestador a
            prestador, a região exata onde os dados ficam alojados; essa
            informação será atualizada aqui assim que consolidada.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Cookies</h2>
          <p>
            Usamos apenas cookies essenciais, necessários para manter a tua
            sessão iniciada e para o funcionamento da autenticação. Não
            usamos cookies de publicidade ou de rastreio de terceiros.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Quanto tempo guardamos os teus dados</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Dados de conta e perfil:</strong> enquanto a conta
              estiver ativa. Após pedido de eliminação, apagados ou
              anonimizados no prazo de 30 dias, salvo o indicado a seguir.
            </li>
            <li>
              <strong>Registos de auditoria de segurança</strong> (ex:
              tentativas de autenticação, envio de emails): conservados por
              90 dias, para efeitos de deteção de fraude e resposta a
              incidentes, ao abrigo do interesse legítimo referido na
              secção 3.
            </li>
            <li>
              <strong>Conteúdo publicado</strong> (mensagens de fórum,
              anúncios): pode manter-se visível após a eliminação da conta
              caso outros utilizadores tenham interagido com ele (ex:
              respostas num tópico), salvo pedido explícito de remoção.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Os teus direitos</h2>
          <p>Ao abrigo do RGPD, tens direito a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Aceder aos dados pessoais que temos sobre ti;</li>
            <li>Retificar dados incorretos ou desatualizados;</li>
            <li>Solicitar o apagamento dos teus dados (&quot;direito ao esquecimento&quot;);</li>
            <li>Solicitar a limitação ou opor-te a determinados tratamentos;</li>
            <li>Solicitar a portabilidade dos teus dados;</li>
            <li>
              Apresentar reclamação junto da Comissão Nacional de Proteção
              de Dados (CNPD), autoridade de controlo em Portugal.
            </li>
          </ul>
          <p>
            Muitos destes pedidos podem ser feitos diretamente na tua página
            de perfil (edição de dados, remoção de fatores de MFA). Para os
            restantes, contacta-nos através do email indicado na secção 1.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Segurança</h2>
          <p>
            Aplicamos medidas técnicas e organizativas para proteger os
            teus dados, incluindo palavras-passe encriptadas, controlo de
            acesso à base de dados (Row Level Security), verificação em
            duas etapas (MFA) opcional/obrigatória consoante o tipo de
            conta, e registos de auditoria de ações sensíveis.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Menores de idade</h2>
          <p>
            A Plataforma, no seu uso geral, não se destina a crianças. Em
            módulos específicos ligados a atividades de grupos juvenis (ex:
            escutismo), pedimos a data de nascimento para determinar
            automaticamente se és menor de idade; se fores, a tua
            participação (ex: pedido de adesão a um grupo) fica dependente
            da aprovação de um encarregado de educação, em vez de ser
            processada automaticamente. A data de nascimento não é visível
            publicamente e o acesso a esse dado é restrito ao necessário
            para essa verificação.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">11. Alterações a esta política</h2>
          <p>
            Podemos atualizar esta política à medida que a Plataforma
            evoluir. A data no topo desta página indica a versão mais
            recente. Alterações relevantes serão comunicadas através da
            própria Plataforma.
          </p>
        </section>
      </main>
    </div>
  );
}
