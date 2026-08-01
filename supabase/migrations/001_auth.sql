-- =====================================================
-- OTJ
-- Migration: 001_auth.sql (v1.0)
-- Descrição: Estrutura base da autenticação
-- =====================================================

create extension if not exists pgcrypto;

-- =====================================================
-- Tipo: papel do utilizador
-- =====================================================

create type public.user_role as enum (
    'admin',
    'moderator',
    'user'
);

-- =====================================================
-- Perfis dos utilizadores
-- =====================================================

create table public.profiles (

    id uuid primary key
        references auth.users(id)
        on delete cascade,

    role public.user_role
        not null
        default 'user',

    username text
        not null
        check (length(username) between 3 and 30),

    name text,

    email text
        not null
        unique,

    avatar_url text,

    email_verified boolean
        not null
        default false,

    two_factor_enabled boolean
        not null
        default false,

    created_at timestamptz
        not null
        default now(),

    updated_at timestamptz
        not null
        default now(),

    deleted_at timestamptz
);

-- =====================================================
-- Sessões dos utilizadores
-- =====================================================

create table public.user_sessions (

    id uuid primary key
        default gen_random_uuid(),

    user_id uuid
        not null
        references public.profiles(id)
        on delete cascade,

    device text,

    browser text,

    ip inet,

    user_agent text,

    created_at timestamptz
        not null
        default now(),

    last_seen timestamptz
        not null
        default now(),

    revoked boolean
        not null
        default false
);

-- =====================================================
-- Códigos de recuperação 2FA
-- =====================================================

create table public.recovery_codes (

    id uuid primary key
        default gen_random_uuid(),

    user_id uuid
        not null
        references public.profiles(id)
        on delete cascade,

    code_hash text
        not null,

    used boolean
        not null
        default false,

    created_at timestamptz
        not null
        default now()
);

-- =====================================================
-- Auditoria
-- =====================================================

create table public.audit_log (

    id bigint
        generated always as identity
        primary key,

    user_id uuid
        references public.profiles(id)
        on delete set null,

    action text
        not null,

    success boolean
        not null
        default true,

    ip inet,

    user_agent text,

    details jsonb,

    created_at timestamptz
        not null
        default now()
);

-- =====================================================
-- Índices
-- =====================================================

create unique index idx_profiles_username
    on public.profiles (lower(username));

create index idx_profiles_role
    on public.profiles(role);

create index idx_user_sessions_user_id
    on public.user_sessions(user_id);

create index idx_user_sessions_last_seen
    on public.user_sessions(last_seen);

create index idx_recovery_codes_user_id
    on public.recovery_codes(user_id);

create index idx_audit_log_user_id
    on public.audit_log(user_id);

create index idx_audit_log_created_at
    on public.audit_log(created_at);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

alter table public.profiles
    enable row level security;

alter table public.user_sessions
    enable row level security;

alter table public.recovery_codes
    enable row level security;

alter table public.audit_log
    enable row level security;

-- =====================================================
-- Policies
-- =====================================================

-- Profiles

create policy "Users can view their own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id);

create policy "Users can delete their own profile"
on public.profiles
for delete
using (auth.uid() = id);

-- User Sessions

create policy "Users can view their own sessions"
on public.user_sessions
for select
using (auth.uid() = user_id);

create policy "Users can manage their own sessions"
on public.user_sessions
for all
using (auth.uid() = user_id);

-- Recovery Codes

create policy "Users can manage their own recovery codes"
on public.recovery_codes
for all
using (auth.uid() = user_id);

-- Audit Log

create policy "Users can view their own audit log"
on public.audit_log
for select
using (auth.uid() = user_id);

-- =====================================================
-- Trigger: criar perfil automaticamente após registo
-- =====================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (
        id,
        email,
        name,
        username
    )
    values (
        new.id,
        new.email,
        new.raw_user_meta_data->>'name',
        lower(
            coalesce(
                new.raw_user_meta_data->>'username',
                split_part(new.email, '@', 1)
            )
        )
    );

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- =====================================================
-- Trigger: atualizar updated_at automaticamente
-- =====================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    if row(new.*) is distinct from row(old.*) then
        new.updated_at = now();
    end if;

    return new;
end;
$$;

drop trigger if exists on_profile_updated on public.profiles;

create trigger on_profile_updated
before update on public.profiles
for each row
execute function public.handle_updated_at();

-- =====================================================
-- Comentários
-- =====================================================

comment on table public.profiles
    is 'Perfis dos utilizadores, ligados a auth.users';

comment on column public.profiles.role
    is 'Papel do utilizador: admin, moderator ou user';

comment on column public.profiles.username
    is 'Nome de utilizador único (case-insensitive), 3 a 30 caracteres';

comment on column public.profiles.email
    is 'Cópia do email de auth.users para simplificar consultas';

comment on column public.profiles.deleted_at
    is 'Data de desativação da conta (soft delete); NULL = conta ativa';

comment on table public.user_sessions
    is 'Sessões ativas e históricas dos utilizadores';

comment on table public.recovery_codes
    is 'Códigos de recuperação 2FA (armazenados como hash)';

comment on table public.audit_log
    is 'Registo de auditoria de ações de autenticação e segurança';

comment on column public.audit_log.success
    is 'true = ação bem-sucedida; false = tentativa falhada';