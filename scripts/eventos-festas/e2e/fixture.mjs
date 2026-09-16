import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
// Catálogo lido da migration: sem segunda taxonomia mantida nos testes.
const sql = readFileSync('supabase/migrations/20260915203000_eventos_festas_profissionais_v1.sql', 'utf8');
function rows(table, columns) {
  const match = sql.match(new RegExp(`INSERT INTO public\\.${table}\\(${columns}\\) VALUES\\n([\\s\\S]*?);`));
  return match[1].split('\n').map(line => [...line.matchAll(/'((?:''|[^'])*)'/g)].map(m => m[1].replaceAll("''", "'")));
}
const categorias = rows('eventos_festas_categorias', 'slug,nome').map(([slug, nome]) => ({ slug, nome }));
const servicos = rows('eventos_festas_servicos', 'slug,nome,nota').map(([slug, nome, nota]) => ({ slug, nome, nota }));
const tipos = [...rows('eventos_festas_tipos', 'slug,nome').map(([slug, nome]) => ({ slug, nome, grupo_slug: null })), ...rows('eventos_festas_tipos', 'slug,nome,grupo_slug').map(([slug, nome, grupo_slug]) => ({ slug, nome, grupo_slug }))];
const relations = sql.match(/INSERT INTO public.eventos_festas_servico_categorias VALUES\n([\s\S]*?);/)[1];
const relacoes = relations.split('\n').map(line => { const [servico_slug, categoria_slug] = [...line.matchAll(/'([^']+)'/g)].map(m => m[1]); return { servico_slug, categoria_slug }; });
const owner = '11111111-1111-4111-8111-111111111111';
let managed; let unavailable = false;
function reset() { managed = { id: 1, slug: 'quinta-lusa', nome: 'Quinta Lusa', descricao: 'Espaço para casamentos e celebrações em Lisboa.', pais_codigo: 'PT', localidade: 'Lisboa', regiao: 'Lisboa', freguesia_id: null, fotografias: [], redes_sociais: {}, telefone: '+351 210 000 000', email: 'publico@example.test', website: 'https://example.test', capacidade: 200, area_servico: 'Lisboa e arredores', estado: 'ativo', estado_entidade: 'publicado', verificada: false, servicos: ['catering', 'fotografia-de-casamento'], tipos: ['casamentos'] }; unavailable = false; }
reset();
function publicRow() { return { ...managed, id: undefined, estado: undefined, estado_entidade: undefined, servicos: servicos.filter(s => managed.servicos.includes(s.slug)), tipos: tipos.filter(t => managed.tipos.includes(t.slug)), categorias: ['catering', 'fotografia'], freguesia: null, concelho: 'Lisboa', distrito: 'Lisboa' }; }
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:4327'); let body = ''; for await (const part of req) body += part;
  const p = body ? JSON.parse(body) : {};
  function send(data, status = 200) { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
  if (url.pathname === '/__fixture/reset') { reset(); return send({ ok: true }); }
  if (url.pathname === '/__fixture/unavailable') { unavailable = true; return send({ ok: true }); }
  let sub; try { sub = JSON.parse(Buffer.from((req.headers.authorization ?? '').split('.')[1], 'base64url').toString()).sub; } catch { /* anonymous */ }
  if (url.pathname === '/auth/v1/user') return sub ? send({ id: sub, email: 'PRIVATE-OWNER@example.test', factors: [], app_metadata: { provider: 'email' }, user_metadata: {} }) : send({ message: 'No session' }, 401);
  if (unavailable) return send({ message: 'Fixture unavailable', code: 'PGRST205' }, 503);
  const table = url.pathname.split('/').pop();
  if (url.pathname.includes('/rpc/')) {
    if (table === 'eventos_festas_admin') return send(false);
    if (table === 'eventos_festas_minhas_empresas') return send(sub === owner ? [managed] : []);
    if (table === 'eventos_festas_guardar') {
      if (sub !== owner) return send({ code: '42501', message: 'Sem autorização' }, 403);
      managed = { ...managed, ...p.p_dados, servicos: p.p_servicos, tipos: p.p_tipos, estado: p.p_submeter ? 'ativo' : 'rascunho' }; return send(1);
    }
    if (table === 'eventos_festas_pedir_acesso') return send(null);
    if (table === 'eventos_festas_pesquisar') {
      const row = publicRow();
      const match = managed.estado === 'ativo' && (!p.p_servico || managed.servicos.includes(p.p_servico)) && (!p.p_tipo || managed.tipos.includes(p.p_tipo)) && (!p.p_categoria || row.categorias.includes(p.p_categoria)) && (!p.p_pais || p.p_pais.toUpperCase() === managed.pais_codigo) && (!p.p_capacidade || Number(managed.capacidade) >= p.p_capacidade) && (!p.p_local || JSON.stringify(row).toLowerCase().includes(p.p_local.toLowerCase()));
      return send(match ? [row] : []);
    }
    return send({ message: `Unexpected RPC ${table}` }, 400);
  }
  let data = [];
  if (table === 'profiles') data = [{ id: sub, role: 'user', mfa_setup_dismissed_at: new Date().toISOString() }];
  if (table === 'eventos_festas_categorias') data = categorias;
  if (table === 'eventos_festas_servicos') data = servicos;
  if (table === 'eventos_festas_tipos') data = tipos;
  if (table === 'eventos_festas_servico_categorias') data = relacoes;
  if (table === 'eventos_festas_diretorio') data = managed.estado === 'ativo' ? [publicRow()] : [];
  if (table === 'entidades') data = [{ slug: managed.slug, nome: managed.nome }];
  for (const [key, value] of url.searchParams) if (value.startsWith('eq.') && !['ativo', 'estado'].includes(key)) data = data.filter(row => String(row[key]) === value.slice(3));
  if ((req.headers.accept ?? '').includes('vnd.pgrst.object')) return data.length === 1 ? send(data[0]) : send({ code: 'PGRST116', details: '0 rows' }, 406);
  return send(data);
}).listen(4327, '127.0.0.1');
