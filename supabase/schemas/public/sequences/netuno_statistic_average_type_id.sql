create sequence "public"."netuno_statistic_average_type_id" as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 START with 1 cache 1 no cycle;

grant select, update, usage on sequence "public"."netuno_statistic_average_type_id" to "anon", "authenticated", "postgres", "service_role";
