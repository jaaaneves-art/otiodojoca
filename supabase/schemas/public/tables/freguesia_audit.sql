create table "public"."freguesia_audit" (
  "id"           bigint                   not null default nextval('public.freguesia_audit_id_seq'::regclass),
  "freguesia_id" bigint,
  "action"       character varying(50),
  "changed_data" jsonb,
  "changed_by"   character varying(255),
  "changed_at"   timestamp with time zone default current_timestamp,
  constraint "freguesia_audit_pkey" primary key (id),
  constraint "freguesia_audit_freguesia_id_fkey" foreign key (freguesia_id) references public.freguesias(id) on delete cascade
);

alter table "public"."freguesia_audit"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."freguesia_audit" to "anon", "authenticated", "postgres", "service_role";
