create or replace function public.generate_username (
  base_name text
)
  returns text
  language plpgsql
  AS $function$
DECLARE
    base_username TEXT;
    final_username TEXT;
    suffix INTEGER := 2;
BEGIN

    base_username := LOWER(
        REGEXP_REPLACE(
            UNACCENT(
                COALESCE(NULLIF(TRIM(base_name), ''), 'user')
            ),
            '[^a-z0-9_]',
            '',
            'g'
        )
    );

    IF LENGTH(base_username) < 2 THEN
        base_username := 'user';
    END IF;

    final_username := base_username;

    LOOP

        EXIT WHEN NOT EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE LOWER(p.username)=LOWER(final_username)
        )
        AND NOT EXISTS (
            SELECT 1
            FROM public.reserved_usernames r
            WHERE LOWER(r.username)=LOWER(final_username)
        )
        AND NOT EXISTS (
            SELECT 1
            FROM public.username_history h
            WHERE LOWER(h.old_username)=LOWER(final_username)
        );

        final_username := base_username || suffix;
        suffix := suffix + 1;

        IF suffix > 1000 THEN
            final_username :=
                'u_' ||
                substring(
                    replace(gen_random_uuid()::text,'-','')
                    from 1 for 20
                );

            EXIT;
        END IF;

    END LOOP;

    RETURN final_username;

END;
$function$;

grant execute on function "public"."generate_username"(text) to public, "anon", "authenticated", "postgres", "service_role";
