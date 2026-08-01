function Get-SchemaMetadata {
    param(
        [Parameter(Mandatory)]
        [string]$SchemaFile
    )

    if (!(Test-Path $SchemaFile)) {
        throw "Schema não encontrado: $SchemaFile"
    }

    $sql = Get-Content $SchemaFile -Raw

    [PSCustomObject]@{

        Tables = [regex]::Matches(
            $sql,
            '(?im)CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?("?[\w]+"?)'
        ) | ForEach-Object {
            $_.Groups[1].Value.Trim('"')
        } | Sort-Object -Unique

        Functions = [regex]::Matches(
            $sql,
            '(?im)CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?("?[\w]+"?)'
        ) | ForEach-Object {
            $_.Groups[1].Value.Trim('"')
        } | Sort-Object -Unique

        Triggers = [regex]::Matches(
            $sql,
            '(?im)CREATE\s+TRIGGER\s+("?[\w]+"?)'
        ) | ForEach-Object {
            $_.Groups[1].Value.Trim('"')
        } | Sort-Object -Unique

        Extensions = [regex]::Matches(
            $sql,
            '(?im)CREATE\s+EXTENSION(?:\s+IF\s+NOT\s+EXISTS)?\s+("?[\w-]+"?)'
        ) | ForEach-Object {
            $_.Groups[1].Value.Trim('"')
        } | Sort-Object -Unique
    }
}

Export-ModuleMember -Function Get-SchemaMetadata