import { money } from '@/lib/espectaculos/types';
import { dateTime } from '@/lib/espectaculos/presentation';
export type SalesRow = { session_id: number; starts_at: string; sold: number; reserved: number; available: number; gross_cents?: number; refunds_cents?: number; net_before_provider_cents?: number };
export function SalesSummary({ rows }: { rows: SalesRow[] }) {
 const total = rows.reduce((a,r) => ({ sold: a.sold + Number(r.sold), reserved: a.reserved + Number(r.reserved), available: a.available + Number(r.available) }), { sold: 0, reserved: 0, available: 0 });
 const financial = rows.length > 0 && rows.every(r => r.gross_cents !== undefined);
 const gross = rows.reduce((sum, r) => sum + Number(r.gross_cents ?? 0), 0);
 const refunds = rows.reduce((sum, r) => sum + Number(r.refunds_cents ?? 0), 0);
 const net = rows.reduce((sum, r) => sum + Number(r.net_before_provider_cents ?? 0), 0);
 return <section className="space-y-3 rounded-xl border bg-white p-4"><h2 className="text-xl font-bold">Resumo de vendas</h2><p>Evento: {total.sold} vendidos · {total.reserved} reservados · {total.available} disponíveis</p>
 {financial && <p>Total do evento: receita bruta {money(gross)} · reembolsos {money(refunds)} · líquido estimado antes dos custos do prestador {money(net)}</p>}
 {!rows.length && <p>Sem sessões.</p>}{rows.map(r => <div className="border-t pt-3" key={r.session_id}><h3 className="font-semibold">{dateTime(r.starts_at)}</h3><p>{r.sold} vendidos · {r.reserved} reservados · {r.available} disponíveis</p>{r.gross_cents !== undefined && <><p>Receita bruta: {money(r.gross_cents)} · Reembolsos: {money(r.refunds_cents ?? 0)}</p><p>Líquido estimado antes dos custos do prestador: {money(r.net_before_provider_cents ?? 0)}</p></>}</div>)}<p className="text-sm text-slate-600">Vendidos inclui stock comprometido que não é reposto após reembolso. Disponíveis indica stock; a abertura das vendas depende do estado e das datas da sessão. O líquido é uma estimativa, sujeita a arredondamentos e reconciliação das comissões.</p></section>;
}
