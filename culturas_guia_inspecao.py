#!/usr/bin/env python3
"""
OTJ — AUDITORIA CULTURAS_GUIA
FASE 1: INSPECÇÃO
Script Python para análise da tabela culturas_guia
"""

import os
import json
from datetime import datetime
from collections import defaultdict

# Importar Supabase
try:
    from supabase import create_client, Client
except ImportError:
    print("❌ Supabase Python client não instalado")
    print("Execute: pip3 install supabase-py python-dotenv")
    exit(1)

# =====================================================================
# CONFIGURAÇÃO
# =====================================================================

# Ler variáveis de ambiente do .env.local
from dotenv import load_dotenv
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print("❌ Variáveis de ambiente não configuradas")
    print("Verifique o ficheiro .env.local")
    exit(1)

# Inicializar cliente Supabase
client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# =====================================================================
# RELATÓRIO
# =====================================================================

class RelatorioInspecao:
    def __init__(self):
        self.output = []
        self.culturas = []
        self.problemas = []

    def titulo(self, titulo, nivel=1):
        prefixo = "=" * (5 * nivel)
        self.output.append(f"\n{prefixo} {titulo} {prefixo}\n")
        print(f"\n{prefixo} {titulo} {prefixo}\n")

    def linha(self, conteudo=""):
        self.output.append(conteudo + "\n")
        print(conteudo)

    def tabela(self, dados, colunas=None):
        if not dados:
            self.linha("(sem dados)")
            return

        # Detectar colunas
        if colunas is None:
            colunas = list(dados[0].keys()) if isinstance(dados[0], dict) else []

        # Cabeçalho
        header = " | ".join(str(c).ljust(20) for c in colunas)
        self.linha(header)
        self.linha("-" * len(header))

        # Linhas
        for linha in dados:
            valores = []
            for col in colunas:
                if isinstance(linha, dict):
                    v = str(linha.get(col, "")).ljust(20)
                else:
                    v = str(getattr(linha, col, "")).ljust(20)
                valores.append(v)
            self.linha(" | ".join(valores))

    def problema(self, tipo, descricao, registos=None, severidade="MÉDIO"):
        self.problemas.append({
            "tipo": tipo,
            "descricao": descricao,
            "registos": registos or [],
            "severidade": severidade
        })

    def guardar(self, ficheiro="culturas_guia_inspecao_resultado.txt"):
        with open(ficheiro, 'w', encoding='utf-8') as f:
            f.write("\n".join(self.output))
        self.linha(f"\n✅ Relatório guardado: {ficheiro}")

# =====================================================================
# EXECUÇÃO
# =====================================================================

