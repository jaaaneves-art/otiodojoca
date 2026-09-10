begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(16);

insert into auth.users (id, email) values
  ('71000000-0000-0000-0000-000000000001', 'pets-a@example.test'),
  ('71000000-0000-0000-0000-000000000002', 'pets-b@example.test'),
  ('71000000-0000-0000-0000-000000000003', 'pets-admin@example.test');
update public.profiles set is_admin = true where id = '71000000-0000-0000-0000-000000000003';
insert into public.freguesias (id, cod_ine, nome, municipio, active)
values (71000000, 'pets-test', 'Freguesia Teste', 'Município Teste', true);

select ok(relrowsecurity, 'RLS ativa em pet_posts') from pg_class where oid = 'public.pet_posts'::regclass;
select ok(relrowsecurity, 'RLS ativa em pet_photos') from pg_class where oid = 'public.pet_photos'::regclass;
select ok(relrowsecurity, 'RLS ativa em pet_reports') from pg_class where oid = 'public.pet_reports'::regclass;
select hasnt_table_privilege('anon', 'public.pet_posts', 'INSERT', 'anon nao publica casos');
select hasnt_table_privilege('anon', 'public.pet_reports', 'SELECT', 'anon nao le denuncias');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"71000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select lives_ok($$insert into public.pet_posts
  (id,author_id,submission_key,kind,status,title,description,species,freguesia_id)
  values ('72000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000001',
  '73000000-0000-4000-8000-000000000001','adoption','published','Uma casa responsável',
  'Descrição suficientemente longa para o caso de teste.', 'dog',71000000)$$, 'autor publica em seu nome');
select lives_ok($$insert into public.pet_posts
  (id,author_id,submission_key,kind,status,title,description,species,freguesia_id)
  values ('72000000-0000-0000-0000-000000000002','71000000-0000-0000-0000-000000000001',
  '73000000-0000-4000-8000-000000000002','help','draft','Ajuda temporária segura',
  'Descrição suficientemente longa para o segundo caso.', 'cat',71000000)$$, 'autor cria rascunho');
select throws_ok($$insert into public.pet_posts
  (author_id,submission_key,kind,status,title,description,species,freguesia_id)
  values ('71000000-0000-0000-0000-000000000002','73000000-0000-4000-8000-000000000003',
  'help','published','Identidade alheia','Descrição suficientemente longa para tentar usurpar identidade.', 'cat',71000000)$$,
  '42501', null, 'A nao publica em nome de B');
select throws_ok($$insert into public.pet_posts
  (author_id,submission_key,kind,status,title,description,species,freguesia_id)
  values ('71000000-0000-0000-0000-000000000001','73000000-0000-4000-8000-000000000001',
  'help','published','Clique repetido','Descrição suficientemente longa para repetir a submissão.', 'cat',71000000)$$,
  '23505', null, 'chave de submissao impede duplicado');
select results_eq($$select count(*)::bigint from public.pet_posts$$,$$values (2::bigint)$$,'A ve publicado e rascunho próprios');

reset role; set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"71000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select results_eq($$select count(*)::bigint from public.pet_posts$$,$$values (1::bigint)$$,'B nao ve rascunho de A');
select results_eq($$with changed as (update public.pet_posts set title='Intrusão' where id='72000000-0000-0000-0000-000000000001' returning 1) select count(*)::bigint from changed$$,$$values (0::bigint)$$,'B nao altera caso de A');
select lives_ok($$insert into public.pet_reports(post_id,reporter_id,reason) values
  ('72000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000002','incorrect')$$,'B denuncia caso público');
select throws_ok($$insert into public.pet_reports(post_id,reporter_id,reason) values
  ('72000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000002','duplicate')$$,
  '23505', null, 'B nao denuncia o mesmo caso duas vezes');

reset role; set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"71000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select results_eq($$select count(*)::bigint from public.pet_reports where status='pending'$$,$$values (1::bigint)$$,'admin ve denuncia pendente');
select lives_ok($$update public.pet_reports set status='reviewed',reviewed_by='71000000-0000-0000-0000-000000000003',reviewed_at=now() where status='pending'$$,'admin modera denuncia');

select * from finish();
rollback;
