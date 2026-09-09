import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260909120000_social_module_phase3_rls.sql", import.meta.url),
  "utf8",
);

test("all social SECURITY DEFINER functions pin an empty search_path", () => {
  const definitions = [
    "is_conversation_participant",
    "is_group_member",
    "is_group_manager",
    "get_or_create_direct_conversation",
    "handle_new_group",
    "sync_group_conversation_participants",
  ];

  for (const name of definitions) {
    const start = migration.indexOf(`function public.${name}`);
    assert.notEqual(start, -1, `${name} must be defined`);
    const body = migration.slice(start, migration.indexOf("$$;", start));
    assert.match(body, /security definer\s+set search_path = ''/i, `${name} must pin search_path`);
  }
});

test("direct conversation RPC binds ordinary callers to the pair", () => {
  assert.match(migration, /coalesce\(auth\.role\(\), ''\) <> 'service_role'/);
  assert.match(migration, /auth\.uid\(\) not in \(user_a, user_b\)/);
  assert.match(migration, /user_a is null or user_b is null or user_a = user_b/);
});

test("group membership policies use a non-recursive manager helper", () => {
  assert.match(migration, /function public\.is_group_manager/);
  assert.match(migration, /create policy "Owner\/admin adiciona membros"[\s\S]*public\.is_group_manager\(group_id\)/);
  assert.match(migration, /create policy "Owner\/admin altera membros"/);
  assert.match(migration, /create policy "Owner\/admin remove membros"/);
  assert.match(migration, /role <> 'owner'/);
});

test("group creation atomically creates its owner membership", () => {
  const start = migration.indexOf("function public.handle_new_group");
  const body = migration.slice(start, migration.indexOf("$$;", start));
  assert.match(body, /insert into public\.conversations/);
  assert.match(body, /insert into public\.group_members/);
  assert.match(body, /values \(new\.id, new\.owner_id, 'owner'\)/);
});

test("authenticated users cannot transfer group ownership by updating owner_id", () => {
  assert.match(migration, /revoke update on public\.groups from authenticated/);
  assert.match(migration, /grant update \(name, description, image_url\) on public\.groups to authenticated/);
});

test("message updates are restricted to deleted_at and conversation members", () => {
  assert.match(migration, /revoke update on public\.messages from authenticated/);
  assert.match(migration, /grant update \(deleted_at\) on public\.messages to authenticated/);
  assert.match(migration, /sender_id = auth\.uid\(\)[\s\S]*is_conversation_participant\(conversation_id\)/);
});

test("call entry and exit require membership in the underlying conversation", () => {
  const start = migration.indexOf('drop policy if exists "Utilizador regista a sua propria entrada/saida"');
  const body = migration.slice(start);
  assert.match(body, /user_id = auth\.uid\(\)[\s\S]*is_conversation_participant\(cr\.conversation_id\)/);
  assert.match(body, /create policy "Utilizador regista a sua propria saida"/);
  assert.match(body, /grant update \(left_at\)/);
});