def executar_inspecao():
    relatorio = RelatorioInspecao()

    relatorio.titulo("OTJ — AUDITORIA CULTURAS_GUIA", nivel=1)
    relatorio.titulo("FASE 1: INSPECÇÃO", nivel=2)
    relatorio.linha(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    # Carregar dados
    relatorio.linha("📥 Carregando dados de culturas_guia...")
    try:
        response = client.table('culturas_guia').select('*').execute()
        culturas = response.data
    except Exception as e:
        relatorio.linha(f"❌ Erro ao carregar dados: {e}")
        return

    if not culturas:
        relatorio.linha("❌ Nenhum registo encontrado na tabela")
        return

    relatorio.linha(f"✅ Carregados {len(culturas)} registos\n")

    # ===== 1. CONTAGEM TOTAL =====
    relatorio.titulo("1. CONTAGEM TOTAL", 2)
    relatorio.linha(f"Total de registos: {len(culturas)}\n")

    # ===== 2. ESTRUTURA =====
    relatorio.titulo("2. ESTRUTURA DOS REGISTOS", 2)
    if culturas:
        primeiro = culturas[0]
        relatorio.linha("Colunas disponíveis:")
        for col in sorted(primeiro.keys()):
            relatorio.linha(f"  • {col}")
    relatorio.linha()

    # ===== 3. CATEGORIAS DISTINTAS =====
    relatorio.titulo("3. CATEGORIAS DISTINTAS", 2)
    categorias = defaultdict(int)
    for cultura in culturas:
        cat = (cultura.get('categoria') or '').strip()
        categorias[cat] += 1

    dados_cat = sorted(
        [{"categoria": k or "(nulo)", "quantidade": v} for k, v in categorias.items()],
        key=lambda x: -x['quantidade']
    )
    relatorio.tabela(dados_cat, ["categoria", "quantidade"])
    relatorio.linha(f"\nTotal de categorias distintas: {len(categorias)}\n")

    # ===== 4. PROBLEMAS DE MAIÚSCULAS =====
    relatorio.titulo("4. VARIAÇÕES DE MAIÚSCULAS/MINÚSCULAS", 2)
    nomes_normalizados = defaultdict(lambda: {"formas": set(), "categorias": set(), "ids": []})
    for cultura in culturas:
        nome = (cultura.get('nome') or '').strip()
        if not nome:
            continue
        normalizado = nome.lower()
        nomes_normalizados[normalizado]["formas"].add(nome)
        nomes_normalizados[normalizado]["categorias"].add(cultura.get('categoria') or '')
        nomes_normalizados[normalizado]["ids"].append(cultura.get('id'))

    problemas_maiusculas = []
    for norm, dados in sorted(nomes_normalizados.items()):
        if len(dados["formas"]) > 1:
            problemas_maiusculas.append({
                "nome_normalizado": norm,
                "variações": len(dados["formas"]),
                "formas": " | ".join(sorted(dados["formas"])),
                "categorias": " | ".join(sorted(dados["categorias"]))
            })

    if problemas_maiusculas:
        relatorio.linha(f"⚠️  Encontradas {len(problemas_maiusculas)} variações de maiúsculas:\n")
        relatorio.tabela(problemas_maiusculas, ["nome_normalizado", "variações", "formas"])
        for p in problemas_maiusculas:
            relatorio.problema(
                "VARIAÇÃO MAIÚSCULAS",
                f"Nome '{p['nome_normalizado']}' tem {p['variações']} formas diferentes",
                severidade="BAIXO"
            )
    else:
        relatorio.linha("✅ Nenhuma variação de maiúsculas detectada\n")

    # ===== 5. DUPLICADOS EXACTOS =====
    relatorio.titulo("5. DUPLICADOS EXACTOS", 2)
    duplicados = defaultdict(list)
    for cultura in culturas:
        nome = (cultura.get('nome') or '').strip()
        categoria = (cultura.get('categoria') or '').strip()
        if not nome:
            continue
        chave = (nome.lower(), categoria.lower())
        duplicados[chave].append(cultura)

    duplicados_reais = {k: v for k, v in duplicados.items() if len(v) > 1}
    if duplicados_reais:
        relatorio.linha(f"⚠️  Encontrados {len(duplicados_reais)} grupos de duplicados:\n")
        for (nome, cat), registos in sorted(duplicados_reais.items()):
            relatorio.linha(f"  • '{nome}' (categoria: {cat}) — {len(registos)} ocorrências")
            relatorio.problema(
                "DUPLICADO",
                f"Cultura '{nome}' aparece {len(registos)} vezes com categoria '{cat}'",
                registos=[r.get('id') for r in registos],
                severidade="ALTO"
            )
        relatorio.linha()
    else:
        relatorio.linha("✅ Nenhum duplicado exacto encontrado\n")

    # ===== 6. NOMES NULOS =====
    relatorio.titulo("6. REGISTOS COM NOME NULO", 2)
    nulos = [c for c in culturas if not (c.get('nome') or '').strip()]
    if nulos:
        relatorio.linha(f"⚠️  {len(nulos)} registos com nome nulo ou vazio:\n")
        for cultura in nulos:
            relatorio.linha(f"  • ID: {cultura.get('id')} | Categoria: {cultura.get('categoria')}")
            relatorio.problema(
                "NOME NULO",
                f"Registo {cultura.get('id')} não tem nome",
                registos=[cultura.get('id')],
                severidade="CRÍTICO"
            )
        relatorio.linha()
    else:
        relatorio.linha("✅ Todos os registos têm nome\n")

    # ===== 7. CONFUSÃO PLANTA/PRODUTO =====
    relatorio.titulo("7. POTENCIAL CONFUSÃO PLANTA/PRODUTO", 2)
    produtos = ['maçã', 'pera', 'cereja', 'castanha', 'noz', 'amêndoa', 'bolota']
    confusoes = []
    for cultura in culturas:
        nome = (cultura.get('nome') or '').lower()
        if any(nome.endswith(p) or nome.startswith(p) for p in produtos):
            confusoes.append({
                "nome": cultura.get('nome'),
                "categoria": cultura.get('categoria'),
                "nome_cientifico": cultura.get('nome_cientifico') or '(vazio)'
            })

    if confusoes:
        relatorio.linha(f"⚠️  {len(confusoes)} culturas com nomes de produtos (não plantas):\n")
        relatorio.tabela(confusoes, ["nome", "categoria", "nome_cientifico"])
        for c in confusoes:
            relatorio.problema(
                "CONFUSÃO PLANTA/PRODUTO",
                f"'{c['nome']}' parece ser um produto, não uma planta",
                severidade="MÉDIO"
            )
        relatorio.linha()
    else:
        relatorio.linha("✅ Nenhuma confusão planta/produto detectada\n")

    # ===== 8. CATEGORIAS HÍBRIDAS =====
    relatorio.titulo("8. CATEGORIAS HÍBRIDAS (COM /)", 2)
    hibridas = [c for c in culturas if '/' in (c.get('categoria') or '')]
    if hibridas:
        relatorio.linha(f"⚠️  {len(hibridas)} culturas com categorias híbridas:\n")
        cats_hibridas = set()
        for cultura in hibridas:
            cat = cultura.get('categoria')
            cats_hibridas.add(cat)
            relatorio.linha(f"  • {cultura.get('nome')} → {cat}")

        for cat in sorted(cats_hibridas):
            relatorio.problema(
                "CATEGORIA HÍBRIDA",
                f"Categoria '{cat}' mistura múltiplos conceitos",
                severidade="MÉDIO"
            )
        relatorio.linha()
    else:
        relatorio.linha("✅ Nenhuma categoria híbrida encontrada\n")

    # ===== 9. NOMES CIENTÍFICOS NULOS =====
    relatorio.titulo("9. REGISTOS SEM NOME CIENTÍFICO", 2)
    sem_cientifico = [c for c in culturas if not (c.get('nome_cientifico') or '').strip()]
    relatorio.linha(f"{len(sem_cientifico)} de {len(culturas)} registos sem nome científico ({100*len(sem_cientifico)//len(culturas)}%)")
    if sem_cientifico and len(sem_cientifico) <= 20:
        relatorio.linha()
        for cultura in sem_cientifico:
            relatorio.linha(f"  • {cultura.get('nome')} ({cultura.get('categoria')})")
    relatorio.linha()

    # ===== 10. LISTA COMPLETA =====
    relatorio.titulo("10. LISTA COMPLETA DE CULTURAS", 2)
    dados_lista = [
        {
            "Nome": c.get('nome', ''),
            "Categoria": c.get('categoria', ''),
            "Científico": c.get('nome_cientifico', ''),
            "ID": c.get('id', '')[:8] + "..."
        }
        for c in sorted(culturas, key=lambda x: (x.get('categoria', ''), x.get('nome', '')))
    ]
    relatorio.tabela(dados_lista, ["Nome", "Categoria", "Científico", "ID"])
    relatorio.linha()

    # ===== RESUMO DE PROBLEMAS =====
    relatorio.titulo("11. RESUMO DE PROBLEMAS ENCONTRADOS", 2)

    if relatorio.problemas:
        por_severidade = defaultdict(list)
        for p in relatorio.problemas:
            por_severidade[p['severidade']].append(p)

        for severidade in ['CRÍTICO', 'ALTO', 'MÉDIO', 'BAIXO']:
            problemas_sev = por_severidade.get(severidade, [])
            if problemas_sev:
                relatorio.linha(f"\n⚠️  {severidade} ({len(problemas_sev)}):")
                for p in problemas_sev[:5]:  # Mostrar até 5
                    relatorio.linha(f"  • {p['tipo']}: {p['descricao']}")
                if len(problemas_sev) > 5:
                    relatorio.linha(f"  ... e mais {len(problemas_sev) - 5}")
    else:
        relatorio.linha("✅ Nenhum problema encontrado!")

    relatorio.linha()
    relatorio.linha("=" * 70)
    relatorio.linha(f"Relatório gerado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    relatorio.guardar()

    # JSON para processamento
    json_file = "culturas_guia_inspecao_dados.json"
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump({
            "total_registos": len(culturas),
            "total_categorias": len(categorias),
            "categorias": dict(categorias),
            "duplicados": len(duplicados_reais),
            "nomes_nulos": len(nulos),
            "confusoes_planta_produto": len(confusoes),
            "categorias_hibridas": len(hibridas),
            "sem_nome_cientifico": len(sem_cientifico),
            "problemas": len(relatorio.problemas),
            "culturas": culturas
        }, f, ensure_ascii=False, indent=2)

    relatorio.linha(f"✅ Dados JSON guardados: {json_file}")

if __name__ == "__main__":
    try:
        executar_inspecao()
    except Exception as e:
        print(f"❌ Erro durante inspecção: {e}")
        import traceback
        traceback.print_exc()
