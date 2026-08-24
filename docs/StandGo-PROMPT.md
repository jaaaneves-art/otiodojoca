# PROMPT COMPLETO — StandGo (Marketplace de Viaturas estilo mobile.de)

## Contexto e origem
Este projeto reutiliza a mesma stack e padrões do **SobraCiclo** (React + TypeScript + Vite + Tailwind + React Router) já criado anteriormente. O objetivo é um site de vendas de viaturas inspirado no **mobile.de**, simples, limpo e funcional.

## Nome do produto
**StandGo**  
Alternativas: AutoList, ViaturaJá, MeuStand, AutoHub

Slogan: *Compra e vende viaturas*

## Visão do produto
Criar um marketplace digital de viaturas (particulares e stands) com experiência semelhante ao mobile.de:
- Pesquisa rápida e filtros poderosos
- Listagens claras com preço, km, ano, combustível
- Página de detalhe completa
- Publicação de anúncios gratuita e simples
- Design mobile-first

## Público-alvo
- Particulares que querem vender o carro
- Stands / concessionários
- Compradores que procuram carros usados e novos em Portugal

## Funcionalidades do MVP (já implementadas)
1. **Home**
   - Hero com pesquisa
   - Atalhos de marcas populares
   - Estatísticas (anúncios, marcas, stands, preço médio)
   - Destaques (6 carros)
   - Secção “Porquê o StandGo”
   - Lista de marcas

2. **Listagem de anúncios (`/anuncios`)**
   - Filtros laterais: marca, preço min/max, ano, km máximo, combustível, caixa, tipo de carroçaria, estado (novo/usado), pesquisa textual
   - Ordenação: mais recentes, preço ↑↓, menos km
   - Grid responsivo de cards
   - Contador de resultados

3. **Detalhe do anúncio (`/anuncio/:id`)**
   - Galeria (placeholders de cor)
   - Preço grande + visualizações + data
   - Características (ano, km, combustível, caixa, portas, lugares, potência, cor, tipo)
   - Descrição
   - Equipamento / extras
   - Card do vendedor (nome, rating, tipo particular/stand, telefone, nº de anúncios)
   - Botões Contactar e Guardar

4. **Vender (`/vender`)**
   - Formulário completo de publicação
   - Campos: marca, modelo, ano, preço, km, potência, combustível, caixa, tipo, cor, cidade, descrição, tipo de vendedor
   - Feedback de sucesso

## Dados mock
12 carros realistas (Mercedes, BMW, Audi, VW, Toyota, Renault, Tesla, Peugeot, Ford, Volvo, Seat, Porsche) com localizações em Portugal (Lisboa, Porto, Braga, Coimbra, Faro, etc.).

## Stack técnica
- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router DOM
- Lucide React (ícones)
- date-fns (formatação de datas)

## Estrutura de pastas
```
standgo/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── CarCard.tsx
│   │   └── SearchFilters.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Listings.tsx
│   │   ├── CarDetail.tsx
│   │   └── Sell.tsx
│   ├── data/mock.ts
│   ├── types/index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/favicon.svg
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

## Como correr
```bash
unzip StandGo-MVP.zip
cd standgo
npm install
npm run dev
```

## Roadmap futuro (para a próxima IA / desenvolvimento)
- Upload real de fotografias (múltiplas)
- Autenticação (email / Google) com perfis Particular vs Stand
- Sistema de favoritos
- Chat ou formulário de contacto com notificação
- Mapa de stands
- Destaques pagos / planos para stands
- Backend (recomendado: Supabase ou NestJS + PostgreSQL)
- Pesquisa por localização / raio
- Histórico de preços e alertas
- App PWA / mobile

## Requisitos de design
- Limpo, profissional, mobile-first
- Cores principais: azul (#2563eb) + slate
- Cards com hover suave
- Tipografia Inter
- Badges “STAND” e “NOVO”
- Sem imagens reais no MVP (placeholders de cor por carro)

## Instruções para outra IA
Se fores expandir este projeto:
1. Mantém a stack actual.
2. Não quebres a tipagem TypeScript.
3. Reutiliza os componentes existentes.
4. Adiciona testes apenas se pedido.
5. Qualquer nova página deve seguir o mesmo padrão visual.
6. Responde e documenta sempre em PT-PT.

---
Prompt gerado a partir do pedido do utilizador + reutilização do projeto SobraCiclo.
