# 🌾 Mercado da Terra - Documentação Completa

## Visão Geral

O **Mercado da Terra** é um marketplace digital onde produtores locais, agricultores e comunidades rurais podem publicar, comprar, vender ou trocar produtos agropecuários, artesanais e de subsistência.

## Objetivos

- ✅ Conectar produtores locais com consumidores
- ✅ Valorizar produtos de origem portuguesa
- ✅ Apoiar pequenos produtores e agricultores
- ✅ Criar uma economia colaborativa rural
- ✅ Preservar práticas tradicionais de comércio

---

## 📐 Arquitetura

### Estrutura de Pastas

```
app/
├── feira/                    # Rotas do Mercado da Terra
│   ├── page.tsx             # Homepage (listagem de anúncios)
│   ├── [id]/                # Anúncio específico
│   │   └── page.tsx         # Detalhe do anúncio
│   ├── novo/                # Criar novo anúncio
│   │   └── page.tsx
│   ├── meus-anuncios/        # Dashboard do vendedor
│   │   └── page.tsx
│   └── categorias/           # Listagem por categoria
│       └── [categoria]/page.tsx
│
components/mercado-da-terra/
├── ad-card.tsx              # Card de anúncio (listagem)
├── ad-detail.tsx            # Detalhe completo do anúncio
├── new-ad-form.tsx          # Formulário criar anúncio
├── ad-filters.tsx           # Filtros de busca
├── seller-info.tsx          # Informações do vendedor
├── review-section.tsx       # Avaliações/reviews
└── ad-gallery.tsx           # Galeria de imagens

lib/supabase/
└── marketplace.ts           # Funções do banco de dados
```

### Database Schema

```sql
-- Tabela de anúncios
CREATE TABLE marketplace_ads (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  subcategory VARCHAR(50),
  price DECIMAL(10, 2),
  price_type VARCHAR(20), -- fixed, negotiable, free
  location VARCHAR(255),
  municipality VARCHAR(100),
  district VARCHAR(100),
  images JSON,
  status VARCHAR(20), -- active, inactive, sold, reserved, expired
  contact_method VARCHAR(50), -- message, phone, email, in_person
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  views_count INTEGER DEFAULT 0
);

-- Tabela de reviews/avaliações
CREATE TABLE marketplace_reviews (
  id BIGSERIAL PRIMARY KEY,
  ad_id BIGINT REFERENCES marketplace_ads,
  reviewer_id UUID REFERENCES auth.users,
  reviewed_id UUID REFERENCES auth.users,
  rating INTEGER (1-5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de conversas/mensagens
CREATE TABLE marketplace_conversations (
  id BIGSERIAL PRIMARY KEY,
  ad_id BIGINT REFERENCES marketplace_ads,
  buyer_id UUID REFERENCES auth.users,
  seller_id UUID REFERENCES auth.users,
  status VARCHAR(20), -- active, closed
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de mensagens
CREATE TABLE marketplace_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT REFERENCES marketplace_conversations,
  sender_id UUID REFERENCES auth.users,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de favoritos
CREATE TABLE marketplace_favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  ad_id BIGINT REFERENCES marketplace_ads,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, ad_id)
);

-- Tabela de categorias
CREATE TABLE marketplace_categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Funcionalidades Principais

### 1. **Listagem de Anúncios** (Página Principal)
- Grid responsivo de anúncios (1 col mobile, 2 tablet, 3+ desktop)
- Filtros por categoria, preço, localização
- Busca por texto
- Ordenação (recente, preço, relevância)
- Infinite scroll ou paginação

### 2. **Criar Anúncio**
- Formulário estruturado
- Upload de múltiplas imagens
- Categorização automática
- Validações em tempo real
- Preview antes de publicar

### 3. **Detalhe do Anúncio**
- Galeria de imagens
- Informações do vendedor (com avatar e reviews)
- Contacto direto (botões WhatsApp, Telefone, Email)
- Botão "Enviar mensagem"
- Histórico de preço (se negociável)
- Localização no mapa
- Anúncios similares

### 4. **Sistema de Reviews**
- Avaliações de 1-5 estrelas
- Comentários do comprador/vendedor
- Média de avaliações do vendedor
- Histórico de transações

### 5. **Dashboard do Vendedor**
- Visualizar meus anúncios
- Editar/deletar anúncios
- Marcar como vendido
- Ver mensagens recebidas
- Estatísticas (views, conversas, vendas)
- Histórico de vendas

### 6. **Conversas/Mensagens**
- Chat em tempo real (opcional com WebSocket)
- Notificações
- Histórico de conversas
- Opção de bloquear usuário

### 7. **Sistema de Favoritos**
- Guardar anúncios favoritos
- Listas privadas
- Alertas de preço

---

## 🎨 Categorias Sugeridas

```json
{
  "categorias": [
    {
      "name": "Produtos Agrícolas",
      "subcategorias": ["Cereais", "Frutas", "Hortaliças", "Tubérculos", "Legumes"]
    },
    {
      "name": "Animais e Pecuária",
      "subcategorias": ["Bovinos", "Ovinos", "Caprinos", "Suínos", "Aves", "Apicultura"]
    },
    {
      "name": "Produtos Alimentares",
      "subcategorias": ["Lacticínios", "Carnes", "Embutidos", "Mel", "Azeite", "Conservas"]
    },
    {
      "name": "Artesanato Rural",
      "subcategorias": ["Cerâmica", "Tecelagem", "Madeira", "Joalharia", "Outros"]
    },
    {
      "name": "Maquinaria Agrícola",
      "subcategorias": ["Tratores", "Ferramentas", "Equipamento", "Peças"]
    },
    {
      "name": "Sementes e Mudas",
      "subcategorias": ["Sementes", "Mudas", "Fertilizantes", "Pesticidas"]
    },
    {
      "name": "Experiências Rurais",
      "subcategorias": ["Cursos", "Workshops", "Agriturismo", "Visitas"]
    }
  ]
}
```

---

## 🔐 Autenticação e Permissões

- ✅ Apenas utilizadores autenticados podem publicar
- ✅ Apenas o autor pode editar/deletar seu anúncio
- ✅ Admins podem moderar/remover anúncios
- ✅ Sistema de denúncias/reporte

---

## 📱 Responsividade

- **Mobile (< 640px)**: 1 coluna, botões grandes
- **Tablet (640px - 1024px)**: 2 colunas, interface compacta
- **Desktop (> 1024px)**: 3+ colunas, sidebar com filtros

---

## ⚡ Performance

- Lazy loading de imagens
- Paginação ou infinite scroll
- Cache de categorias
- Otimização de queries

---

## 🚀 Próximas Fases

### Fase 1 (MVP)
- [ ] Listagem básica
- [ ] Criar anúncio
- [ ] Detalhe do anúncio
- [ ] Filtros simples

### Fase 2
- [ ] Dashboard do vendedor
- [ ] Sistema de mensagens
- [ ] Reviews/Avaliações
- [ ] Favoritos

### Fase 3
- [ ] Integração com pagamentos (Stripe/PayPal)
- [ ] Sistema de transações
- [ ] Notificações em tempo real
- [ ] Analytics

### Fase 4
- [ ] Mobile app
- [ ] AI para categorização automática
- [ ] Recomendações personalizadas

---

## 📊 Indicadores de Sucesso

- Número de anúncios publicados
- Número de conversas iniciadas
- Taxa de conversão (anúncios → vendas)
- Satisfação do utilizador (reviews)
- Retenção de vendedores

