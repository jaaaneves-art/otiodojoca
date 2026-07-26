# 📋 Guia de Implementação - Mercado da Terra

## 🚀 Visão Geral

Este guia detalha como implementar completamente o módulo Mercado da Terra no projeto "O Tio do Joca".

---

## 📑 Índice

1. [Configuração Inicial](#configuração-inicial)
2. [Banco de Dados](#banco-de-dados)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Componentes](#componentes)
5. [Páginas](#páginas)
6. [Autenticação e Permissões](#autenticação-e-permissões)
7. [Upload de Imagens](#upload-de-imagens)
8. [Testes](#testes)
9. [Deploy](#deploy)

---

## 1. Configuração Inicial

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Supabase
- GitHub (para versionamento)

### Passos

```bash
# 1. Clonar repositório
git clone https://github.com/jaaaneves-art/otiodojoca.git
cd otiodojoca

# 2. Instalar dependências
npm install

# 3. Variáveis de ambiente
cp .env.local.example .env.local

# Adicionar ao .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# 4. Iniciar servidor de desenvolvimento
npm run dev
```

---

## 2. Banco de Dados

### Executar SQL

1. **Ir ao Supabase Dashboard**
   - Projeto > SQL Editor
   - Copiar conteúdo de `marketplace-schema.sql`
   - Executar

2. **Verificar tabelas criadas**
   ```sql
   SELECT * FROM marketplace_ads;
   SELECT * FROM marketplace_categories;
   SELECT * FROM marketplace_favorites;
   ```

3. **Adicionar permissões RLS**
   - Supabase Dashboard > Authentication > Policies
   - Verificar se as políticas estão ativas

### Migrations (Opcional - com Supabase CLI)

```bash
# Criar nova migration
supabase migration new create_marketplace_tables

# Aplicar migrations
supabase db push
```

---

## 3. Estrutura de Pastas

Criar a seguinte estrutura:

```
app/
├── feira/                              # Rotas principais
│   ├── page.tsx                        # Homepage com listagem
│   ├── layout.tsx                      # Layout do módulo
│   ├── [id]/
│   │   ├── page.tsx                    # Detalhe do anúncio
│   │   └── layout.tsx
│   ├── novo/
│   │   ├── page.tsx                    # Criar novo anúncio
│   │   └── layout.tsx
│   ├── meus-anuncios/
│   │   ├── page.tsx                    # Dashboard do vendedor
│   │   └── [id]/
│   │       └── editar/
│   │           └── page.tsx            # Editar anúncio
│   └── categorias/
│       └── [categoria]/
│           └── page.tsx                # Listagem por categoria

components/mercado-da-terra/
├── ad-card.tsx                         # Card do anúncio (listagem)
├── ad-card-improved.tsx                # Card melhorado
├── ad-detail.tsx                       # Detalhe completo
├── ad-filters.tsx                      # Filtros de busca
├── new-ad-form.tsx                     # Formulário básico
├── new-ad-form-improved.tsx            # Formulário melhorado
├── seller-info.tsx                     # Info do vendedor
├── review-section.tsx                  # Avaliações
├── ad-gallery.tsx                      # Galeria de imagens
├── conversation-list.tsx               # Lista de conversas
└── message-thread.tsx                  # Thread de mensagens

lib/supabase/
└── marketplace.ts                      # Funções do BD
```

---

## 4. Componentes

### 4.1 Componentes Fornecidos

Os seguintes componentes estão prontos para copiar:

1. **ad-card-improved.tsx**
   - Card melhorado com imagens, status, favoritos
   - Localização: `/components/mercado-da-terra/`

2. **ad-filters.tsx**
   - Filtros avançados: categoria, preço, localização
   - Localização: `/components/mercado-da-terra/`

3. **ad-detail.tsx**
   - Página completa de detalhe do anúncio
   - Galeria de imagens, info do vendedor, contacto
   - Localização: `/components/mercado-da-terra/`

4. **new-ad-form-improved.tsx**
   - Formulário completo com validação
   - Upload de múltiplas imagens
   - Localização: `/components/mercado-da-terra/`

### 4.2 Componentes a Criar

#### seller-info.tsx
```tsx
// Card com informações do vendedor
// Mostrar: avatar, nome, rating, bio
// Botões: enviar mensagem, ver perfil
```

#### review-section.tsx
```tsx
// Seção de avaliações/reviews
// Mostrar: média de rating, lista de reviews
// Formulário para deixar review
```

#### ad-gallery.tsx
```tsx
// Galeria de imagens do anúncio
// Suportar: zoom, thumbnails, lightbox
```

#### conversation-list.tsx
```tsx
// Lista de conversas/chats
// Mostrar: último anúncio, último mensagem, data
// Filtros: ativas, fechadas
```

#### message-thread.tsx
```tsx
// Thread de mensagens
// Mostrar: histórico de mensagens
// Input para enviar nova mensagem
```

---

## 5. Páginas

### 5.1 Página Principal (/mercado-da-terra)

**arquivo: `app/mercado-da-terra/page.tsx`**

```tsx
'use server';

import { getAds } from '@/lib/supabase/marketplace';
import { AdCard } from '@/components/mercado-da-terra/ad-card-improved';
import { AdFilters } from '@/components/mercado-da-terra/ad-filters';
import { NewAdButton } from '@/components/mercado-da-terra/new-ad-button';
import { createClient } from '@/lib/supabase/server';

export default async function FeiraPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const filters = {
    search: searchParams.search as string,
    category: searchParams.category as string,
    priceMin: searchParams.priceMin ? parseFloat(searchParams.priceMin as string) : undefined,
    priceMax: searchParams.priceMax ? parseFloat(searchParams.priceMax as string) : undefined,
    municipality: searchParams.municipality as string,
    priceType: searchParams.priceType as string,
    status: 'active',
    sortBy: (searchParams.sortBy as string) || 'newest',
    limit: 12,
    offset: searchParams.page ? (parseInt(searchParams.page as string) - 1) * 12 : 0,
  };

  const { ads, count } = await getAds(filters);

  return (
    <div className="min-h-screen bg-terra-50">
      {/* Header */}
      <nav className="bg-white border-b border-terra-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-terra-800">Mercado da Terra</h1>
          {user && (
            <NewAdButton />
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filtros */}
        <AdFilters
          onFiltersChange={(newFilters) => {
            // Atualizar URL com novos filtros
            const params = new URLSearchParams();
            Object.entries(newFilters).forEach(([key, value]) => {
              if (value) params.set(key, String(value));
            });
            // window.location.href = `?${params.toString()}`;
          }}
        />

        {/* Grid de anúncios */}
        {ads.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {ads.map((ad) => (
                <AdCard key={ad.id} ad={ad} isFavorite={false} />
              ))}
            </div>

            {/* Paginação */}
            <div className="flex justify-center gap-2">
              {/* Implementar componente de paginação */}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-terra-600 text-lg mb-4">Nenhum anúncio encontrado</p>
            {user && (
              <NewAdButton />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
```

### 5.2 Página de Detalhe (/mercado-da-terra/[id])

**arquivo: `app/mercado-da-terra/[id]/page.tsx`**

```tsx
import { getAdById, getSimilarAds } from '@/lib/supabase/marketplace';
import { AdDetail } from '@/components/mercado-da-terra/ad-detail';
import { AdCard } from '@/components/mercado-da-terra/ad-card-improved';
import { notFound } from 'next/navigation';

export default async function AdPage({ params }: { params: { id: string } }) {
  const { ad, error } = await getAdById(parseInt(params.id));

  if (error || !ad) {
    notFound();
  }

  const { ads: similarAds } = await getSimilarAds(ad.category, ad.id);

  return (
    <div>
      <AdDetail ad={ad} />

      {/* Anúncios similares */}
      {similarAds.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12 border-t border-terra-200">
          <h2 className="text-2xl font-bold text-terra-900 mb-6">
            Anúncios Similares
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {similarAds.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

### 5.3 Página de Criar Anúncio (/mercado-da-terra/novo)

**arquivo: `app/mercado-da-terra/novo/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server';
import { NewAdForm } from '@/components/mercado-da-terra/new-ad-form-improved';
import { redirect } from 'next/navigation';

export default async function NovoAnuncioPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/mercado-da-terra/novo');
  }

  return (
    <div className="min-h-screen bg-terra-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-terra-900 mb-2">
          Publicar Novo Anúncio
        </h1>
        <p className="text-terra-600 mb-8">
          Preenche o formulário abaixo para publicar o teu produto ou serviço
        </p>

        <NewAdForm />
      </div>
    </div>
  );
}
```

### 5.4 Página de Meus Anúncios (/mercado-da-terra/meus-anuncios)

**arquivo: `app/mercado-da-terra/meus-anuncios/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server';
import { getUserAds } from '@/lib/supabase/marketplace';
import { AdCard } from '@/components/mercado-da-terra/ad-card-improved';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function MeusAnunciosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { ads } = await getUserAds(user.id);

  // Separar por status
  const activeAds = ads.filter(ad => ad.status === 'active');
  const soldAds = ads.filter(ad => ad.status === 'sold');
  const otherAds = ads.filter(ad => !['active', 'sold'].includes(ad.status));

  return (
    <div className="min-h-screen bg-terra-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-terra-900">Meus Anúncios</h1>
            <p className="text-terra-600">Gerencia todos os teus anúncios</p>
          </div>
          <Button asChild className="bg-terra-600 hover:bg-terra-700">
            <Link href="/mercado-da-terra/novo">Novo Anúncio</Link>
          </Button>
        </div>

        {/* Anúncios Ativos */}
        {activeAds.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-terra-800 mb-4">
              Anúncios Ativos ({activeAds.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeAds.map(ad => (
                <div key={ad.id} className="relative">
                  <AdCard ad={ad} />
                  {/* Botões de edição/exclusão */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Link href={`/mercado-da-terra/${ad.id}/editar`}>
                      <Button size="sm" variant="outline">Editar</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Anúncios Vendidos */}
        {soldAds.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-terra-800 mb-4">
              Anúncios Vendidos ({soldAds.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {soldAds.map(ad => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </div>
          </section>
        )}

        {ads.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg">
            <p className="text-terra-600 mb-4">Ainda não tens nenhum anúncio publicado</p>
            <Button asChild className="bg-terra-600">
              <Link href="/mercado-da-terra/novo">Publicar Primeiro Anúncio</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 6. Autenticação e Permissões

### 6.1 Verificar Autenticação

```tsx
// Componente protected
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      }
      setLoading(false);
    });
  }, [router, supabase.auth]);

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return <>{children}</>;
}
```

### 6.2 Permissões

```tsx
// Verificar se é o dono do anúncio
async function canEditAd(adId: number, userId: string) {
  const supabase = createClient();
  
  const { data } = await supabase
    .from('marketplace_ads')
    .select('user_id')
    .eq('id', adId)
    .single();

  return data?.user_id === userId;
}
```

---

## 7. Upload de Imagens

### 7.1 Configurar Storage no Supabase

1. **Dashboard Supabase**
   - Storage > Create Bucket
   - Nome: `marketplace-images`
   - Tornar público

2. **Configurar CORS**
   - Policies > Add Policy
   - Permitir GET/POST para usuários autenticados

### 7.2 Função de Upload

```typescript
// lib/supabase/storage.ts
export async function uploadImage(file: File, bucket: string = 'marketplace-images') {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `public/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Obter URL pública
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Usar no formulário
const imageUrls = await Promise.all(
  images.map(img => uploadImage(img))
);
```

---

## 8. Testes

### 8.1 Testes Manuais

- [ ] Criar anúncio com imagens
- [ ] Editar anúncio
- [ ] Deletar anúncio
- [ ] Buscar anúncios (texto, categoria, preço)
- [ ] Ver detalhe do anúncio
- [ ] Adicionar aos favoritos
- [ ] Enviar mensagem ao vendedor
- [ ] Deixar review

### 8.2 Testes de Performance

```bash
# Lighthouse audit
npm run build
npm start

# Abrir http://localhost:3000/mercado-da-terra
# Chrome DevTools > Lighthouse
```

### 8.3 Testes de Segurança

- [ ] Verificar RLS no Supabase
- [ ] Testar permissões de edição
- [ ] Testar XSS na descrição
- [ ] Testar SQL injection

---

## 9. Deploy

### 9.1 Checklist Pre-Deploy

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Banco de dados em produção criado
- [ ] Storage configurado
- [ ] RLS políticas ativas
- [ ] Testes passando
- [ ] Build sem erros

```bash
npm run build
```

### 9.2 Deploy no Netlify

```bash
# Conectar repositório no Netlify
# Build command: npm run build
# Publish directory: .next
```

### 9.3 Configurar CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run lint
      # Deploy to Netlify
```

---

## 📝 Próximos Passos

1. **Copiar componentes** fornecidos para `/components/mercado-da-terra/`
2. **Executar SQL** no Supabase
3. **Criar páginas** seguindo o guia
4. **Configurar upload** de imagens
5. **Testar** funcionalidades
6. **Deploy** em produção

---

## 🆘 Troubleshooting

### Erro: "Table does not exist"
- Verificar se SQL foi executado
- Verificar nome da tabela em lowercase

### Erro: "Auth user is null"
- Verificar se o utilizador está autenticado
- Verificar variáveis de ambiente Supabase

### Imagens não aparecem
- Verificar URLs públicas do Storage
- Verificar CORS do bucket
- Verificar se ficheiros foram enviados

---

## 📚 Referências

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

