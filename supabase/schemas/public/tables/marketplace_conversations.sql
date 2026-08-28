create table "public"."marketplace_conversations" (
  "id"         integer                  not null default nextval('public.marketplace_conversations_id_seq'::regclass),
  -- Nullable desde 28/08/2026: uma conversa direta entre dois stands
  -- verificados (StandGo) não está ligada a nenhum anúncio -- ver
  -- migration 20260828140000_stand_automovel_contacto_direto.sql.
  "ad_id"      integer,
  "buyer_id"   uuid                     not null,
  "seller_id"  uuid                     not null,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  -- Só preenchido de facto quando ad_id é null (conversa direta) -- nesse
  -- caso é a única forma de saber a que módulo a conversa pertence,
  -- porque não há anúncio para o dizer.
  "module"     text,
  constraint "marketplace_conversations_ad_id_buyer_id_key" unique (ad_id, buyer_id),
  constraint "marketplace_conversations_ad_id_fkey" foreign key (ad_id) references public.marketplace_ads(id) on delete cascade,
  constraint "marketplace_conversations_buyer_id_fkey" foreign key (buyer_id) references auth.users(id) on delete cascade,
  constraint "marketplace_conversations_pkey" primary key (id),
  constraint "marketplace_conversations_seller_id_fkey" foreign key (seller_id) references auth.users(id) on delete cascade
);

alter table "public"."marketplace_conversations"
  enable row level security;

create index idx_conversations_ad on public.marketplace_conversations using btree (ad_id);

create index idx_conversations_buyer on public.marketplace_conversations using btree (buyer_id);

create index idx_conversations_seller on public.marketplace_conversations using btree (seller_id);

-- Um par de utilizadores só pode ter UMA conversa direta (ad_id null)
-- entre si, seja quem for o primeiro a contactar (least/greatest
-- normaliza a ordem do par).
create unique index idx_conversations_par_direto
  on public.marketplace_conversations (least(buyer_id, seller_id), greatest(buyer_id, seller_id))
  where ad_id is null;

create policy "Users create conversations as buyer" on "public"."marketplace_conversations"
  for insert
  to PUBLIC
  with check ((auth.uid() = buyer_id));

create policy "Users see their conversations" on "public"."marketplace_conversations"
  for select
  to PUBLIC
  using (((auth.uid() = buyer_id) or (auth.uid() = seller_id)));

create policy "Users update their conversations" on "public"."marketplace_conversations"
  for update
  to PUBLIC
  using (((auth.uid() = buyer_id) or (auth.uid() = seller_id)));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."marketplace_conversations" to "anon", "authenticated", "postgres", "service_role";
