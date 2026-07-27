<#
.SYNOPSIS
    Inicia uma sessão de desenvolvimento OPF.

.DESCRIPTION
    Cria a estrutura .opf/ se não existir, semeia o STATE.md a partir do
    template na primeira execução, regista o início da sessão com um
    identificador ISO 8601 (AAAAMMDDTHHMM) e apresenta o STATE.md no ecrã.

    Se já existir uma sessão activa, avisa e termina, a menos que seja
    usado -Force, caso em que a sessão anterior é marcada como abandonada
    no JOURNAL antes de iniciar a nova.

.PARAMETER ProjectRoot
    Raiz do projecto. Por omissão, o directório actual.

.PARAMETER Force
    Marca uma sessão activa esquecida como abandonada e inicia uma nova.

.EXAMPLE
    .\start-session.ps1

.EXAMPLE
    .\start-session.ps1 -ProjectRoot C:\Projectos\MeuProjecto -Force

.NOTES
    Compatível com Windows PowerShell 5.1 e PowerShell 7+.
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter()]
    [string]$ProjectRoot = (Get-Location).Path,

    [Parameter()]
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-OpfTimeStamp {
    [CmdletBinding()]
    param()
    return (Get-Date -Format 'yyyyMMddTHHmm')
}

function Write-OpfText {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][AllowEmptyString()][string]$Content
    )
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

try {
    Push-Location -Path $ProjectRoot

    $opfDir      = Join-Path $ProjectRoot '.opf'
    $sessionsDir = Join-Path $opfDir 'sessions'
    $statePath   = Join-Path $opfDir 'STATE.md'
    $journalPath = Join-Path $opfDir 'JOURNAL.md'
    $activePath  = Join-Path $opfDir '.session-active'

    # --- Estrutura -----------------------------------------------------------
    foreach ($dir in @($opfDir, $sessionsDir)) {
        if (-not (Test-Path -Path $dir)) {
            if ($PSCmdlet.ShouldProcess($dir, 'Criar directório')) {
                New-Item -ItemType Directory -Path $dir | Out-Null
            }
        }
    }

    # --- Sessão activa esquecida --------------------------------------------
    if (Test-Path -Path $activePath) {
        $previous = Get-Content -Path $activePath -Raw
        if (-not $Force) {
            Write-Warning 'Já existe uma sessão activa:'
            Write-Warning $previous.Trim()
            Write-Warning 'Feche-a com end-session.ps1 ou use -Force para a marcar como abandonada.'
            return
        }
        $previousId = ($previous -split "`n" |
            Where-Object { $_ -match '^Id=' }) -replace '^Id=', ''
        $abandonLine = "| $($previousId.Trim()) | ? | ? | abandonada | (sessão não fechada) |"
        if ($PSCmdlet.ShouldProcess($journalPath, 'Registar sessão abandonada')) {
            Add-Content -Path $journalPath -Value $abandonLine
            Remove-Item -Path $activePath
        }
    }

    # --- STATE.md inicial ----------------------------------------------------
    if (-not (Test-Path -Path $statePath)) {
        $templatePath = Join-Path $PSScriptRoot '..\templates\STATE-TEMPLATE.md'
        if (-not (Test-Path -Path $templatePath)) {
            throw "Template não encontrado: $templatePath"
        }
        $projectName = Split-Path -Path $ProjectRoot -Leaf
        $state = (Get-Content -Path $templatePath -Raw).
            Replace('{{PROJECT_NAME}}', $projectName).
            Replace('{{TIMESTAMP}}', (Get-OpfTimeStamp))
        if ($PSCmdlet.ShouldProcess($statePath, 'Criar STATE.md inicial')) {
            Write-OpfText -Path $statePath -Content $state
            Write-Host 'STATE.md criado a partir do template. Preencha a secção Objectivo.' -ForegroundColor Yellow
        }
    }

    # --- JOURNAL.md inicial --------------------------------------------------
    if (-not (Test-Path -Path $journalPath)) {
        $journalHeader = @(
            '# JOURNAL'
            ''
            '<!-- Uma linha por sessão. Ficheiro append-only: nunca editar linhas existentes. -->'
            ''
            '| Sessão | Início | Fim | Duração | Resumo |'
            '|---|---|---|---|---|'
        ) -join "`n"
        if ($PSCmdlet.ShouldProcess($journalPath, 'Criar JOURNAL.md')) {
            Write-OpfText -Path $journalPath -Content ($journalHeader + "`n")
        }
    }

    # --- Registar sessão -----------------------------------------------------
    $sessionId = Get-OpfTimeStamp
    $startIso  = Get-Date -Format 's'
    $activeContent = "Id=$sessionId`nStart=$startIso`n"
    if ($PSCmdlet.ShouldProcess($activePath, "Iniciar sessão $sessionId")) {
        Write-OpfText -Path $activePath -Content $activeContent
    }

    # --- Apresentar o STATE --------------------------------------------------
    Write-Host ''
    Write-Host "Sessão $sessionId iniciada." -ForegroundColor Green
    Write-Host '--- STATE.md -----------------------------------------------------' -ForegroundColor Cyan
    Get-Content -Path $statePath | Write-Host
    Write-Host '------------------------------------------------------------------' -ForegroundColor Cyan
    Write-Host 'Instrução para a IA: ler .opf/STATE.md antes de qualquer alteração.' -ForegroundColor Yellow
}
finally {
    Pop-Location
}
