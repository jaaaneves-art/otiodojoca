import { redirect } from "next/navigation";

// Esta rota passou a ser servida por /participar/municipio — um formulário
// público dedicado (sem exigir login prévio), com o wizard de 4 passos
// próprio de Município. Mantemos o URL antigo vivo como redirect em vez de
// o apagar, para não partir marcadores/links já partilhados. O formulário
// anterior (autenticado, campo "cargo") continua disponível para os
// restantes tipos em /parceiros/pedido/*.
export default function PedidoMunicipioPage() {
  redirect("/participar/municipio");
}
