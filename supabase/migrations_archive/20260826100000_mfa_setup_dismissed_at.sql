-- MFA opcional para utilizadores de nivel "user":
-- guarda quando o utilizador dispensou a sugestao de configurar o MFA,
-- para nao voltarmos a forcar o ecra de setup depois disso.
alter table "public"."profiles"
  add column "mfa_setup_dismissed_at" timestamp with time zone;

grant update ("mfa_setup_dismissed_at") on table "public"."profiles" to "authenticated";
