[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$Root = (Resolve-Path "$PSScriptRoot\..\..").Path
)

$Extensions = @(
    '.ps1','.psm1','.psd1',
    '.ts','.tsx','.js','.jsx',
    '.json',
    '.md',
    '.yml','.yaml'
)

$Exclude = @(
    '.git',
    '.next',
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.vercel',
    '.turbo',
    'bin',
    'obj'
)

$Replace = @{
    'Fórum'      = 'Fórum'
    'Tópico'     = 'Tópico'
    'Tópicos'    = 'Tópicos'
    'Calendário' = 'Calendário'
    'Descrição'  = 'Descrição'
    'Título'     = 'Título'
    'Região'     = 'Região'
    'Não'        = 'Não'
    'Informação' = 'Informação'
    'Publicação' = 'Publicação'
    'Tradições'  = 'Tradições'
    'Agrícola'   = 'Agrícola'
    'Anúncio'    = 'Anúncio'
}

$Files = Get-ChildItem $Root -File -Recurse | Where-Object {

    $path = $_.FullName

    if ($Extensions -notcontains $_.Extension.ToLower()) {
        return $false
    }

    foreach ($dir in $Exclude) {
        if ($path -like "*\$dir\*") {
            return $false
        }
    }

    return $true
}

$Changed = 0
$Replaced = 0
$Errors = 0

foreach ($File in $Files) {

    try {

        $Content = Get-Content -LiteralPath $File.FullName -Raw -Encoding UTF8 -ErrorAction Stop

        if ([string]::IsNullOrEmpty($Content)) {
            continue
        }

        $Original = $Content
        $Count = 0

        foreach ($Pair in $Replace.GetEnumerator()) {

            $Regex = "\b$([regex]::Escape($Pair.Key))\b"

            $Hits = [regex]::Matches($Content,$Regex).Count

            if ($Hits -gt 0) {
                $Content = [regex]::Replace($Content,$Regex,$Pair.Value)
                $Count += $Hits
            }
        }

        if ($Content -ne $Original) {

            if ($PSCmdlet.ShouldProcess($File.FullName,"Atualizar texto")) {

                Set-Content `
                    -LiteralPath $File.FullName `
                    -Value $Content `
                    -Encoding UTF8 `
                    -NoNewline
            }

            $Changed++
            $Replaced += $Count

            Write-Host "✔ $($File.FullName) ($Count)"
        }

    }
    catch {

        $Errors++
        Write-Warning $File.FullName
        Write-Warning $_.Exception.Message
    }
}

Write-Host ""
Write-Host "========== RESUMO =========="
Write-Host "Ficheiros analisados : $($Files.Count)"
Write-Host "Ficheiros alterados  : $Changed"
Write-Host "Substituições        : $Replaced"
Write-Host "Erros                : $Errors"