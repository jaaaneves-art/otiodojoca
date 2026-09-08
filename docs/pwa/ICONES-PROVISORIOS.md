# Ícones PWA provisórios — Fase 1

Não existe um logótipo gráfico no diretório público do projeto. Estes ícones
usam apenas o monograma «TJ» (Tio do Joca), sem criar uma identidade definitiva.
As cores vêm da paleta terra existente: fundo #4d3a28 e letras #f7f5f0.

PNG RGB opacos: icon-192.png (192×192), icon-512.png (512×512),
maskable-512.png (512×512) e apple-touch-icon.png (180×180), em public/icons/.
public/favicon.ico contém tamanhos 16, 32 e 48. O monograma maskable fica
inteiramente dentro do círculo de segurança central de raio 40% da largura.

Produção: Pillow já disponível no sistema, DejaVu Sans Bold, desenho a 4×
e redução Lanczos. Tamanho de letra de 50% da largura nos ícones normais e
42% no maskable; centralização pela caixa visível do texto. Sem novas dependências.

Substituir por arte final aprovada numa fase futura, mantendo dimensões,
legibilidade, fundo opaco e área segura maskable. Não contêm dados pessoais,
tokens ou segredos. Esta fase não inclui service worker ou cache offline.
