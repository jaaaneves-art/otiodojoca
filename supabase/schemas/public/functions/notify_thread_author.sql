create or replace function public.notify_thread_author()
  returns trigger
  language plpgsql
  security definer
  set search_path to 'public', 'pg_temp'
  AS $function$
declare
    thread_author uuid;
    thread_title text;
begin
    select author_id, title into thread_author, thread_title
    from threads where id = new.thread_id;

    if thread_author != new.author_id then
        insert into notifications (user_id, type, message, link)
        values (
            thread_author,
            'reply',
            'Nova resposta no topico "' || thread_title || '"',
            '/forum/topico/' || new.thread_id
        );
    end if;

    return new;
end;
$function$;

grant execute on function "public"."notify_thread_author"() to public, "anon", "authenticated", "postgres", "service_role";
