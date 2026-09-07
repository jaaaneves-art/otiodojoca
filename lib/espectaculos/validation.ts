export function uuid(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new Error('Identificador inválido.');
  return value;
}
export function positiveId(value: unknown): number {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) throw new Error('Identificador inválido.');
  return n;
}
export function selection(form: FormData) {
  const items: { ticket_type_id: number; quantity: number }[] = [];
  for (const [key, value] of form.entries()) {
    if (!key.startsWith('quantity_')) continue;
    const quantity = Number(value);
    if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 100) throw new Error('Quantidade inválida.');
    if (quantity) items.push({ ticket_type_id: positiveId(key.slice(9)), quantity });
  }
  if (!items.length || items.length > 20 || items.reduce((sum, i) => sum + i.quantity, 0) > 100) throw new Error('Seleciona entre 1 e 100 bilhetes.');
  return items;
}
export function cents(value: unknown): number {
  const text = String(value ?? '').trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error('Preço inválido.');
  const [euros, fraction = ''] = text.split('.');
  const n = Number(euros) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(n) || n > 2147483647) throw new Error('Preço inválido.');
  return n;
}
