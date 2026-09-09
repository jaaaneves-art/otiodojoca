SELECT tablename, rowsecurity
FROM pg_tables WHERE schemaname='public' ORDER BY 1;

SELECT polrelid::regclass AS tabela, polname, polcmd,
       pg_get_expr(polqual, polrelid)      AS usando,
       pg_get_expr(polwithcheck, polrelid) AS com_check
FROM pg_policy ORDER BY 1, 2;