import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260910100000_pets_module_v1.sql", import.meta.url),
  "utf8",
);
const actions = readFileSync(
  new URL("../../app/mundo-dos-patudos/actions.ts", import.meta.url),
  "utf8",
);

test("all pet data tables enable RLS", () => {
  for (const table of ["pet_posts", "pet_photos", "pet_reports"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
});

test("public feed exposes only published or resolved cases", () => {
  assert.match(migration, /status in \('published', 'resolved'\) or author_id = auth\.uid\(\) or public\.pet_is_admin\(\)/);
});

test("owners cannot transfer immutable publication identity", () => {
  assert.match(migration, /new\.author_id is distinct from old\.author_id/);
  assert.match(migration, /new\.submission_key is distinct from old\.submission_key/);
  assert.match(migration, /raise exception 'Campos imutáveis'/);
});

test("submission keys prevent repeated-click duplicates", () => {
  assert.match(migration, /unique \(author_id, submission_key\)/);
  assert.match(actions, /eq\("submission_key", submissionKey\)/);
});

test("photo limits are enforced in database, storage and server action", () => {
  assert.match(migration, /sort_order between 0 and 2/);
  assert.match(migration, /size_bytes between 1 and 4194304/);
  assert.match(migration, /file_size_limit, allowed_mime_types/);
  assert.match(actions, /const MAX_PHOTOS = 3/);
  assert.match(actions, /const MAX_PHOTO_SIZE = 4 \* 1024 \* 1024/);
});

test("storage writes are bound to the authenticated owner and post", () => {
  const start = migration.indexOf("function public.pet_media_can_write");
  const body = migration.slice(start, migration.indexOf("$$;", start));
  assert.match(body, /split_part\(p_name, '\/', 1\) = auth\.uid\(\)::text/);
  assert.match(body, /p\.id::text = split_part\(p_name, '\/', 2\)/);
  assert.match(body, /p\.author_id = auth\.uid\(\)/);
});

test("reports are private to their author and administrators", () => {
  assert.match(migration, /pets reports own or admin read[\s\S]*reporter_id = auth\.uid\(\) or public\.pet_is_admin\(\)/);
  assert.match(migration, /pets reports admin update[\s\S]*public\.pet_is_admin\(\)/);
});
