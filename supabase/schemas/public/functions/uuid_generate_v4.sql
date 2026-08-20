create or replace function public.uuid_generate_v4()
  returns uuid
  language sql
  AS $function$SELECT extensions.uuid_generate_v4();$function$;

grant execute on function "public"."uuid_generate_v4"() to public, "anon", "authenticated", "postgres", "service_role";
