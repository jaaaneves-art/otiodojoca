// components/marketplace/retailing-form.tsx
//
// CORRIGIDO 08/09/2026 — só a camada de dados mudou (ver
// retailing-actions.ts/retailing-tipos.ts); os campos e o layout do
// formulário mantêm-se como no original. Duas alterações locais:
// `@/components/ui/textarea` não existe neste projeto (só existem
// badge/button/card/input em components/ui) — substituído por
// `<textarea>` simples com a mesma classe visual do Input; e foi
// acrescentado o campo de CAE (opcional) logo a seguir à Descrição.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CaeAutocomplete } from '@/components/marketplace/cae-autocomplete';
import { criarRetailing, atualizarRetailing } from '@/lib/marketplace/retailing-actions';
import {
  RetailingFormData,
  CATEGORIA_RETAILING,
  CATEGORIA_NOMES,
  DEPARTAMENTOS,
  SERVICOS_ADICIONAIS,
  PROGRAMAS_LEALDADE,
  CategoriaRetailing,
  RetailingDisplay,
} from '@/lib/marketplace/retailing-tipos';

const TEXTAREA_CLASS =
  'flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent';

interface RetailingFormProps {
  userId: string;
  modo: 'criar' | 'editar';
  categoriaPadrao?: CategoriaRetailing;
  estabelecimentoExistente?: RetailingDisplay;
}

const METODOS_PAGAMENTO_OPTIONS = [
  'Dinheiro',
  'Multibanco',
  'Cartão crédito',
  'Cartão débito',
  'MB Way',
  'Apple Pay',
  'Google Pay',
];

