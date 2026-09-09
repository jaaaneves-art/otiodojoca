begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(31);

-- Fixtures isoladas; o rollback final nao deixa dados na base local.
insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'social-a@example.test'),
  ('10000000-0000-0000-0000-000000000002', 'social-b@example.test'),
  ('10000000-0000-0000-0000-000000000003', 'social-c@example.test'),
  ('10000000-0000-0000-0000-000000000004', 'social-d@example.test');

-- Criados como postgres para preparar conversas conhecidas sem contornar
-- os cenarios RLS que serao executados mais abaixo como authenticated.
insert into public.conversations (id, type, direct_user_a, direct_user_b)
values
  ('20000000-0000-0000-0000-000000000001', 'direct',
   '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000002', 'direct',
   '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004');

insert into public.conversation_participants (conversation_id, user_id)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004');

insert into public.messages (id, conversation_id, sender_id, content)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001', 'mensagem privada AB'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000003', 'mensagem privada CD');

insert into public.call_rooms (id, conversation_id, livekit_room_name, started_by)
values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   'social-test-ab', '10000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002',
   'social-test-cd', '10000000-0000-0000-0000-000000000003');

select ok(relrowsecurity, 'RLS ativa em groups')
from pg_class where oid = 'public.groups'::regclass;
select ok(relrowsecurity, 'RLS ativa em group_members')
from pg_class where oid = 'public.group_members'::regclass;
select ok(relrowsecurity, 'RLS ativa em conversations')
from pg_class where oid = 'public.conversations'::regclass;
select ok(relrowsecurity, 'RLS ativa em conversation_participants')
from pg_class where oid = 'public.conversation_participants'::regclass;
select ok(relrowsecurity, 'RLS ativa em messages')
from pg_class where oid = 'public.messages'::regclass;
select ok(relrowsecurity, 'RLS ativa em message_media')
from pg_class where oid = 'public.message_media'::regclass;
select ok(relrowsecurity, 'RLS ativa em call_rooms')
from pg_class where oid = 'public.call_rooms'::regclass;
select ok(relrowsecurity, 'RLS ativa em call_participants')
from pg_class where oid = 'public.call_participants'::regclass;

select hasnt_table_privilege('anon', 'public.groups', 'SELECT', 'anon nao le grupos');
select hasnt_table_privilege('anon', 'public.messages', 'SELECT', 'anon nao le mensagens');
select hasnt_table_privilege('anon', 'public.call_rooms', 'SELECT', 'anon nao le chamadas');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select results_eq(
  $$select count(*)::bigint from public.conversations$$,
  $$values (1::bigint)$$,
  'A ve apenas a conversa AB'
);
select results_eq(
  $$select count(*)::bigint from public.messages$$,
  $$values (1::bigint)$$,
  'A ve apenas mensagens da conversa AB'
);
select results_eq(
  $$select count(*)::bigint from public.call_rooms$$,
  $$values (1::bigint)$$,
  'A ve apenas chamadas da conversa AB'
);

select throws_ok(
  $$select public.get_or_create_direct_conversation(
    '10000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000004', null)$$,
  '42501', 'Sem permissao para criar esta conversa',
  'A nao cria conversa entre C e D'
);
select throws_ok(
  $$select public.get_or_create_direct_conversation(
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001', null)$$,
  '22023', 'Uma conversa direta exige dois utilizadores diferentes',
  'conversa consigo proprio e rejeitada'
);
select lives_ok(
  $$select public.get_or_create_direct_conversation(
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003', null)$$,
  'A cria conversa da qual faz parte'
);

select throws_ok(
  $$insert into public.messages (conversation_id, sender_id, content)
    values ('20000000-0000-0000-0000-000000000002',
            '10000000-0000-0000-0000-000000000001', 'intrusao')$$,
  '42501', null, 'A nao envia mensagem para conversa alheia'
);
select throws_ok(
  $$insert into public.messages (conversation_id, sender_id, content)
    values ('20000000-0000-0000-0000-000000000001',
            '10000000-0000-0000-0000-000000000002', 'identidade falsa')$$,
  '42501', null, 'A nao envia mensagem em nome de B'
);
select lives_ok(
  $$insert into public.messages (conversation_id, sender_id, content)
    values ('20000000-0000-0000-0000-000000000001',
            '10000000-0000-0000-0000-000000000001', 'mensagem valida')$$,
  'A envia mensagem na sua conversa'
);
select throws_ok(
  $$update public.messages set content = 'alterada'
    where id = '30000000-0000-0000-0000-000000000001'$$,
  '42501', null, 'A nao altera o conteudo da mensagem'
);
select lives_ok(
  $$update public.messages set deleted_at = now()
    where id = '30000000-0000-0000-0000-000000000001'$$,
  'A faz soft delete da propria mensagem'
);

select throws_ok(
  $$insert into public.call_participants (call_room_id, user_id)
    values ('40000000-0000-0000-0000-000000000002',
            '10000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'A nao entra em chamada alheia'
);
select lives_ok(
  $$insert into public.call_participants (call_room_id, user_id)
    values ('40000000-0000-0000-0000-000000000001',
            '10000000-0000-0000-0000-000000000001')$$,
  'A entra na chamada da sua conversa'
);
select lives_ok(
  $$update public.call_participants set left_at = now()
    where call_room_id = '40000000-0000-0000-0000-000000000001'
      and user_id = '10000000-0000-0000-0000-000000000001'$$,
  'A regista a propria saida'
);

select lives_ok(
  $$insert into public.groups (id, name, owner_id)
    values ('50000000-0000-0000-0000-000000000001', 'Grupo A',
            '10000000-0000-0000-0000-000000000001')$$,
  'A cria um grupo em seu nome'
);
select results_eq(
  $$select role from public.group_members
    where group_id = '50000000-0000-0000-0000-000000000001'
      and user_id = '10000000-0000-0000-0000-000000000001'$$,
  $$values ('owner'::text)$$,
  'criador torna-se owner automaticamente'
);
select results_eq(
  $$select count(*)::bigint from public.conversation_participants cp
    join public.conversations c on c.id = cp.conversation_id
    where c.group_id = '50000000-0000-0000-0000-000000000001'
      and cp.user_id = '10000000-0000-0000-0000-000000000001'$$,
  $$values (1::bigint)$$,
  'owner e sincronizado para a conversa do grupo'
);
select lives_ok(
  $$insert into public.group_members (group_id, user_id, role)
    values ('50000000-0000-0000-0000-000000000001',
            '10000000-0000-0000-0000-000000000002', 'member')$$,
  'owner adiciona membro'
);
select results_eq(
  $$with deleted as (
      delete from public.group_members
      where group_id = '50000000-0000-0000-0000-000000000001'
        and user_id = '10000000-0000-0000-0000-000000000001'
      returning 1
    ) select count(*)::bigint from deleted$$,
  $$values (0::bigint)$$,
  'owner canonico nao pode ser removido pela RLS'
);

select throws_ok(
  $$update public.groups
    set owner_id = '10000000-0000-0000-0000-000000000002'
    where id = '50000000-0000-0000-0000-000000000001'$$,
  '42501', null, 'owner_id nao pode ser transferido pela API'
);

select * from finish();
rollback;
