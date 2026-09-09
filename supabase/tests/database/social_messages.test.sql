begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(10);

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

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select lives_ok($$select public.social_send_message('20000000-0000-0000-0000-000000000001', 'Olá')$$, 'Participante envia texto');
select throws_ok($$select public.social_send_message('20000000-0000-0000-0000-000000000002', 'Intrusão')$$,
  '42501', null, 'Não envia para conversa alheia');
select throws_ok($$select public.social_send_message('20000000-0000-0000-0000-000000000001', '   ')$$,
  'P0001', 'Mensagem inválida', 'Rejeita mensagem vazia');
select throws_ok($$select public.social_send_message('20000000-0000-0000-0000-000000000001', repeat('x',5001))$$,
  'P0001', 'Mensagem inválida', 'Rejeita texto demasiado longo');
select throws_ok($$select public.social_send_message('20000000-0000-0000-0000-000000000001', '',
  '20000000-0000-0000-0000-000000000001/10000000-0000-0000-0000-000000000001/inexistente', 'application/pdf', 100)$$,
  '42501', null, 'Não associa um objeto inexistente');
select results_eq($$select count(*)::bigint from public.messages where conversation_id = '20000000-0000-0000-0000-000000000001'$$,
  $$values (2::bigint)$$, 'Falha do anexo não deixa uma mensagem parcial');
select lives_ok($$select public.social_mark_read('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001')$$,
  'Participante marca leitura');
select ok((select last_read_at is not null from public.conversation_participants
  where conversation_id = '20000000-0000-0000-0000-000000000001' and user_id = auth.uid()), 'Leitura registada');
select throws_ok($$select public.social_mark_read('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002')$$,
  '42501', null, 'Não marca leitura de conversa alheia');
select throws_ok($$select public.social_mark_read('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002')$$,
  'P0001', 'Mensagem inválida', 'Cursor de leitura tem de pertencer à conversa');
select * from finish();
rollback;
