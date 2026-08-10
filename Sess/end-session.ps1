<#
.SYNOPSIS
    Termina a sessão de desenvolvimento OPF activa.

.DESCRIPTION
    Pergunta (ou recebe por parâmetro) o que ficou feito e qual é o próximo
    passo, e com isso:

      1. Actualiza o .opf/STATE.md — substitui a secção "Próximo passo" e o
         cabeçalho (última sessão, data), sem tocar em mais nada do ficheiro.
      2. Escreve o detalhe da sessão em .opf/sessions/<id>.md.
      3. Acrescenta uma linha ao .opf/JOURNAL.md com a duração calculada.
      4. Gera a árvore do projecto em output/tree-<id>.md — artefacto para
         consulta humana, que a IA não deve carregar.

    O parser do STATE é tolerante: preserva secções desconhecidas e nunca
    reordena o que não foi alterado.

.PARAMETER ProjectRoot
    Raiz do projecto. Por omissão, o directório actual.

.PARAMETER Summary
    Resumo do que ficou feito na sessão. Se omitido, é pedido interactivamente.

.PARAMETER NextStep
    Próximo passo único e imperativo. Se omitido, é pedido interactivamente.

.EXAMPLE
    .\end-session.ps1

.EXAMPLE
    .\end-session.ps1 -Summary 'Parser do STATE implementado' -NextStep 'Escrever testes Pester do parser'

.NOTES
    Compatível com Windows PowerShell 5.1 e PowerShell 7+.
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter()]
    [string]$ProjectRoot = (Get-Location).Path,

    [Parameter()]
    [string]$Summary,

    [Parameter()]
    [string]$NextStep
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-OpfText {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][AllowEmptyString()][string]$Content
    )
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Set-OpfStateSection {
    <#
    .SYNOPSIS
        Substitui o conteúdo de uma secção "## <nome>" num documento STATE,
        preservando tudo o resto byte a byte.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$StateText,
        [Parameter(Mandatory)][string]$SectionName,
        [Parameter(Mandatory)][string]$NewBody
    )
    $pattern = "(?ms)^(## $([regex]::Escape($SectionName))\s*\r?\n)(.*?)(?=^---|^## |\z)"
    if ($StateText -notmatch $pattern) {
        Write-Warning "Secção '## $SectionName' não encontrada no STATE.md — nada alterado nessa secção."
        return $StateText
    }
    $safeBody    = $NewBody.Replace('$', '$$')
    $replacement = "`${1}`n$safeBody`n`n"
    return [regex]::Replace($StateText, $pattern, $replacement)
}

function Get-OpfTree {
    <#
    .SYNOPSIS
        Gera a árvore do projecto em texto, respeitando uma lista de exclusões.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter()][string[]]$Exclude = @('.git', '.opf', 'node_modules', 'logs', 'output', 'temp', 'tmp', '.vs'),
        [Parameter()][string]$Prefix = ''
    )
    $lines = New-Object System.Collections.Generic.List[string]
    $items = @(Get-ChildItem -Path $Path -Force |
        Where-Object { $Exclude -notcontains $_.Name } |
        Sort-Object { -not $_.PSIsContainer }, Name)
    for ($i = 0; $i -lt $items.Count; $i++) {
        $item   = $items[$i]
        $isLast = ($i -eq $items.Count - 1)
        if ($isLast) { $branch = '└── ' } else { $branch = '├── ' }
        if ($item.PSIsContainer) {
            $lines.Add("$Prefix$branch$($item.Name)/")
            if ($isLast) { $childPrefix = "$Prefix    " } else { $childPrefix = "$Prefix│   " }
            $lines.AddRange((Get-OpfTree -Path $item.FullName -Exclude $Exclude -Prefix $childPrefix))
        }
        else {
            $lines.Add("$Prefix$branch$($item.Name)")
        }
    }
    return ,$lines
}

