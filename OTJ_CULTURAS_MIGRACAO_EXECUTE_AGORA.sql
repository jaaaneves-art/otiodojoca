-- =====================================================================
-- OTJ — AUDITORIA CULTURAS_GUIA
-- FASE 4: MIGRAÇÃO SQL — COM COMMIT AUTOMÁTICO
-- =====================================================================

BEGIN;

-- FASE 4.4: NORMALIZAÇÃO DE CAPITALIZAÇÃO
UPDATE culturas_guia SET categoria = 'Hortaliça' WHERE categoria = 'hortaliça';
UPDATE culturas_guia SET categoria = 'Fruteira' WHERE categoria = 'fruteira';
UPDATE culturas_guia SET categoria = 'Aromática' WHERE categoria = 'aromática';
UPDATE culturas_guia SET categoria = 'Legume' WHERE categoria = 'legume';
UPDATE culturas_guia SET categoria = 'Cereal' WHERE categoria = 'cereal';
UPDATE culturas_guia SET categoria = 'Tubérculo' WHERE categoria = 'tubérculo';

-- FASE 4.5: DESCOMPOSIÇÃO DE CATEGORIAS HÍBRIDAS
UPDATE culturas_guia SET categoria = 'Hortaliça' WHERE categoria = 'Hortaliça/Perene';
UPDATE culturas_guia SET categoria = 'Fruteira' WHERE categoria = 'Fruteira/Florestal';
UPDATE culturas_guia SET categoria = 'Aromática' WHERE categoria = 'Aromática/Medicinal';
UPDATE culturas_guia SET categoria = 'Aromática' WHERE categoria = 'Flor/Aromática';
UPDATE culturas_guia SET categoria = 'Ornamental' WHERE categoria = 'Flor/Ornamental';

-- FASE 4.6: RECATEGORIZAÇÃO
UPDATE culturas_guia SET categoria = 'Hortaliça' WHERE categoria = 'Curcubitácea';

-- FASE 4.7: CORREÇÃO DE NOMES
UPDATE culturas_guia SET nome = 'Brócolo' WHERE nome = 'Bróculos' AND nome_cientifico LIKE 'Brassica oleracea%';
UPDATE culturas_guia SET nome = 'Ruibarbo' WHERE nome = 'Rubabarbo' AND nome_cientifico = 'Rheum rhabarbarum';
UPDATE culturas_guia SET nome = 'Sálvia' WHERE nome = 'Salva' AND nome_cientifico = 'Salvia officinalis';
UPDATE culturas_guia SET nome = 'Courgette' WHERE nome = 'Corgete' AND nome_cientifico LIKE 'Cucurbita pepo%';
UPDATE culturas_guia SET nome = 'Chuchu' WHERE nome = 'Chila' AND nome_cientifico = 'Sechium edule';

-- FASE 4.8: RESOLUÇÃO PLANTA/PRODUTO
UPDATE culturas_guia SET nome = 'Macieira' WHERE nome = 'Maçã' AND nome_cientifico = 'Malus domestica';
UPDATE culturas_guia SET nome = 'Pereira' WHERE nome = 'Pera' AND nome_cientifico = 'Pyrus communis';
UPDATE culturas_guia SET nome = 'Cerejeira' WHERE nome = 'Cereja' AND nome_cientifico = 'Prunus avium';

COMMIT;

\echo '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!'
SELECT COUNT(*) as total_registos, COUNT(DISTINCT categoria) as categorias FROM culturas_guia;
