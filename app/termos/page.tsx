import Link from "next/link";

export const metadata = {
  title: "Termos de Utilização — O Tio do Joca",
  description:
    "Termos e condições de utilização da plataforma O Tio do Joca.",
};

export default function TermosPage() {
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
          <h1 className="text-3xl font-bold">Termos de Utilização</h1>
          <p className="text-sm text-terra-500">Última atualização: 11 de setembro de 2026</p>
        </header>

        <section className="space-y-3">
          <p>
            Estes Termos de Utilização (&quot;Termos&quot;) regulam o acesso e uso
            da plataforma <strong>O Tio do Joca</strong> (&quot;a Plataforma&quot;,
            &quot;nós&quot;). Ao criares uma conta ou utilizares a Plataforma, aceitas
            estes Termos. Se não concordares, não deves utilizar a Plataforma.
          </p>
          <p>
            O Tio do Joca é um projeto em desenvolvimento (fase beta) que
            reúne conteúdos e serviços ligados à cultura, à vida rural e à
            comunidade portuguesa: fórum, mercado local, imóveis, viaturas,
            eventos e módulos afins. Algumas funcionalidades podem mudar,
            ser adicionadas ou removidas enquanto o projeto evolui.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Quem pode usar a Plataforma</h2>
          <p>
            É necessário ter capacidade legal para aceitar estes Termos. Em
            módulos específicos ligados a atividades de grupos juvenis (ex:
            escutismo), a participação de menores de idade depende da
            aprovação de um encarregado de educação, conforme descrito na{" "}
            <Link href="/privacidade" className="underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. A tua conta</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              És responsável por manter a confidencialidade da tua
              palavra-passe e por toda a atividade realizada a partir da tua
              conta.
            </li>
            <li>
              As informações que forneces no registo e no perfil devem ser
              verdadeiras e mantidas atualizadas.
            </li>
            <li>
              Podes eliminar a tua conta e os teus dados a qualquer momento
              — ver a página{" "}
              <Link href="/eliminar-dados" className="underline">
                Eliminar os meus dados
              </Link>
              .
            </li>
            <li>
              Reservamo-nos o direito de suspender ou encerrar contas que
              violem estes Termos, sem prejuízo de outras medidas legalmente
              previstas.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Regras da comunidade</h2>
          <p>Ao utilizares a Plataforma, comprometes-te a não:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Publicar conteúdo ilegal, difamatório, discriminatório,
              violento ou que viole direitos de terceiros (incluindo
              propriedade intelectual);
            </li>
            <li>
              Assediar, ameaçar ou enganar outros utilizadores;
            </li>
            <li>
              Publicar anúncios ou conteúdo fraudulento, ou usar a
              Plataforma para atividades ilegais;
            </li>
            <li>
              Tentar aceder a contas de outros utilizadores ou contornar
              medidas de segurança (incluindo a verificação em duas etapas);
            </li>
            <li>
              Usar meios automatizados (bots, scraping) para recolher dados
              da Plataforma sem autorização.
            </li>
          </ul>
          <p>
            Conteúdo ou contas que violem estas regras podem ser removidos
            ou suspensos, a nosso critério, sem aviso prévio em casos
            graves.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Conteúdo publicado por ti</h2>
          <p>
            Manténs a titularidade do conteúdo que publicas (anúncios,
            mensagens de fórum, fotografias, comentários). Ao publicares,
            concedes à Plataforma uma licença não exclusiva para o
            apresentar e distribuir dentro da Plataforma, na medida
            necessária para prestar o serviço. És o único responsável pelo
            conteúdo que publicas e pela veracidade das informações que
            fornecer, nomeadamente em anúncios de venda, troca ou aluguer.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Módulos de mercado e anúncios entre utilizadores</h2>
          <p>
            Módulos como Mercado da Terra, Gran Bazar, Imóveis, Lup ou
            Viaturas permitem que utilizadores publiquem anúncios e
            contactem entre si diretamente. A Plataforma não é parte nessas
            negociações, não garante a veracidade dos anúncios, a qualidade
            dos bens/serviços anunciados, nem a idoneidade dos
            utilizadores, e não medeia pagamentos entre particulares
            (exceto no módulo Espetáculos, quando o processamento de
            pagamentos via Stripe estiver ativo — ver{" "}
            <Link href="/privacidade" className="underline">
              Política de Privacidade
            </Link>
            ). Recomendamos precaução habitual em transações com
            desconhecidos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Propriedade intelectual da Plataforma</h2>
          <p>
            O nome, o design, o código e os conteúdos originais da
            Plataforma (excluindo o conteúdo publicado pelos utilizadores)
            pertencem ao promotor do projeto O Tio do Joca e não podem ser
            copiados ou reutilizados sem autorização, salvo o permitido por
            lei.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Isenção de garantias e limitação de responsabilidade</h2>
          <p>
            A Plataforma é fornecida &quot;tal como está&quot;, em fase beta,
            sem garantias de disponibilidade contínua, ausência de erros ou
            adequação a um fim específico. Na medida permitida por lei, não
            somos responsáveis por danos indiretos resultantes do uso da
            Plataforma ou de interações entre utilizadores. Nada nestes
            Termos limita direitos que não possam ser limitados ao abrigo
            da lei portuguesa aplicável, incluindo os direitos dos
            consumidores.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Alterações a estes Termos</h2>
          <p>
            Podemos atualizar estes Termos à medida que a Plataforma
            evoluir. A data no topo desta página indica a versão mais
            recente. O uso continuado da Plataforma após uma alteração
            implica a aceitação dos novos Termos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Lei aplicável</h2>
          <p>
            Estes Termos regem-se pela lei portuguesa. Em caso de litígio,
            é competente o foro legalmente previsto para consumidores
            residentes em Portugal.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Contacto</h2>
          <p>
            Para qualquer questão sobre estes Termos, contacta-nos através
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
