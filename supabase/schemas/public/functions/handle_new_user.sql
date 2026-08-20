create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path to 'public'
  AS $function$
DECLARE
    v_generated_username TEXT;
    v_display_name_input TEXT;
BEGIN
    v_display_name_input := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
        split_part(NEW.email, '@', 1)
    );

    v_generated_username := public.generate_username(v_display_name_input);

    INSERT INTO public.profiles (
        id, display_name, username, email, created_at, updated_at
    )
    VALUES (
        NEW.id, v_display_name_input, v_generated_username, NEW.email, NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$function$;

grant execute on function "public"."handle_new_user"() to public, "anon", "authenticated", "postgres", "service_role";