try {
    Push-Location -Path $ProjectRoot

    $opfDir      = Join-Path $ProjectRoot '.opf'
    $sessionsDir = Join-Path $opfDir 'sessions'
    $statePath   = Join-Path $opfDir 'STATE.md'
    $journalPath = Join-Path $opfDir 'JOURNAL.md'
    $activePath  = Join-Path $opfDir '.session-active'
    $outputDir   = Join-Path $ProjectRoot 'output'

    # --- Sessão activa -------------------------------------------------------
    if (-not (Test-Path -Path $activePath)) {
        Write-Warning 'Não há nenhuma sessão activa. Use start-session.ps1 primeiro.'
        return
    }
    $active    = Get-Content -Path $activePath
    $sessionId = (($active | Where-Object { $_ -match '^Id=' }) -replace '^Id=', '').Trim()
    $startIso  = (($active | Where-Object { $_ -match '^Start=' }) -replace '^Start=', '').Trim()
    $startTime = [datetime]::Parse($startIso)
    $endTime   = Get-Date
    $duration  = $endTime - $startTime
    $durationText = '{0:hh\:mm}' -f $duration
    $endStamp  = Get-Date -Format 'yyyyMMddTHHmm'

    # --- Recolher informação -------------------------------------------------
    if (-not $Summary) {
        $Summary = Read-Host 'O que ficou feito nesta sessão?'
    }
    if (-not $NextStep) {
        $NextStep = Read-Host 'Qual é o próximo passo (uma acção, imperativa)?'
    }
    if (-not $Summary)  { $Summary  = '(sem resumo)' }
    if (-not $NextStep) { $NextStep = '(não definido)' }

    # --- 1. Actualizar STATE.md ---------------------------------------------
    $stateText = Get-Content -Path $statePath -Raw
    $stateText = Set-OpfStateSection -StateText $stateText -SectionName 'Próximo passo' -NewBody $NextStep
    $safeSummary = $Summary.Replace('$', '$$')
    $stateText = [regex]::Replace($stateText, '(?m)^- \*\*Última sessão:\*\* .*$', "- **Última sessão:** $sessionId — $safeSummary")
    $stateText = [regex]::Replace($stateText, '(?m)^- \*\*Actualizado:\*\* .*$', "- **Actualizado:** $endStamp")
    if ($PSCmdlet.ShouldProcess($statePath, 'Actualizar STATE.md')) {
        Write-OpfText -Path $statePath -Content $stateText
    }

    # --- 2. Detalhe da sessão ------------------------------------------------
    $sessionPath = Join-Path $sessionsDir "$sessionId.md"
    $sessionDoc = @(
        "# Sessão $sessionId"
        ''
        "- **Início:** $startIso"
        "- **Fim:** $(Get-Date -Format 's')"
        "- **Duração:** $durationText"
        ''
        '## O que ficou feito'
        ''
        $Summary
        ''
        '## Próximo passo definido'
        ''
        $NextStep
    ) -join "`n"
    if ($PSCmdlet.ShouldProcess($sessionPath, 'Escrever detalhe da sessão')) {
        Write-OpfText -Path $sessionPath -Content ($sessionDoc + "`n")
    }

    # --- 3. JOURNAL ----------------------------------------------------------
    $journalLine = "| $sessionId | $startIso | $(Get-Date -Format 's') | $durationText | $($Summary -replace '\|', '\|') |"
    if ($PSCmdlet.ShouldProcess($journalPath, 'Acrescentar linha ao JOURNAL')) {
        Add-Content -Path $journalPath -Value $journalLine
    }

    # --- 4. Árvore do projecto (consulta humana; a IA não deve carregar) -----
    if (-not (Test-Path -Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir | Out-Null
    }
    $treePath  = Join-Path $outputDir "tree-$sessionId.md"
    $treeLines = Get-OpfTree -Path $ProjectRoot
    $treeDoc = @(
        '<!-- Documento gerado para consulta humana. IA: não carregar este ficheiro. -->'
        ''
        "# Árvore do projecto — sessão $sessionId"
        ''
        '```text'
        "$(Split-Path -Path $ProjectRoot -Leaf)/"
        ($treeLines -join "`n")
        '```'
    ) -join "`n"
    if ($PSCmdlet.ShouldProcess($treePath, 'Gerar árvore do projecto')) {
        Write-OpfText -Path $treePath -Content ($treeDoc + "`n")
    }

    # --- Fechar --------------------------------------------------------------
    if ($PSCmdlet.ShouldProcess($activePath, 'Fechar sessão')) {
        Remove-Item -Path $activePath
    }

    Write-Host ''
    Write-Host "Sessão $sessionId fechada. Duração: $durationText." -ForegroundColor Green
    Write-Host "STATE actualizado: $statePath" -ForegroundColor Cyan
    Write-Host "Árvore gerada:     $treePath" -ForegroundColor Cyan
}
finally {
    Pop-Location
}
