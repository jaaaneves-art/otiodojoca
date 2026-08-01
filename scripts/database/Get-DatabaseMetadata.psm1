function Get-DatabaseMetadata {
    param(
        [string]$ConnectionString
    )

    $queries = @{
        Extensions = @"
SELECT extname
FROM pg_extension
ORDER BY extname;
"@

        Tables = @"
SELECT table_name
FROM information_schema.tables
WHERE table_schema='public'
ORDER BY table_name;
"@

        Columns = @"
SELECT table_name,column_name,data_type,is_nullable
FROM information_schema.columns
WHERE table_schema='public'
ORDER BY table_name,ordinal_position;
"@

        Functions = @"
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema='public'
ORDER BY routine_name;
"@

        Triggers = @"
SELECT trigger_name,event_object_table
FROM information_schema.triggers
WHERE trigger_schema='public'
ORDER BY event_object_table,trigger_name;
"@

        Policies = @"
SELECT tablename,policyname
FROM pg_policies
WHERE schemaname='public'
ORDER BY tablename,policyname;
"@

        Indexes = @"
SELECT tablename,indexname
FROM pg_indexes
WHERE schemaname='public'
ORDER BY tablename,indexname;
"@
    }

    return $queries
}

Export-ModuleMember -Function Get-DatabaseMetadata