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
  "user_id"          uuid,
  "created_at"       timestamp with time zone not null default now(),
  "updated_at"       timestamp with time zone not null default now(),
  constraint "check_datas" check ((data_saida > data_entrada)),
  constraint "reservas_alojamento_alojamento_id_fkey" foreign key (alojamento_id) references public.alojamentos(id) on delete restrict,
  constraint "reservas_alojamento_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade,
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

create index idx_reservas_alojamento_user_id on public.reservas_alojamento using btree (user_id);

-- Reserva fica ligada ao utilizador autenticado que a criou (user_id).
-- Sem exceção anónima -- ao contrário de restaurante_reservas, este
-- módulo não tem hoje um caminho de reserva sem sessão (a página já
-- exige login via middleware). "Staff" (moderator/admin) vê e gere
-- todas as reservas, seguindo o precedente de audit_log.sql.

create policy "Reservas alojamento - criar a propria" on "public"."reservas_alojamento"
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Reservas alojamento - ver propria ou staff" on "public"."reservas_alojamento"
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('moderator', 'admin')
    )
  );

create policy "Reservas alojamento - editar propria ou staff" on "public"."reservas_alojamento"
  for update
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('moderator', 'admin')
    )
  )
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('moderator', 'admin')
    )
  );

grant select, insert, update on table "public"."reservas_alojamento" to "authenticated";
