-- ============================================================
-- OTJ - CACHE DE GEOCODIFICACAO POR CODIGO POSTAL
-- ============================================================
-- Cache local de coordenadas por codigo postal (formato "0000-000"),
-- extraido e agregado do dump publico do projeto codigos-postais-pt
-- (ver relatorios/ para o pipeline de extracao). Usado por
-- app/api/geocode/route.ts como primeira tentativa, antes de cair no
-- Nominatim (OpenStreetMap) para os codigos que aqui nao existirem.
--
-- Depois de correr este ficheiro, importar
-- codigos_postais_geo.csv (~196 mil linhas) via
-- Table Editor -> codigos_postais_geo -> Insert -> Import data from CSV.

CREATE TABLE IF NOT EXISTS codigos_postais_geo (
  codigo_postal VARCHAR(8) PRIMARY KEY,

  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,

  CONSTRAINT codigos_postais_geo_codigo_postal_check
    CHECK (codigo_postal ~ '^[0-9]{4}-[0-9]{3}$'),

  CONSTRAINT codigos_postais_geo_latitude_check
    CHECK (latitude BETWEEN -90 AND 90),

  CONSTRAINT codigos_postais_geo_longitude_check
    CHECK (longitude BETWEEN -180 AND 180)
);

ALTER TABLE codigos_postais_geo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura publica de codigos_postais_geo"
  ON codigos_postais_geo FOR SELECT
  TO public
  USING (true);
