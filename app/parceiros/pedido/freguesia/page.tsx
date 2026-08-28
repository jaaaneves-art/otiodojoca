import { redirect } from "next/navigation";

// Ver comentário em app/parceiros/pedido/municipio/page.tsx — mesma
// consolidação, agora para Freguesia.
export default function PedidoFreguesiaPage() {
  redirect("/participar/freguesia");
}
