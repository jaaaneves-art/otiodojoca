import Link from "next/link";
import { ShieldCheck, Sparkles, Landmark, Users, ArrowRight } from "lucide-react";

// Página de escolha — o wizard de registo deixou de viver aqui.
// Município e Freguesia passaram a ter rotas dedicadas, cada uma com o
// seu próprio wizard de 4 passos (sem passo de escolha de tipo, porque a
// rota já o determina): /participar/municipio e /participar/freguesia.
// Esta página fica só com o Hero, os indicadores de confiança, os dois
// cartões de escolha e o "Como funciona" — sem precisar de carregar
// municípios/freguesias do Supabase.

export const metadata = {
  title: "Participar — O Tio do Joca",
  description:
    "Junte o seu Município ou Freguesia à rede do OTJ. Registo institucional simples, seguro e sujeito a validação.",
};

const INDICADORES = [
  { texto: "Registo simples" },
  { texto: "Acesso institucional" },
  { texto: "Validação segura" },
];

const OPCOES = [
  {
    href: "/participar/municipio",
    icon: Landmark,
    titulo: "Município",
    subtitulo: "Câmara Municipal",
    descricao: "Registo institucional para a Câmara Municipal do seu concelho.",
  },
  {
    href: "/participar/freguesia",
    icon: Users,
    titulo: "Freguesia",
    subtitulo: "Junta de Freguesia",
    descricao: "Registo institucional para a Junta de Freguesia da sua freguesia.",
  },
];

export default function ParticiparPage() {
  return (
    <div className="min-h-screen bg-terra-50">
      <header className="border-b border-terra-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-terra-900">
            O Tio do Joca
          </Link>
          <div className="flex items-center gap-4 text-sm text-terra-600">
            <Link href="/parceiros" className="hidden hover:text-terra-900 sm:inline">
              Outras entidades parceiras
            </Link>
            <Link href="/login" className="font-medium text-terra-800 hover:text-terra-900">
              Já é parceiro? Entrar
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="lg:sticky lg:top-16 lg:self-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-terra-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-terra-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Participar
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-terra-900 sm:text-5xl">
                Faça parte do OTJ
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-terra-600 sm:text-lg">
                Junte o seu Município ou Freguesia a uma rede criada para aproximar as
                comunidades, o território e as pessoas.
              </p>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                {INDICADORES.map((i) => (
                  <li key={i.texto} className="flex items-center gap-2 text-sm text-terra-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-terra-500" aria-hidden="true" />
                    {i.texto}
                  </li>
                ))}
              </ul>

              <div className="mt-12 hidden lg:block" aria-hidden="true">
                <RedeTerritorialIlustracao />
              </div>
            </div>

            <div className="flex flex-col justify-center gap-5">
              <p className="text-sm font-medium text-terra-700">
                Que entidade pretende registar?
              </p>
              {OPCOES.map((op) => (
                <Link
                  key={op.href}
                  href={op.href}
                  className="group flex items-center gap-5 rounded-3xl border border-terra-200 bg-white p-6 shadow-sm transition hover:border-terra-400 hover:shadow-md sm:p-8"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-terra-100 text-terra-700 transition group-hover:bg-terra-600 group-hover:text-white">
                    <op.icon className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-terra-900">{op.titulo}</h2>
                      <span className="rounded-full bg-terra-50 px-2.5 py-0.5 text-xs font-medium text-terra-500">
                        {op.subtitulo}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-terra-600">{op.descricao}</p>
                  </div>
                  <ArrowRight
                    className="h-5 w-5 shrink-0 text-terra-400 transition group-hover:translate-x-1 group-hover:text-terra-700"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-terra-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="text-center text-2xl font-bold text-terra-900">Como funciona</h2>
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <PassoConfianca
                numero="1"
                titulo="Pedido"
                texto="Preenche o registo institucional — leva só alguns minutos."
              />
              <PassoConfianca
                numero="2"
                titulo="Validação"
                texto="A nossa equipa confirma os dados da entidade antes de avançar."
              />
              <PassoConfianca
                numero="3"
                titulo="Acesso institucional"
                texto="Enviamos para o email institucional as instruções de acesso à plataforma."
              />
            </div>

            <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-terra-200 bg-terra-50 p-5 text-center text-sm text-terra-600">
              <ShieldCheck className="mx-auto mb-2 h-5 w-5 text-terra-700" aria-hidden="true" />
              Os dados do responsável pela informação não ficam publicamente acessíveis — são
              usados apenas para gestão da entidade e acesso institucional.
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/parceiros"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-terra-700 hover:text-terra-900"
              >
                <Landmark className="h-4 w-4" aria-hidden="true" />
                Representa outro tipo de organismo público, associação ou empresa?
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-terra-200 py-8 text-center text-xs text-terra-400">
        O Tio do Joca — Almanaque da Comunidade
      </footer>
    </div>
  );
}

function PassoConfianca({ numero, titulo, texto }: { numero: string; titulo: string; texto: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-terra-100 text-sm font-semibold text-terra-700">
        {numero}
      </div>
      <h3 className="mt-3 font-semibold text-terra-900">{titulo}</h3>
      <p className="mt-1 text-sm leading-6 text-terra-600">{texto}</p>
    </div>
  );
}

// Ilustração própria e discreta — uma "rede territorial" de pontos e
// linhas orgânicas, em vez de uma fotografia genérica de banco de
// imagens (secção 9 do pedido). Puramente decorativa, por isso
// aria-hidden no contentor que a envolve.
function RedeTerritorialIlustracao() {
  return (
    <svg viewBox="0 0 320 200" fill="none" className="w-full max-w-sm text-terra-300">
      <g stroke="currentColor" strokeWidth="1.5" opacity="0.6">
        <path d="M40 150 C 90 100, 140 170, 190 110 S 280 60, 300 90" />
        <path d="M60 40 C 100 70, 130 40, 170 60 S 240 110, 260 150" />
      </g>
      <g fill="currentColor">
        <circle cx="40" cy="150" r="5" />
        <circle cx="190" cy="110" r="7" className="text-terra-500" fill="currentColor" />
        <circle cx="300" cy="90" r="4" />
        <circle cx="60" cy="40" r="4" />
        <circle cx="170" cy="60" r="6" className="text-terra-500" fill="currentColor" />
        <circle cx="260" cy="150" r="5" />
      </g>
    </svg>
  );
}
