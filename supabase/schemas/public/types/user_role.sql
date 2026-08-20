create type "public"."user_role" as enum (
  'user',
  'moderator',
  'admin'
);

grant usage on type "public"."user_role" to "postgres";
