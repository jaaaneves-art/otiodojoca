CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE FUNCTION public.e_menor_agora() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('test.minor',true),'false') = 'true' $$;
CREATE FUNCTION public.pode_publicar_fora_grupo() RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
CREATE TABLE categories(id integer PRIMARY KEY, type text);
INSERT INTO categories VALUES (1,'lup'),(2,'other');
CREATE TABLE marketplace_ads(id serial PRIMARY KEY, author_id uuid NOT NULL,module text,title text,description text,type text,
 category_id integer REFERENCES categories, location text,contact_method text,price_type text,price numeric(10,2),status text,details jsonb,updated_at timestamptz);
ALTER TABLE marketplace_ads ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public,auth TO authenticated;
GRANT SELECT ON marketplace_ads TO authenticated;
-- authenticated has no direct DML grants, exactly the incompatibility under test.
