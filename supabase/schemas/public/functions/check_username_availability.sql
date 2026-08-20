create or replace function public.check_username_availability (
  p_username text
)
  returns boolean
  language plpgsql
  AS $function$
BEGIN
    RETURN NOT (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE LOWER(p.username) = LOWER(p_username)
        )
        OR EXISTS (
            SELECT 1
            FROM public.reserved_usernames r
            WHERE LOWER(r.username) = LOWER(p_username)
        )
        OR EXISTS (
            SELECT 1
            FROM public.username_history h
            WHERE LOWER(h.old_username) = LOWER(p_username)
        )
    );
END;
$function$;

grant execute on function "public"."check_username_availability"(text) to public, "anon", "authenticated", "postgres", "service_role";
