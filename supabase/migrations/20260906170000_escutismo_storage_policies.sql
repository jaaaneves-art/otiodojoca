-- Policies dos buckets do Escutismo.
--
-- Buckets criados manualmente no painel:
--   escutismo-fotos-originais  · privado · 5 MB · jpeg/png/webp
--   escutismo-fotos-publicas   · público · 2 MB · jpeg/webp
--
-- CONVENÇÃO DE CAMINHOS: <agrupamento_id>/<nome>.jpg
-- O primeiro segmento identifica o agrupamento. Um ficheiro na raiz do
-- bucket fica inacessível a toda a gente, sem erro a explicar porquê.

CREATE POLICY "escutismo_originais_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'escutismo-fotos-originais'
  AND (
    (storage.foldername(name))[1]::uuid = escutismo_meu_agrupamento()
    OR escutismo_e_responsavel((storage.foldername(name))[1]::uuid)
    OR escutismo_e_nacional()
  )
);

CREATE POLICY "escutismo_originais_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'escutismo-fotos-originais'
  AND (
    (storage.foldername(name))[1]::uuid = escutismo_meu_agrupamento()
    OR escutismo_e_responsavel((storage.foldername(name))[1]::uuid)
  )
);

CREATE POLICY "escutismo_originais_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'escutismo-fotos-originais'
  AND escutismo_e_responsavel((storage.foldername(name))[1]::uuid)
);

-- Bucket público: só o derivado desfocado. Escrita só por service role
-- (sem policy de INSERT) — o desfoque é gerado no servidor.
CREATE POLICY "escutismo_publicas_select"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'escutismo-fotos-publicas');
