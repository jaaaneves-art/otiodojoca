create table "public"."reservas_alojamento" (
  "id"               bigint                   generated always as identity not null,
  "alojamento_id"    bigint                   not null,
  "nome_hospede"     text                     not null,
  "email_hospede"    character varying        not null,
  "telefone_hospede" character varying,
  "data_entrada"     date                     not null,
  "data_saida"       date                     not null,
  "num_pessoas"      integer                  not null,
  "num_quartos"      integer                  not null,
  "tipo_refeicao"    character varying        not null,
  "preco_total"      numeric(10,2)            not null,
  "status"           character varying        not null default 'pendente'::character varying,
  "observacoes"      text,
  "created_at"       timestamp with time zone not null default now(),
  "updated_at"       timestamp with time zone not null default now(),
  constraint "check_datas" check ((data_saida > data_entrada)),
  constraint "reservas_alojamento_alojamento_id_fkey" foreign key (alojamento_id) references public.alojamentos(id) on delete restrict,
  constraint "reservas_alojamento_num_pessoas_check" check ((num_pessoas > 0)),
  constraint "reservas_alojamento_num_quartos_check" check ((num_quartos > 0)),
  constraint "reservas_alojamento_pkey" primary key (id),
  constraint "reservas_alojamento_status_check"
    check
    (((status)::text = ANY ((ARRAY['pendente'::character varying, 'confirmada'::character varying, 'concluido'::character varying, 'cancelada'::character varying])::text[]))),
  constraint "reservas_alojamento_tipo_refeicao_check"
    check
    (((tipo_refeicao)::text = ANY ((ARRAY['sem_refeicoes'::character varying, 'pequeno_almoco'::character varying, 'meia_pensao'::character varying, 'pensao_completa'::character
    varying, 'almoço'::character varying, 'jantar'::character varying])::text[])))
);

alter table "public"."reservas_alojamento"
  enable row level security;

create index idx_reservas_alojamento_id on public.reservas_alojamento using btree (alojamento_id);

create index idx_reservas_data_entrada on public.reservas_alojamento using btree (data_entrada);

create index idx_reservas_email on public.reservas_alojamento using btree (email_hospede);

create index idx_reservas_status on public.reservas_alojamento using btree (status);

create policy "Reservas - INSERT para todos" on "public"."reservas_alojamento"
  for insert
  to PUBLIC
  with check (true);

create policy "Reservas - SELECT públicas" on "public"."reservas_alojamento"
  for select
  to PUBLIC
  using (true);

create policy "Reservas - UPDATE próprias" on "public"."reservas_alojamento"
  for update
  to PUBLIC
  using (true)
  with check (true);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."reservas_alojamento" to "anon", "authenticated", "postgres", "service_role";
