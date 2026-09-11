// components/marketplace/mediacao-form.tsx
// CORRIGIDO 08/09/2026 — ver retailing-form.tsx para a nota sobre
// Textarea/CAE; a mesma correção aplica-se aqui.
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CaeAutocomplete } from '@/components/marketplace/cae-autocomplete';
import { criarMediacao, atualizarMediacao } from '@/lib/marketplace/mediacao-actions';
import {
  MediacaoFormData,
  CATEGORIA_MEDIACAO,
  CATEGORIA_NOMES,
  TIPOS_SEGUROS,
  TIPOS_CREDITO,
  SEGURADORAS,
  BANCOS,
  CERTIFICACOES,
  CategoriaMediacao,
  MediacaoDisplay,
} from '@/lib/marketplace/mediacao-tipos';

const TEXTAREA_CLASS =
  'flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent';

interface MediacaoFormProps {
  userId: string;
  modo: 'criar' | 'editar';
  categoriaPadrao?: CategoriaMediacao;
  perfilExistente?: MediacaoDisplay;
}

export function MediacaoForm({ userId, modo, categoriaPadrao = 'mediacao_seguros', perfilExistente }: MediacaoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState(perfilExistente?.nome || '');
  const [categoria, setCategoria] = useState<CategoriaMediacao>(perfilExistente?.categoria || categoriaPadrao);
  const [descricao, setDescricao] = useState(perfilExistente?.descricao || '');
  const [cae, setCae] = useState(perfilExistente?.cae || '');
  const [telefone, setTelefone] = useState(perfilExistente?.telefone || '');
  const [email, setEmail] = useState(perfilExistente?.email || '');
  const [endereco, setEndereco] = useState(perfilExistente?.endereco || '');
  const [profissionais, setProfissionais] = useState(perfilExistente?.profissionais || '');

  const [especialidades, setEspecialidades] = useState<string[]>(perfilExistente?.especialidades || []);
  const [parceiros, setParceiros] = useState<string[]>(perfilExistente?.parceiros || []);
  const [certificacoes, setCertificacoes] = useState<string[]>(perfilExistente?.certificacoes || []);

  const [horarios, setHorarios] = useState(
    perfilExistente?.horarios || {
      seg: '09:00-18:00',
      ter: '09:00-18:00',
      qua: '09:00-18:00',
      qui: '09:00-18:00',
      sex: '09:00-18:00',
      sab: '09:00-13:00',
      dom: '',
    }
  );

  const [aceita_consulta_online, setAceitaConsultaOnline] = useState(perfilExistente?.aceita_consulta_online ?? true);
  const [link_agendamento, setLinkAgendamento] = useState(perfilExistente?.link_agendamento || '');
  const [taxa_media_cobrada, setTaxaMediaCobrada] = useState(perfilExistente?.taxa_media_cobrada?.toString() || '');

  const [fotos, setFotos] = useState<File[]>([]);

  const especialidadesDisponiveis = useMemo(() => (categoria === 'mediacao_seguros' ? TIPOS_SEGUROS : TIPOS_CREDITO), [categoria]);
  const parceirosDiponiveis = useMemo(() => (categoria === 'mediacao_seguros' ? SEGURADORAS : BANCOS), [categoria]);

  const toggleEspecialidade = (esp: string) => {
    setEspecialidades((prev) => (prev.includes(esp) ? prev.filter((e) => e !== esp) : [...prev, esp]));
  };

  const toggleParceiro = (parceiro: string) => {
    setParceiros((prev) => (prev.includes(parceiro) ? prev.filter((p) => p !== parceiro) : [...prev, parceiro]));
  };

  const toggleCertificacao = (cert: string) => {
    setCertificacoes((prev) => (prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]));
  };

  const handleFotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novos = Array.from(e.target.files || []);
    setFotos((prev) => [...prev, ...novos].slice(0, 5));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const dados: MediacaoFormData = {
        nome,
        categoria,
        descricao,
        cae: cae || undefined,
        telefone,
        email,
        endereco,
        profissionais,
        especialidades,
        parceiros,
        certificacoes: certificacoes as MediacaoFormData['certificacoes'],
        horarios,
        aceita_consulta_online,
        link_agendamento: link_agendamento || undefined,
        taxa_media_cobrada: taxa_media_cobrada ? parseFloat(taxa_media_cobrada) : undefined,
        fotos: fotos.length > 0 ? fotos : undefined,
      };

      const resultado =
        modo === 'criar' ? await criarMediacao(dados) : await atualizarMediacao(perfilExistente!.id, dados);

      if (resultado.sucesso) {
        router.push('/mediacao/' + categoria + '/' + resultado.id);
        router.refresh();
      } else {
        setErro(resultado.erro || 'Erro desconhecido');
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao processar form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{modo === 'criar' ? 'Novo Mediador' : 'Editar Perfil'}</h1>

      {erro && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">{erro}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECÇÃO 1: Identificação */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Identificação</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Serviço *</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaMediacao)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                {CATEGORIA_MEDIACAO.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORIA_NOMES[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nome / Razão Social *</label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Mediações Silvério, Lda."
                required
                minLength={5}
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">5-100 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreve a tua experiência, especialidade, etc."
                maxLength={500}
                rows={4}
                className={TEXTAREA_CLASS}
              />
              <p className="text-xs text-gray-500 mt-1">{descricao.length}/500 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="cae">
                Atividade Económica (CAE)
              </label>
              <CaeAutocomplete id="cae" value={cae} onChange={setCae} />
            </div>
          </div>
        </Card>

        {/* SECÇÃO 2: Contacto */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Contacto</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Telefone *</label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="912345678"
                required
                pattern="(\d{9}|\+351\d{9})"
              />
              <p className="text-xs text-gray-500 mt-1">9 dígitos ou +351</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contacto@mediacao.com" required />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Endereço Completo *</label>
              <Input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número, localidade, código postal"
                required
                minLength={10}
                maxLength={200}
              />
            </div>
          </div>
        </Card>

        {/* SECÇÃO 3: Especialidades */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">{categoria === 'mediacao_seguros' ? 'Tipos de Seguros' : 'Tipos de Crédito'} *</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {especialidadesDisponiveis.map((esp) => (
              <label key={esp} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={especialidades.includes(esp)} onChange={() => toggleEspecialidade(esp)} className="rounded" />
                <span className="text-sm">{esp}</span>
              </label>
            ))}
          </div>

          {especialidades.length === 0 && <p className="text-sm text-red-600 mt-2">Escolhe pelo menos uma especialidade</p>}
        </Card>

        {/* SECÇÃO 4: Parceiros */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">{categoria === 'mediacao_seguros' ? 'Seguradoras' : 'Bancos'} *</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {parceirosDiponiveis.map((parceiro) => (
              <label key={parceiro} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={parceiros.includes(parceiro)} onChange={() => toggleParceiro(parceiro)} className="rounded" />
                <span className="text-sm">{parceiro}</span>
              </label>
            ))}
          </div>

          {parceiros.length === 0 && <p className="text-sm text-red-600 mt-2">Escolhe pelo menos um parceiro</p>}
        </Card>

        {/* SECÇÃO 5: Certificações */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Certificações Profissionais *</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CERTIFICACOES.map((cert) => (
              <label key={cert} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={certificacoes.includes(cert)} onChange={() => toggleCertificacao(cert)} className="rounded" />
                <span className="text-xs">{cert}</span>
              </label>
            ))}
          </div>

          {certificacoes.length === 0 && <p className="text-sm text-red-600 mt-2">Escolhe pelo menos uma certificação</p>}
        </Card>

        {/* SECÇÃO 6: Equipa */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Equipa</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Mediadores / Profissionais</label>
            <textarea
              value={profissionais}
              onChange={(e) => setProfissionais(e.target.value)}
              placeholder={'João Silva (CORRETORA)\nMaria Santos (AGENTE)'}
              rows={3}
              maxLength={500}
              className={TEXTAREA_CLASS}
            />
            <p className="text-xs text-gray-500 mt-1">Um por linha, máximo 500 caracteres</p>
          </div>
        </Card>

        {/* SECÇÃO 7: Horários */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Horários</h2>

          <div className="space-y-3">
            {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map((dia) => (
              <div key={dia}>
                <label className="block text-sm font-medium mb-1 capitalize">
                  {dia === 'seg' && 'Segunda'}
                  {dia === 'ter' && 'Terça'}
                  {dia === 'qua' && 'Quarta'}
                  {dia === 'qui' && 'Quinta'}
                  {dia === 'sex' && 'Sexta'}
                  {dia === 'sab' && 'Sábado'}
                  {dia === 'dom' && 'Domingo'}
                </label>
                <Input
                  value={horarios[dia as keyof typeof horarios] || ''}
                  onChange={(e) => setHorarios((prev) => ({ ...prev, [dia]: e.target.value }))}
                  placeholder="09:00-18:00 (opcional)"
                  pattern="\d{2}:\d{2}-\d{2}:\d{2}"
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-4">Formato: HH:MM-HH:MM (ex: 09:00-18:00). Deixa em branco se fechado.</p>
        </Card>

        {/* SECÇÃO 8: Consulta Online & Taxa */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Informações Comerciais</h2>

          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aceita_consulta_online}
                onChange={(e) => setAceitaConsultaOnline(e.target.checked)}
                className="rounded"
              />
              <span>Ofereces consultas online</span>
            </label>

            {aceita_consulta_online && (
              <div>
                <label className="block text-sm font-medium mb-1">Link para Agendamento</label>
                <Input
                  type="url"
                  value={link_agendamento}
                  onChange={(e) => setLinkAgendamento(e.target.value)}
                  placeholder="https://calendly.com/seu-mediador"
                />
                <p className="text-xs text-gray-500 mt-1">Calendly, Agend.ar, etc</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Taxa Média Cobrada (%)</label>
              <Input
                type="number"
                value={taxa_media_cobrada}
                onChange={(e) => setTaxaMediaCobrada(e.target.value)}
                placeholder="Ex: 2.5"
                step="0.1"
                min="0"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">Percentagem aproximada (opcional)</p>
            </div>
          </div>
        </Card>

        {/* SECÇÃO 9: Certificados */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Certificados/Documentos</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Upload de Certificados (máximo 5)</label>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFotosChange}
              disabled={fotos.length >= 5}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />

            {fotos.length > 0 && (
              <div className="mt-4 space-y-2">
                {fotos.map((foto, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{foto.name}</span>
                    <button
                      type="button"
                      onClick={() => setFotos((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">{fotos.length}/5 documentos selecionados</p>
          </div>
        </Card>

        {/* Botões */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading} size="lg" className="flex-1 bg-blue-600 hover:bg-blue-700">
            {loading ? 'Processando...' : modo === 'criar' ? 'Criar Perfil' : 'Atualizar Perfil'}
          </Button>

          <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
