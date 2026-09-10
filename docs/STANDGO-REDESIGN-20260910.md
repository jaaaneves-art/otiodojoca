# StandGo — revisão visual e de experiência

**Data:** 10 de setembro de 2026  
**Âmbito:** interface e experiência do módulo `/viaturas`  
**Base de dados:** sem alterações ou migrations

## Objetivo

Transformar o módulo de viaturas, que ainda tinha o aspeto de um protótipo,
num marketplace automóvel coerente, profissional e utilizável em telemóvel,
sem alterar anúncios, permissões, leilões ou mensagens existentes.

## Alterações

- Nova identidade StandGo em azul-noite, azul elétrico e verde `Go`.
- Logótipo tipográfico e iconografia consistente, sem dependência de imagens.
- Navegação responsiva com ações principais e menu horizontal em ecrãs pequenos.
- Hero e pesquisa com hierarquia mais clara e atalhos para os tipos de negócio.
- Filtros avançados reorganizados, acessíveis e adequados a telemóvel.
- Cartões com fotografia 16:10, preço, dados essenciais, localização e estados.
- Nova galeria funcional: clicar numa miniatura muda realmente a imagem principal.
- Detalhe reorganizado em duas colunas, com preço e contacto persistentes em desktop.
- Formulário de publicação e edição com campos e grelhas responsivos.
- Tratamento visual coerente para favoritos, anúncios próprios, leilões e stands.
- Remoção de vários padrões de links com botões interativos aninhados.

## Princípios mantidos

- As fotografias reais dos anúncios continuam a ser o elemento visual principal.
- As pesquisas, filtros, favoritos, mensagens e leilões mantêm a lógica atual.
- Não foram introduzidas bibliotecas, serviços externos ou imagens geradas.
- Não houve alterações à base de dados nem ao Supabase.

## Verificação manual recomendada

Depois de aplicar o patch, verificar em larguras de 375 px e 1440 px:

1. `/viaturas`
2. `/viaturas/[id]` num anúncio com várias fotografias
3. `/viaturas/novo`
4. `/viaturas/favoritos`
5. `/viaturas/meus-anuncios`
6. `/viaturas/leiloes`
7. `/viaturas/stands` com e sem perfil de stand verificado

