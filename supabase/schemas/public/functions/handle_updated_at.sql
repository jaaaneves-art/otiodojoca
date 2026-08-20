create or replace function public.handle_updated_at()
  returns trigger
  language plpgsql
  AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$;

grant execute on function "public"."handle_updated_at"() to public, "anon", "authenticated", "postgres", "service_role";
