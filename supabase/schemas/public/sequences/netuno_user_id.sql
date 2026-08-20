create sequence "public"."netuno_user_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

grant select, update, usage on sequence "public"."netuno_user_id" to "anon", "authenticated", "postgres", "service_role";
