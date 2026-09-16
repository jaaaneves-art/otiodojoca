import { describe, expect, it } from 'vitest';
import { positiveInteger, profileData, safeWebsite, safePortfolioImage } from './validation';
function form() {
  const f = new FormData();
  for (const [key, value] of Object.entries({ nome: 'Festas Lusas', pais_codigo: 'LU', localidade: 'Luxemburgo', servicos: 'catering', tipos: 'casamentos' })) f.append(key, value);
  return f;
}
describe('perfil profissional Eventos & Festas', () => {
  it('usa imagens da infraestrutura OTJ sem alargar a política de conteúdos', () => { expect(safePortfolioImage('https://storage.example/a.jpg', 'https://storage.example')).toBe('https://storage.example/a.jpg'); expect(safePortfolioImage('https://outro.example/a.jpg', 'https://storage.example')).toBeUndefined(); });
  it('aceita uma empresa estrangeira sem freguesia portuguesa', () => { expect(profileData(form()).dados).toMatchObject({ pais_codigo: 'LU', freguesia_id: null, localidade: 'Luxemburgo' }); });
  it('rejeita associação territorial portuguesa numa sede estrangeira', () => { const f = form(); f.set('freguesia_id', '12'); expect(() => profileData(f)).toThrow('estrangeiro'); });
  it('ignora campos administrativos enviados pelo cliente', () => { const f = form(); f.set('verificada', 'true'); f.set('profile_id', 'outro'); expect(profileData(f).dados).not.toHaveProperty('verificada'); expect(profileData(f).dados).not.toHaveProperty('profile_id'); });
  it('preserva várias especialidades sem duplicar seleções', () => { const f = form(); f.append('servicos', 'dj'); f.append('servicos', 'dj'); f.append('tipos', 'conferencia'); expect(profileData(f)).toMatchObject({ servicos: ['catering', 'dj'], tipos: ['casamentos', 'conferencia'] }); });
  it('rejeita URLs executáveis e imagens sem HTTPS', () => { const f = form(); f.set('website', 'javascript:alert(1)'); expect(() => profileData(f)).toThrow(); f.set('website', 'https://empresa.example'); f.set('fotografias', 'http://empresa.example/a.jpg'); expect(() => profileData(f)).toThrow(); });
  it('exige seleções, limites e números seguros', () => { const f = form(); f.delete('servicos'); expect(() => profileData(f)).toThrow(); expect(positiveInteger('1e3')).toBeNull(); expect(positiveInteger('9007199254740993')).toBeNull(); expect(positiveInteger('23')).toBe(23); });
  it('não permite credenciais nem esquemas alternativos nos contactos', () => { expect(safeWebsite('https://user:pass@example.test')).toBeUndefined(); expect(safeWebsite('data:text/html,hi')).toBeUndefined(); expect(safeWebsite('https://example.test')).toBe('https://example.test/'); });
});
