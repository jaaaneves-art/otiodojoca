create view "public"."calendar_events_public" with (security_invoker=true) AS  SELECT e.id,
    e.title,
    e.slug,
    e.description,
    e.starts_at,
    e.ends_at,
    e.all_day,
    e.location_name,
    e.municipality,
    e.district,
    e.is_featured,
    c.name AS category_name,
    c.color AS category_color,
    c.icon AS category_icon
   FROM (public.calendar_events e
     LEFT JOIN public.calendar_categories c ON ((c.id = e.category_id)))
  WHERE ((e.visibility = 'public'::text) AND (e.status = 'published'::text));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."calendar_events_public" to "anon", "authenticated", "postgres", "service_role";
