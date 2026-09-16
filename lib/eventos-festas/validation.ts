export function safeWebsite(value: unknown): string | undefined {
  if (typeof value !== 'string') return;
  try { const url = new URL(value); if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) return url.href; } catch { /* URL inválida */ }
}
export function one(value: string | string[] | undefined) { return (Array.isArray(value) ? value[0] : value) ?? ''; }
export function positiveInteger(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const n = Number(value); return Number.isSafeInteger(n) && n > 0 ? n : null;
}
export function safePortfolioImage(value: unknown, storageUrl: string | undefined): string | undefined {
  const url = safeWebsite(value);
  if (!url || !storageUrl || !url.startsWith('https://')) return;
  try { if (new URL(url).origin === new URL(storageUrl).origin) return url; } catch { /* origem inválida */ }
}
export function profileData(form: FormData, storageUrl?: string) {
  const text = (key: string, max: number) => {
    const value = form.get(key);
    if (value !== null && typeof value !== 'string') throw new Error('Campo inválido.');
    const result = (value ?? '').trim();
    if (result.length > max) throw new Error('Um dos campos excede o tamanho permitido.');
    return result;
  };
  const nome = text('nome', 200);
  const pais_codigo = text('pais_codigo', 2).toUpperCase();
  const localidade = text('localidade', 200);
  const freguesia = text('freguesia_id', 20);
  const capacidade = text('capacidade', 7);
  if (nome.length < 2 || !/^[A-Z]{2}$/.test(pais_codigo)) throw new Error('Indique o nome e um código de país válido.');
  if ((freguesia && !positiveInteger(freguesia)) || (capacidade && (!positiveInteger(capacidade) || Number(capacidade) > 1000000))) throw new Error('Freguesia ou capacidade inválida.');
  if (!localidade && !freguesia) throw new Error('Indique a localidade ou a freguesia.');
  if (pais_codigo !== 'PT' && (freguesia || !localidade)) throw new Error('No estrangeiro, indique a localidade e deixe a freguesia portuguesa vazia.');
  const website = text('website', 2000);
  const email = text('email', 254);
  if (website && !safeWebsite(website)) throw new Error('Indique um website HTTP ou HTTPS válido.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email público inválido.');
  const fotografias = text('fotografias', 24000).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (fotografias.length > 12 || fotografias.some(url => url.length > 2000 || !safeWebsite(url)?.startsWith('https://'))) throw new Error('Use até 12 endereços HTTPS de imagens.');
  if (storageUrl && fotografias.some(url => !safePortfolioImage(url, storageUrl))) throw new Error('Use imagens já alojadas no OTJ.');
  const redes_sociais: Record<string, string> = {};
  for (const key of ['instagram', 'facebook', 'linkedin']) {
    const url = text(key, 2000);
    if (url && !safeWebsite(url)?.startsWith('https://')) throw new Error('Use HTTPS nas redes sociais.');
    if (url) redes_sociais[key] = url;
  }
  const selections = (key: string, max: number) => {
    const values = [...new Set(form.getAll(key))];
    if (!values.length || values.length > max || values.some(v => typeof v !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v))) throw new Error('Escolha pelo menos um serviço e um tipo de evento.');
    return values as string[];
  };
  return {
    dados: { nome, pais_codigo, localidade, freguesia_id: freguesia || null, capacidade: capacidade || null,
      descricao: text('descricao', 10000), telefone: text('telefone', 80), email, website,
      regiao: text('regiao', 200), lugar: text('lugar', 500), area_servico: text('area_servico', 1000), fotografias, redes_sociais },
    servicos: selections('servicos', 80), tipos: selections('tipos', 60),
  };
}
