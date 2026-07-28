-- ============================================
-- MERCADO DA TERRA - SCHEMA DO BANCO DE DADOS
-- ============================================

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS marketplace_categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  parent_id BIGINT REFERENCES marketplace_categories(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para categorias
CREATE INDEX idx_marketplace_categories_slug ON marketplace_categories(slug);

-- Tabela de Anúncios (Marketplace)
CREATE TABLE IF NOT EXISTS marketplace_ads (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  price DECIMAL(10, 2),
  price_type VARCHAR(20) NOT NULL CHECK (price_type IN ('fixed', 'negotiable', 'free')),
  location VARCHAR(255),
  municipality VARCHAR(100),
  district VARCHAR(100),
  images JSON DEFAULT '[]',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold', 'reserved', 'expired')),
  contact_method VARCHAR(50) NOT NULL CHECK (contact_method IN ('message', 'phone', 'email', 'in_person')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '60 days',
  views_count INTEGER DEFAULT 0,
  
  CONSTRAINT price_required_for_non_free CHECK (
    price_type = 'free' OR price IS NOT NULL
  )
);

-- Índices para anúncios
CREATE INDEX idx_marketplace_ads_user_id ON marketplace_ads(user_id);
CREATE INDEX idx_marketplace_ads_status ON marketplace_ads(status);
CREATE INDEX idx_marketplace_ads_category ON marketplace_ads(category);
CREATE INDEX idx_marketplace_ads_created_at ON marketplace_ads(created_at DESC);
CREATE INDEX idx_marketplace_ads_municipality ON marketplace_ads(municipality);
CREATE INDEX idx_marketplace_ads_search ON marketplace_ads USING GIN (
  to_tsvector('portuguese', title || ' ' || COALESCE(description, ''))
);

-- Tabela de Favoritos
CREATE TABLE IF NOT EXISTS marketplace_favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id BIGINT NOT NULL REFERENCES marketplace_ads(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, ad_id)
);

-- Índices para favoritos
CREATE INDEX idx_marketplace_favorites_user_id ON marketplace_favorites(user_id);
CREATE INDEX idx_marketplace_favorites_ad_id ON marketplace_favorites(ad_id);

-- Tabela de Conversas (Mensagens)
CREATE TABLE IF NOT EXISTS marketplace_conversations (
  id BIGSERIAL PRIMARY KEY,
  ad_id BIGINT NOT NULL REFERENCES marketplace_ads(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para conversas
CREATE INDEX idx_marketplace_conversations_buyer_id ON marketplace_conversations(buyer_id);
CREATE INDEX idx_marketplace_conversations_seller_id ON marketplace_conversations(seller_id);
CREATE INDEX idx_marketplace_conversations_ad_id ON marketplace_conversations(ad_id);
CREATE INDEX idx_marketplace_conversations_status ON marketplace_conversations(status);

-- Tabela de Mensagens
CREATE TABLE IF NOT EXISTS marketplace_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES marketplace_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mensagens
CREATE INDEX idx_marketplace_messages_conversation_id ON marketplace_messages(conversation_id);
CREATE INDEX idx_marketplace_messages_sender_id ON marketplace_messages(sender_id);
CREATE INDEX idx_marketplace_messages_is_read ON marketplace_messages(is_read);

-- Tabela de Avaliações (Reviews)
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id BIGSERIAL PRIMARY KEY,
  ad_id BIGINT REFERENCES marketplace_ads(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ad_id, reviewer_id, reviewed_id)
);

-- Índices para avaliações
CREATE INDEX idx_marketplace_reviews_reviewed_id ON marketplace_reviews(reviewed_id);
CREATE INDEX idx_marketplace_reviews_reviewer_id ON marketplace_reviews(reviewer_id);
CREATE INDEX idx_marketplace_reviews_ad_id ON marketplace_reviews(ad_id);

-- Tabela de Reportes (Denúncias)
CREATE TABLE IF NOT EXISTS marketplace_reports (
  id BIGSERIAL PRIMARY KEY,
  ad_id BIGINT NOT NULL REFERENCES marketplace_ads(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'fraud', 'illegal', 'offensive', 'other')),
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para reportes
CREATE INDEX idx_marketplace_reports_ad_id ON marketplace_reports(ad_id);
CREATE INDEX idx_marketplace_reports_reporter_id ON marketplace_reports(reporter_id);
CREATE INDEX idx_marketplace_reports_status ON marketplace_reports(status);

-- Tabela de Bloqueios (Usuários bloqueados)
CREATE TABLE IF NOT EXISTS marketplace_blocks (
  id BIGSERIAL PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CONSTRAINT cannot_block_self CHECK (blocker_id != blocked_id)
);

-- Índices para bloqueios
CREATE INDEX idx_marketplace_blocks_blocker_id ON marketplace_blocks(blocker_id);
CREATE INDEX idx_marketplace_blocks_blocked_id ON marketplace_blocks(blocked_id);

-- ============================================
-- FUNÇÕES
-- ============================================

-- Função para incrementar contador de visualizações
CREATE OR REPLACE FUNCTION increment_views(ad_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE marketplace_ads
  SET views_count = views_count + 1
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular rating médio do vendedor
CREATE OR REPLACE FUNCTION get_seller_rating(seller_id UUID)
RETURNS TABLE(rating NUMERIC, total_reviews INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(r.rating)::NUMERIC, 0) as rating,
    COUNT(r.id)::INTEGER as total_reviews
  FROM marketplace_reviews r
  WHERE r.reviewed_id = seller_id;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar profile com rating (trigger)
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_rating NUMERIC;
  v_total_reviews INTEGER;
BEGIN
  SELECT rating, total_reviews INTO v_rating, v_total_reviews
  FROM get_seller_rating(NEW.reviewed_id);
  
  UPDATE profiles
  SET rating = v_rating, total_reviews = v_total_reviews
  WHERE id = NEW.reviewed_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar rating quando há nova avaliação
CREATE TRIGGER trigger_update_profile_rating
AFTER INSERT ON marketplace_reviews
FOR EACH ROW
EXECUTE FUNCTION update_profile_rating();

-- Função para expirar anúncios antigos
CREATE OR REPLACE FUNCTION expire_old_ads()
RETURNS VOID AS $$
BEGIN
  UPDATE marketplace_ads
  SET status = 'expired'
  WHERE status = 'active' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DADOS INICIAIS - CATEGORIAS
-- ============================================

INSERT INTO marketplace_categories (name, slug, description, icon) VALUES
  ('Produtos Agrícolas', 'produtos-agrícolas', 'Cereais, frutas, hortaliças e tubérculos', '🌾'),
  ('Animais e Pecuária', 'animais-pecuaria', 'Bovinos, ovinos, caprinos e aves', '🐄'),
  ('Produtos Alimentares', 'produtos-alimentares', 'Lacticínios, carnes, embutidos e conservas', '🍖'),
  ('Artesanato Rural', 'artesanato-rural', 'Cerâmica, tecelagem e produtos artesanais', '🏺'),
  ('Maquinaria Agrícola', 'maquinaria-agrícola', 'Tratores, ferramentas e equipamento', '🚜'),
  ('Sementes e Mudas', 'sementes-mudas', 'Sementes, mudas, fertilizantes e pesticidas', '🌱'),
  ('Experiências Rurais', 'experiencias-rurais', 'Cursos, workshops e agriturismo', '🎓')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- POLÍTICAS DE SEGURANÇA (RLS) - Exemplo
-- ============================================

-- Habilitar RLS
ALTER TABLE marketplace_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode ver anúncios ativos
CREATE POLICY "public_can_view_active_ads"
  ON marketplace_ads FOR SELECT
  USING (status = 'active');

-- Política: Usuários só podem editar seus próprios anúncios
CREATE POLICY "users_can_edit_own_ads"
  ON marketplace_ads FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Usuários só podem deletar seus próprios anúncios
CREATE POLICY "users_can_delete_own_ads"
  ON marketplace_ads FOR DELETE
  USING (auth.uid() = user_id);

-- Política: Usuários autenticados podem criar anúncios
CREATE POLICY "authenticated_can_create_ads"
  ON marketplace_ads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários só podem ver suas próprias conversas
CREATE POLICY "users_can_view_own_conversations"
  ON marketplace_conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Política: Usuários só podem enviar mensagens em suas conversas
CREATE POLICY "users_can_send_messages"
  ON marketplace_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM marketplace_conversations
      WHERE id = conversation_id AND
      (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

-- ============================================
-- VISTAS ÚTEIS
-- ============================================

-- Vista de anúncios com informações do vendedor
CREATE OR REPLACE VIEW marketplace_ads_with_seller AS
SELECT
  a.*,
  p.username,
  p.avatar_url,
  p.bio,
  p.rating,
  p.total_reviews
FROM marketplace_ads a
JOIN profiles p ON a.user_id = p.id;

-- Vista de anúncios do utilizador com estatísticas
CREATE OR REPLACE VIEW marketplace_user_stats AS
SELECT
  user_id,
  COUNT(*) as total_ads,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_ads,
  COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_ads,
  SUM(CASE WHEN price_type != 'free' THEN price ELSE 0 END)::DECIMAL as total_revenue
FROM marketplace_ads
GROUP BY user_id;

-- ============================================
-- COMENTÁRIOS DE MANUTENÇÃO
-- ============================================

-- TODO: Executar regularmente a função expire_old_ads()
-- SELECT expire_old_ads();

-- TODO: Configurar backup automático do banco de dados
-- TODO: Configurar alertas para anúncios reportados com status 'pending'
-- TODO: Implementar notificações em tempo real para mensagens
-- TODO: Configurar políticas de moderation automática

