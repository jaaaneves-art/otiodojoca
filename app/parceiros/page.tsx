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
import { Landmark, Building2, Users, HandHeart } from "lucide-react";

const TIPOS = [
  {
    href: "/parceiros/pedido/municipio",
    icon: Landmark,
    titulo: "Municipio",
    descricao: "Camara Municipal.",
  },
  {
    href: "/parceiros/pedido/freguesia",
    icon: Building2,
    titulo: "Freguesia",
    descricao: "Junta de Freguesia.",
  },
  {
    href: "/parceiros/pedido/organismo-publico",
    icon: HandHeart,
    titulo: "Outro organismo publico",
    descricao: "Direcao Regional, Instituicao de Ensino, Centro de Investigacao, Casa do Povo...",
  },
  {
    href: "/parceiros/pedido",
    icon: Users,
    titulo: "Outra entidade",
    descricao: "Associacao, Cooperativa, Produtor ou Empresa parceira.",
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
              Juntas de Freguesia, Municipios, Cooperativas, Associacoes,
              Organizacoes de Produtores e outras instituicoes ou empresas
              parceiras do O Tio do Joca.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-terra-700">
              As entidades parceiras entram com{" "}
              <strong>email e palavra-passe</strong>, tal como qualquer
              utilizador individual. Depois de entrares, escolhes abaixo o
              tipo de entidade e a nossa equipa valida o pedido.
            </p>
            <div className="rounded-lg border border-terra-200 bg-terra-50 p-3 text-sm text-terra-700">
              Brevemente vamos tambem permitir a entrada por{" "}
              <strong>SSO com o email institucional</strong> da tua
              organizacao (Google Workspace ou Microsoft 365 do dominio da
              entidade). Essa opcao ainda nao esta ativa — por agora, usa o
              teu email e palavra-passe normalmente.
            </div>

            {user ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {TIPOS.map((tipo) => (
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button asChild size="lg">
                    <Link href="/login">Ja tenho conta — Entrar</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/registo">Ainda nao tenho — Criar conta</Link>
                  </Button>
                </div>
                <p className="text-xs text-terra-500">
                  Depois de entrares ou criares conta, volta a esta pagina
                  para escolheres o tipo de entidade e pedires a associacao.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
