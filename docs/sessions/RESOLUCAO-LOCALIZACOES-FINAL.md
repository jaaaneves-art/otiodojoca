# ✅ Resolução Final: Localizações, Alojamentos e Restaurantes

**Data**: 21/08/2026 às 16:15

---

## Problema Identificado

A tabela `alojamentos` tem FK `localizacao_id` que aponta para `localizacoes`, mas:
- `localizacoes` estava vazia
- Tentávamos inserir dados sem criar as localizações primeiro

---

## Solução: 3 Passos

### PASSO 1: Inserir Localizações

```sql
INSERT INTO localizacoes (codigo_postal, nome, localidade, municipio, distrito, latitude, longitude)
VALUES
  ('1349-037', 'Ajuda', 'Ajuda', 'Lisboa', 'Lisboa', 38.7138, -9.1947),
  ('4100-513', 'Aldoar', 'Aldoar', 'Porto', 'Porto', 41.1611, -8.6561),
  ('6225-012', 'Aldeia de São Francisco de Assis', 'Aldeia de São Francisco de Assis', 'Covilhã', 'Castelo Branco', 40.2833, -7.4833)
RETURNING id, nome, localidade;
```

**Resultado esperado:** 3 linhas com IDs (provavelmente 1, 2, 3)

---

### PASSO 2: Inserir Alojamentos

Use os IDs do Passo 1 (se forem 1, 2, 3, o SQL abaixo funciona direto):

```sql
INSERT INTO alojamentos (nome, descricao, tipo, localizacao_id, preco_noite, num_quartos, num_camas, freguesia, concelho)
VALUES
  ('Hotel Tio do Joca Lisboa', 'Charming hotel in the heart of Lisbon', 'hotel', 1, 85.00, 10, 20, 'Ajuda', 'Lisboa'),
  ('Quinta Rural Porto', 'Beautiful rural accommodation near Porto', 'quinta', 2, 65.00, 8, 16, 'Aldoar', 'Porto'),
  ('Pousada Montanha Covilhã', 'Mountain lodge with stunning views', 'pousada', 3, 55.00, 6, 12, 'Aldeia de São Francisco de Assis', 'Covilhã')
RETURNING id, nome, concelho;
```

**Resultado esperado:** 3 linhas com IDs (provavelmente 1, 2, 3)

---

### PASSO 3: Inserir Refeições

Use os IDs de alojamentos do Passo 2:

```sql
INSERT INTO refeicoes_alojamento (alojamento_id, tipo_refeicao, preco_extra, disponivel)
VALUES
  (1, 'Pequeno almoço', 12.00, true),
  (1, 'Almoço', 18.00, true),
  (1, 'Jantar', 22.00, true),
  (2, 'Pequeno almoço', 10.00, true),
  (2, 'Almoço', 16.00, true),
  (2, 'Jantar', 20.00, true),
  (3, 'Pequeno almoço', 9.00, true),
  (3, 'Almoço', 14.00, true),
  (3, 'Jantar', 18.00, true)
ON CONFLICT DO NOTHING;
```

---

### PASSO 4: Inserir Restaurantes

Use os IDs de localizações do Passo 1:

```sql
INSERT INTO restaurantes (nome, descricao, especialidade, preco_medio, localizacao_id, freguesia, concelho)
VALUES
  ('Tascaria Tio do Joca', 'Tradicional tasca portuguesa', 'Culinária Portuguesa', 15.00, 1, 'Ajuda', 'Lisboa'),
  ('Casa do Bacalhaus', 'Especializado em bacalhau', 'Bacalhaus', 18.00, 1, 'Ajuda', 'Lisboa'),
  ('Adega de Vinho', 'Vinhos portugueses', 'Vinhos Portugueses', 20.00, 1, 'Ajuda', 'Lisboa'),
  ('Restaurante Douro', 'Fine dining', 'Gastronomia Moderna', 35.00, 2, 'Aldoar', 'Porto'),
  ('Taberna dos Francos', 'Comida caseira', 'Culinária Portuguesa', 12.00, 2, 'Aldoar', 'Porto'),
  ('Casa da Montanha', 'Pratos regionais', 'Gastronomia da Serra', 16.00, 3, 'Aldeia de São Francisco de Assis', 'Covilhã')
RETURNING id, nome, concelho;
```

---

### PASSO 5: Verificação

```sql
SELECT 
  'Localizações' as tabela, COUNT(*) as total FROM localizacoes
UNION ALL
SELECT 'Alojamentos', COUNT(*) FROM alojamentos
UNION ALL
SELECT 'Refeições', COUNT(*) FROM refeicoes_alojamento
UNION ALL
SELECT 'Restaurantes', COUNT(*) FROM restaurantes;
```

---

## ✅ Resultado Final

- ✅ 3 localizações com código postal real
- ✅ 3 alojamentos linkados correctamente
- ✅ 9 refeições (3 por alojamento)
- ✅ 6 restaurantes linkados correctamente
- ✅ Campos `freguesia` e `concelho` preenchidos

---

**Próximo passo**: Recriar `ReservaForm` com schema correcta

---

*Criado às 16:15 de 21 de Agosto de 2026*
