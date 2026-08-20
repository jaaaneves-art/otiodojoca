create or replace function public.handle_new_post()
  returns trigger
  language plpgsql
  AS $function$
begin
    update threads
    set replies_count = replies_count + 1,
        last_post_at = now()
    where id = new.thread_id;
    return new;
end;
$function$;

grant execute on function "public"."handle_new_post"() to public, "anon", "authenticated", "postgres", "service_role";