export function RetailingForm({
  userId,
  modo,
  categoriaPadrao = 'mercearia',
  estabelecimentoExistente,
}: RetailingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState(estabelecimentoExistente?.nome || '');
  const [categoria, setCategoria] = useState<CategoriaRetailing>(
    estabelecimentoExistente?.categoria || categoriaPadrao
  );
  const [descricao, setDescricao] = useState(estabelecimentoExistente?.descricao || '');
  const [cae, setCae] = useState(estabelecimentoExistente?.cae || '');
  const [telefone, setTelefone] = useState(estabelecimentoExistente?.telefone || '');
  const [email, setEmail] = useState(estabelecimentoExistente?.email || '');
  const [endereco, setEndereco] = useState(estabelecimentoExistente?.endereco || '');

  const [area_metros_quadrados, setAreaMetrosQuadrados] = useState(
    estabelecimentoExistente?.area_metros_quadrados?.toString() || ''
  );
  const [ano_abertura, setAnoAbertura] = useState(
    estabelecimentoExistente?.ano_abertura?.toString() || ''
  );

  const [departamentos, setDepartamentos] = useState<string[]>(
    estabelecimentoExistente?.departamentos || []
  );
  const [servicos_adicionais, setServicosAdicionais] = useState<string[]>(
    estabelecimentoExistente?.servicos_adicionais || []
  );

  const [programa_lealdade, setProgramaLealdade] = useState(
    estabelecimentoExistente?.programa_lealdade || ''
  );
  const [descricao_programa, setDescricaoPrograma] = useState(
    estabelecimentoExistente?.descricao_programa || ''
  );

  const [horarios, setHorarios] = useState(
    estabelecimentoExistente?.horarios || {
      seg: '08:00-20:00',
      ter: '08:00-20:00',
      qua: '08:00-20:00',
      qui: '08:00-20:00',
      sex: '08:00-20:00',
      sab: '08:00-19:00',
      dom: '09:00-14:00',
    }
  );

  const [metodos_pagamento, setMetodosPagamento] = useState<string[]>(
    estabelecimentoExistente?.metodos_pagamento || ['Dinheiro']
  );
  const [aceita_multibanco, setAceitaMultibanco] = useState(
    estabelecimentoExistente?.aceita_multibanco ?? true
  );
  const [aceita_cartao, setAceitaCartao] = useState(estabelecimentoExistente?.aceita_cartao ?? true);
  const [aceita_mbway, setAceitaMBWay] = useState(estabelecimentoExistente?.aceita_mbway ?? false);
  const [aceita_criptomoedas, setAceitaCriptomoedas] = useState(
    estabelecimentoExistente?.aceita_criptomoedas ?? false
  );

  const [fotos, setFotos] = useState<File[]>([]);

  const toggleDepartamento = (dept: string) => {
    setDepartamentos((prev) => (prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]));
  };

  const toggleServico = (serv: string) => {
    setServicosAdicionais((prev) => (prev.includes(serv) ? prev.filter((s) => s !== serv) : [...prev, serv]));
  };

  const toggleMetodoPagamento = (metodo: string) => {
    setMetodosPagamento((prev) => (prev.includes(metodo) ? prev.filter((m) => m !== metodo) : [...prev, metodo]));
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
      const dados: RetailingFormData = {
        nome,
        categoria,
        descricao,
        cae: cae || undefined,
        telefone,
        email: email || undefined,
        endereco,
        area_metros_quadrados: area_metros_quadrados ? parseFloat(area_metros_quadrados) : undefined,
        ano_abertura: ano_abertura ? parseInt(ano_abertura) : undefined,
        departamentos,
        servicos_adicionais: servicos_adicionais.length > 0 ? servicos_adicionais : undefined,
        programa_lealdade: programa_lealdade || undefined,
        descricao_programa: descricao_programa || undefined,
        horarios,
        metodos_pagamento,
        aceita_multibanco,
        aceita_cartao,
        aceita_mbway,
        aceita_criptomoedas,
        fotos: fotos.length > 0 ? fotos : undefined,
      };

      const resultado =
        modo === 'criar'
          ? await criarRetailing(dados)
          : await atualizarRetailing(estabelecimentoExistente!.id, dados);

      if (resultado.sucesso) {
        router.push('/retailing/' + categoria + '/' + resultado.id);
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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {modo === 'criar' ? 'Novo Estabelecimento' : 'Editar Estabelecimento'}
      </h1>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">{erro}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECÇÃO 1: Identificação */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Identificação</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Estabelecimento *</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaRetailing)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                {CATEGORIA_RETAILING.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORIA_NOMES[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nome do Estabelecimento *</label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Mercearia Central, Supermercado XYZ, etc"
                required
                minLength={5}
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreve o teu estabelecimento, especialidades, etc."
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

        {/* SECÇÃO 2: Contacto & Localização */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Contacto & Localização</h2>

          <div className="space-y-4">
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
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contacto@estabelecimento.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Endereço Completo *</label>
              <Input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número, localidade, código postal"
                required
                minLength={10}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                Nota: por agora este módulo não usa o filtro de município do resto do site — grava-se a
                morada completa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Área (m²)</label>
                <Input
                  type="number"
                  value={area_metros_quadrados}
                  onChange={(e) => setAreaMetrosQuadrados(e.target.value)}
                  placeholder="Ex: 150"
                  min="10"
                  max="100000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ano de Abertura</label>
                <Input
                  type="number"
                  value={ano_abertura}
                  onChange={(e) => setAnoAbertura(e.target.value)}
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* SECÇÃO 3: Departamentos */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Departamentos / Secções *</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DEPARTAMENTOS.map((dept) => (
              <label key={dept} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={departamentos.includes(dept)}
                  onChange={() => toggleDepartamento(dept)}
                  className="rounded"
                />
                <span className="text-sm">{dept}</span>
              </label>
            ))}
          </div>

          {departamentos.length === 0 && (
            <p className="text-sm text-red-600 mt-2">Escolhe pelo menos um departamento</p>
          )}
        </Card>

        {/* SECÇÃO 4: Serviços Adicionais */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Serviços Adicionais</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SERVICOS_ADICIONAIS.map((serv) => (
              <label key={serv} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={servicos_adicionais.includes(serv)}
                  onChange={() => toggleServico(serv)}
                  className="rounded"
                />
                <span className="text-sm">{serv}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* SECÇÃO 5: Programa de Lealdade */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Programa de Lealdade</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Programa</label>
              <select
                value={programa_lealdade}
                onChange={(e) => setProgramaLealdade(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Seleciona um programa</option>
                {PROGRAMAS_LEALDADE.map((prog) => (
                  <option key={prog} value={prog}>
                    {prog}
                  </option>
                ))}
              </select>
            </div>

            {programa_lealdade && programa_lealdade !== 'Nenhum' && (
              <div>
                <label className="block text-sm font-medium mb-1">Descrição do Programa</label>
                <textarea
                  value={descricao_programa}
                  onChange={(e) => setDescricaoPrograma(e.target.value)}
                  placeholder="Ex: Ganhe 1 ponto por cada euro gasto..."
                  maxLength={300}
                  rows={3}
                  className={TEXTAREA_CLASS}
                />
                <p className="text-xs text-gray-500 mt-1">{descricao_programa.length}/300 caracteres</p>
              </div>
            )}
          </div>
        </Card>

        {/* SECÇÃO 6: Horários */}
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
                  placeholder="08:00-20:00"
                  pattern="\d{2}:\d{2}-\d{2}:\d{2}"
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-4">Formato: HH:MM-HH:MM (ex: 08:00-20:00)</p>
        </Card>

        {/* SECÇÃO 7: Métodos de Pagamento */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Métodos de Pagamento *</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {METODOS_PAGAMENTO_OPTIONS.map((metodo) => (
              <label key={metodo} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={metodos_pagamento.includes(metodo)}
                  onChange={() => toggleMetodoPagamento(metodo)}
                  className="rounded"
                />
                <span className="text-sm">{metodo}</span>
              </label>
            ))}
          </div>

          {metodos_pagamento.length === 0 && (
            <p className="text-sm text-red-600 mt-2">Escolhe pelo menos um método de pagamento</p>
          )}

          <div className="mt-6 space-y-2 p-4 bg-gray-50 rounded">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aceita_multibanco}
                onChange={(e) => setAceitaMultibanco(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Multibanco</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aceita_cartao}
                onChange={(e) => setAceitaCartao(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Cartão crédito/débito</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aceita_mbway}
                onChange={(e) => setAceitaMBWay(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">MB Way</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aceita_criptomoedas}
                onChange={(e) => setAceitaCriptomoedas(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Criptomoedas (Bitcoin, etc)</span>
            </label>
          </div>
        </Card>

        {/* SECÇÃO 8: Fotos */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Fotos</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Upload de Fotos (máximo 5)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFotosChange}
              disabled={fotos.length >= 5}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-amber-50 file:text-amber-700
                hover:file:bg-amber-100"
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

            <p className="text-xs text-gray-500 mt-2">
              {fotos.length}/5 fotos selecionadas (recomenda-se: fachada, interior, produtos)
            </p>
          </div>
        </Card>

        {/* Botões */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading} size="lg" className="flex-1 bg-amber-600 hover:bg-amber-700">
            {loading ? 'Processando...' : modo === 'criar' ? 'Criar Estabelecimento' : 'Atualizar Estabelecimento'}
          </Button>

          <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
