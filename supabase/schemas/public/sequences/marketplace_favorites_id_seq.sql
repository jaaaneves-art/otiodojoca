create sequence "public"."marketplace_favorites_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

alter sequence "public"."marketplace_favorites_id_seq" owned by "public"."marketplace_favorites"."id";

grant select, update, usage on sequence "public"."marketplace_favorites_id_seq" to "anon", "authenticated", "postgres", "service_role";
