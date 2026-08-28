import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Landmark, Users, HandHeart, Car, ArrowRight } from "lucide-react";

// Município e Freguesia passaram a ter uma porta de entrada pública
// própria, cada uma com a sua rota dedicada — /participar/municipio e
// /participar/freguesia (ver migration 20260828160000 e
// docs/PARCEIROS-ENTRADA.md) — não exigem conta prévia, por isso ficam
// sempre visíveis aqui, autenticado ou não. Os restantes tipos mantêm o
// fluxo original: entram com email/password e só depois escolhem o tipo.
const TIPOS_PUBLICOS = [
  {
    href: "/participar/municipio",
    icon: Landmark,
    titulo: "Município",
    descricao: "Câmara Municipal — registo público, sem conta prévia.",
  },
  {
    href: "/participar/freguesia",
    icon: Users,
    titulo: "Freguesia",
    descricao: "Junta de Freguesia — registo público, sem conta prévia.",
  },
];

const TIPOS_AUTENTICADOS = [
  {
    href: "/parceiros/pedido/organismo-publico",
    icon: HandHeart,
    titulo: "Outro organismo público",
    descricao: "Direção Regional, Instituição de Ensino, Centro de Investigação, Casa do Povo...",
  },
  {
    href: "/parceiros/pedido",
    icon: Users,
    titulo: "Outra entidade",
    descricao: "Associação, Cooperativa, Produtor ou Empresa parceira.",
  },
  {
    href: "/parceiros/pedido/stand-automovel",
    icon: Car,
    titulo: "Stand Automóvel",
    descricao: "Comerciante de viaturas — acesso ao contacto direto entre stands no StandGo.",
  },
];

export default async function ParceirosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-terra-50">
      <div className="mx-auto max-w-2xl p-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Entidades parceiras</CardTitle>
            <CardDescription>
              Juntas de Freguesia, Municípios, Cooperativas, Associações,
              Organizações de Produtores e outras instituições ou empresas
              parceiras do O Tio do Joca.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium text-terra-800">
                Município ou Freguesia? Registo directo, sem precisar de conta:
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {TIPOS_PUBLICOS.map((tipo) => (
                  <Link
                    key={tipo.href}
                    href={tipo.href}
                    className="flex flex-col gap-1 rounded-lg border border-terra-300 bg-terra-50 p-4 hover:border-terra-500"
                  >
                    <tipo.icon className="mb-1 h-6 w-6 text-terra-600" />
                    <span className="font-semibold text-terra-900">{tipo.titulo}</span>
                    <span className="text-xs text-terra-600">{tipo.descricao}</span>
                  </Link>
                ))}
              </div>
              <Link
                href="/participar"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-terra-600 hover:text-terra-800"
              >
                Ir para a página de registo institucional <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="border-t border-terra-100 pt-6">
              <p className="text-sm leading-relaxed text-terra-700">
                Para os restantes tipos de entidade, entra com{" "}
                <strong>email e palavra-passe</strong>, tal como qualquer
                utilizador individual. Depois de entrares, escolhes abaixo o
                tipo de entidade e a nossa equipa valida o pedido.
              </p>
              <div className="mt-3 rounded-lg border border-terra-200 bg-terra-50 p-3 text-sm text-terra-700">
                Brevemente vamos também permitir a entrada por{" "}
                <strong>SSO com o email institucional</strong> da tua
                organização (Google Workspace ou Microsoft 365 do domínio da
                entidade). Essa opção ainda não está activa — por agora, usa o
                teu email e palavra-passe normalmente.
              </div>

              {user ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {TIPOS_AUTENTICADOS.map((tipo) => (
                    <Link
                      key={tipo.href}
                      href={tipo.href}
                      className="flex flex-col gap-1 rounded-lg border border-terra-200 p-4 hover:border-terra-400 hover:bg-terra-50"
                    >
                      <tipo.icon className="mb-1 h-6 w-6 text-terra-600" />
                      <span className="font-semibold text-terra-900">{tipo.titulo}</span>
                      <span className="text-xs text-terra-600">{tipo.descricao}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button asChild size="lg">
                      <Link href="/login">Já tenho conta — Entrar</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                      <Link href="/registo">Ainda não tenho — Criar conta</Link>
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-terra-500">
                    Depois de entrares ou criares conta, volta a esta página
                    para escolheres o tipo de entidade e pedires a associação.
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
