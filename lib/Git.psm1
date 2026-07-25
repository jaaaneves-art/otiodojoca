#Requires -Version 5.1

<#
    .SYNOPSIS
        Módulo Git do Open Project Framework (OPF).

    .DESCRIPTION
        Camada de abstração sobre o executável 'git', desenhada para automação.

        Princípios de desenho:
          - Toda a interacção com o Git passa pela função privada Invoke-GitCommand.
          - Utilizam-se sempre formatos legíveis por máquina (porcelain=v2, --format,
            rev-parse, rev-list --count). Nunca se analisa texto destinado a humanos.
          - As funções Get-* devolvem sempre o mesmo tipo (PSCustomObject, [string]
            ou [PSCustomObject[]]), nunca variando entre escalar e colecção.
          - As funções Test-* devolvem sempre [bool].
          - As funções que alteram estado suportam -WhatIf / -Confirm.
          - Todo o estado do módulo é mantido em âmbito 'script'. Não são criadas
            variáveis globais.

        Segurança:
          Os nomes de remotos e de ramos são validados de forma a nunca começarem por
          '-'. Sem esta validação, um valor como '--upload-pack=<comando>' seria
          interpretado pelo Git como opção e resultaria em execução arbitrária de
          código (o mesmo se aplica a --receive-pack em push/pull). Os padrões de
          caminho são sempre passados depois do separador '--'.

        Requisitos de ambiente:
          - Windows PowerShell 5.1 ou PowerShell 7 e superior.
          - Git 2.16 ou superior. O limite é imposto por:
              * 'status --porcelain=v2'      (Git 2.11)
              * 'rev-parse --absolute-git-dir' (Git 2.13)
              * 'status --ignored=matching'  (Git 2.16)
          - Módulo Utils.psm1 do OPF carregado (para a função Write-Log). Caso não
            esteja disponível, o módulo degrada graciosamente para os canais nativos
            Information / Verbose / Warning / Error. A resolução de Write-Log é
            reavaliada enquanto não for bem-sucedida, pelo que a ordem de importação
            dos módulos é irrelevante.

    .NOTES
        Projecto : Open Project Framework (OPF)
        Ficheiro : lib/Git.psm1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

#region Estado interno do módulo

# Cache do executável 'git' resolvido (evita chamadas repetidas a Get-Command).
$script:GitCommand = $null

# Cache do comando de logging exposto por Utils.psm1. Apenas resultados positivos
# são colocados em cache: caso contrário, importar Utils.psm1 depois de Git.psm1
# desactivaria o logging de forma permanente.
$script:LogCommand = $null

# Separador de unidade (US, 0x1F) usado nos formatos '--format' do Git.
$script:UnitSeparator = [char]0x1F

# Argumentos aplicados a todas as invocações do Git.
$script:GitBaseArguments = @('--no-pager', '-c', 'core.quotepath=false')

# Nome próprio da pilha de localizações, para não interferir com a pilha
# predefinida usada pelo código que consome o módulo.
$script:LocationStackName = 'OpfGit'

# Tempo máximo, em segundos, para cada invocação do Git. O valor 0 significa
# "sem limite" e é o predefinido. Em pipelines de integração contínua deve ser
# definido um valor finito para evitar bloqueios indefinidos em operações de rede.
$script:GitTimeoutSeconds = 0

#endregion Estado interno do módulo

#region Funções privadas — infra-estrutura

function Write-GitLog {
    <#
        .SYNOPSIS
            Escreve uma mensagem de log através do módulo Utils.psm1.

        .DESCRIPTION
            Encaminha a mensagem para a função Write-Log disponibilizada pelo módulo
            Utils.psm1 do OPF. Apenas uma resolução bem-sucedida é colocada em cache,
            de modo que Utils.psm1 possa ser importado depois deste módulo.

            Se Write-Log não estiver disponível (ou falhar), a mensagem é encaminhada
            para os canais nativos do PowerShell, garantindo que o módulo Git nunca
            falha por causa do subsistema de logging.

        .PARAMETER Message
            Texto a registar.

        .PARAMETER Level
            Severidade da mensagem. Valores aceites: Debug, Information, Warning, Error.
            O valor predefinido é 'Information'.

        .EXAMPLE
            Write-GitLog -Message 'A executar git fetch' -Level Information

        .OUTPUTS
            Nenhum.

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([void])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNullOrEmpty()]
        [string] $Message,

        [Parameter()]
        [ValidateSet('Debug', 'Information', 'Warning', 'Error')]
        [string] $Level = 'Information'
    )

    if ($null -eq $script:LogCommand) {
        $script:LogCommand = Get-Command -Name 'Write-Log' -CommandType Function, Cmdlet -ErrorAction SilentlyContinue |
            Select-Object -First 1
    }

    if ($null -ne $script:LogCommand) {
        try {
            $arguments = @{}
            $parameters = $script:LogCommand.Parameters

            if ($parameters.ContainsKey('Message')) { $arguments['Message'] = $Message }
            if ($parameters.ContainsKey('Level')) { $arguments['Level'] = $Level }

            if ($arguments.Count -eq 0) {
                & $script:LogCommand $Message
            }
            else {
                & $script:LogCommand @arguments
            }

            return
        }
        catch {
            # A assinatura de Write-Log não é compatível: usa-se o mecanismo nativo.
            Write-Debug -Message ('Write-Log indisponível ou incompatível: {0}' -f $_.Exception.Message)
        }
    }

    switch ($Level) {
        'Debug' { Write-Debug -Message $Message }
        'Information' { Write-Information -MessageData $Message -Tags 'OPF.Git' }
        'Warning' { Write-Warning -Message $Message }
        'Error' { Write-Error -Message $Message -ErrorAction Continue }
        default { Write-Verbose -Message $Message }
    }
}

function Get-GitErrorRecord {
    <#
        .SYNOPSIS
            Constrói um ErrorRecord normalizado para o módulo Git.

        .DESCRIPTION
            Centraliza a criação de objectos de erro, garantindo mensagens, identificadores
            e categorias consistentes em todo o módulo.

        .PARAMETER Message
            Mensagem descritiva do erro.

        .PARAMETER ErrorId
            Identificador do erro. O valor predefinido é 'OpfGitError'.

        .PARAMETER Category
            Categoria do erro. O valor predefinido é 'NotSpecified'.

        .PARAMETER TargetObject
            Objecto associado ao erro (por exemplo, o caminho do repositório).

        .PARAMETER Exception
            Excepção de origem. Se omitida, é criada uma InvalidOperationException.

        .EXAMPLE
            throw (Get-GitErrorRecord -Message 'Repositório inválido' -ErrorId 'OpfGitNotARepository')

        .OUTPUTS
            System.Management.Automation.ErrorRecord

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([System.Management.Automation.ErrorRecord])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNullOrEmpty()]
        [string] $Message,

        [Parameter()]
        [ValidateNotNullOrEmpty()]
        [string] $ErrorId = 'OpfGitError',

        [Parameter()]
        [System.Management.Automation.ErrorCategory] $Category = [System.Management.Automation.ErrorCategory]::NotSpecified,

        [Parameter()]
        [AllowNull()]
        [object] $TargetObject = $null,

        [Parameter()]
        [AllowNull()]
        [System.Exception] $Exception = $null
    )

    $effectiveException = $Exception
    if ($null -eq $effectiveException) {
        $effectiveException = New-Object -TypeName System.InvalidOperationException -ArgumentList $Message
    }

    return (New-Object -TypeName System.Management.Automation.ErrorRecord -ArgumentList @(
            $effectiveException,
            $ErrorId,
            $Category,
            $TargetObject
        ))
}

function Assert-GitInstalled {
    <#
        .SYNOPSIS
            Garante que o executável 'git' está disponível e devolve-o.

        .DESCRIPTION
            Resolve o executável 'git' através de Get-Command e mantém o resultado em cache
            no âmbito do módulo. Lança um erro terminador se o Git não estiver instalado
            ou não constar da variável PATH.

            Apenas resultados positivos são colocados em cache, pelo que a instalação do
            Git a meio da sessão é detectada na chamada seguinte.

            Esta função nunca invoca o Git, evitando recursividade com Invoke-GitCommand.

        .EXAMPLE
            $git = Assert-GitInstalled

        .OUTPUTS
            System.Management.Automation.CommandInfo

        .NOTES
            Função privada. Não é exportada.
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseApprovedVerbs', '',
        Justification = 'Função privada e não exportada; o verbo Assert é a convenção interna do OPF para validações.')]
    [CmdletBinding()]
    [OutputType([System.Management.Automation.CommandInfo])]
    param()

    if ($null -eq $script:GitCommand) {
        $script:GitCommand = Get-Command -Name 'git' -CommandType Application -ErrorAction SilentlyContinue |
            Select-Object -First 1
    }

    if ($null -eq $script:GitCommand) {
        throw (Get-GitErrorRecord -Message 'O executável "git" não foi encontrado. Instale o Git e confirme que consta da variável PATH.' `
                -ErrorId 'OpfGitNotInstalled' `
                -Category ([System.Management.Automation.ErrorCategory]::ObjectNotFound) `
                -TargetObject 'git')
    }

    return $script:GitCommand
}

function Assert-GitRepository {
    <#
        .SYNOPSIS
            Garante que um caminho pertence a uma árvore de trabalho Git.

        .DESCRIPTION
            Utiliza 'git rev-parse --is-inside-work-tree', cuja saída é estável e legível
            por máquina. Lança um erro terminador quando o caminho não pertence a um
            repositório Git com árvore de trabalho.

        .PARAMETER Path
            Caminho já resolvido a validar.

        .EXAMPLE
            Assert-GitRepository -Path 'C:\Projectos\OPF'

        .OUTPUTS
            System.String. O caminho validado.

        .NOTES
            Função privada. Não é exportada. Um repositório 'bare' não tem árvore de
            trabalho, pelo que é deliberadamente rejeitado por esta validação.
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseApprovedVerbs', '',
        Justification = 'Função privada e não exportada; o verbo Assert é a convenção interna do OPF para validações.')]
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNullOrEmpty()]
        [string] $Path
    )

    $result = Invoke-GitCommand -ArgumentList @('rev-parse', '--is-inside-work-tree') -Path $Path -IgnoreExitCode

    if (-not $result.Success -or ($result.StandardOutput.Trim() -ne 'true')) {
        throw (Get-GitErrorRecord -Message ('O caminho "{0}" não pertence a um repositório Git.' -f $Path) `
                -ErrorId 'OpfGitNotARepository' `
                -Category ([System.Management.Automation.ErrorCategory]::InvalidArgument) `
                -TargetObject $Path)
    }

    return $Path
}

function Get-GitCommandResult {
    <#
        .SYNOPSIS
            Executa um processo e devolve o resultado estruturado.

        .DESCRIPTION
            Executa o executável indicado através de System.Diagnostics.Process, com
            redireccionamento de stdout e stderr e leitura assíncrona (iniciada antes da
            espera pela saída, evitando bloqueios por buffer cheio).

            Em PowerShell 7 (.NET Core) os argumentos são entregues através da colecção
            ProcessStartInfo.ArgumentList, que elimina por completo a citação manual. Em
            Windows PowerShell 5.1, onde essa propriedade não existe, é aplicada a citação
            segundo as regras do CommandLineToArgvW.

            A saída é sempre devolvida como PSCustomObject, independentemente do código
            de saída do processo. A decisão sobre o que constitui um erro cabe a
            Invoke-GitCommand.

        .PARAMETER FilePath
            Caminho completo do executável.

        .PARAMETER ArgumentList
            Argumentos a passar ao executável.

        .PARAMETER WorkingDirectory
            Directório de trabalho do processo.

        .PARAMETER TimeoutSeconds
            Tempo máximo de execução. O valor 0 (predefinido) significa "sem limite".
            Ao ser excedido, o processo é terminado e é lançado um erro.

        .EXAMPLE
            Get-GitCommandResult -FilePath '/usr/bin/git' -ArgumentList @('status') -WorkingDirectory '/repo'

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Git.CommandResult'.

        .NOTES
            Função privada. Não é exportada. É o único ponto do módulo que cria processos,
            servindo por isso como ponto de intercepção natural em testes (Pester: Mock
            Get-GitCommandResult -ModuleName Git).
    #>
    [CmdletBinding()]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string] $FilePath,

        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [string[]] $ArgumentList,

        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string] $WorkingDirectory,

        [Parameter()]
        [ValidateRange(0, 86400)]
        [int] $TimeoutSeconds = 0
    )

    $process = $null
    $standardOutput = ''
    $standardError = ''
    $exitCode = -1
    $timedOut = $false
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

    $startInfo = New-Object -TypeName System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $FilePath
    $startInfo.WorkingDirectory = $WorkingDirectory
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.StandardOutputEncoding = New-Object -TypeName System.Text.UTF8Encoding -ArgumentList $false
    $startInfo.StandardErrorEncoding = New-Object -TypeName System.Text.UTF8Encoding -ArgumentList $false

    # .NET Core (PowerShell 7) expõe ArgumentList; o .NET Framework (5.1) não.
    $supportsArgumentList = $null -ne $startInfo.PSObject.Properties['ArgumentList']

    if ($supportsArgumentList) {
        foreach ($argument in $ArgumentList) {
            $startInfo.ArgumentList.Add([string] $argument)
        }
        $commandLine = ($ArgumentList -join ' ')
    }
    else {
        $quoted = New-Object -TypeName 'System.Collections.Generic.List[string]'

        foreach ($argument in $ArgumentList) {
            $value = [string] $argument

            if ([string]::IsNullOrEmpty($value)) {
                $quoted.Add('""')
            }
            elseif ($value -match '[\s"]') {
                $escaped = $value -replace '(\\*)"', '$1$1\"'
                $escaped = $escaped -replace '(\\+)$', '$1$1'
                $quoted.Add('"' + $escaped + '"')
            }
            else {
                $quoted.Add($value)
            }
        }

        $commandLine = ($quoted -join ' ')
        $startInfo.Arguments = $commandLine
    }

    try {
        $process = New-Object -TypeName System.Diagnostics.Process
        $process.StartInfo = $startInfo

        [void] $process.Start()

        # As leituras assíncronas têm de ser iniciadas antes da espera, para que os
        # canais sejam drenados continuamente e o processo nunca bloqueie a escrever.
        $outputTask = $process.StandardOutput.ReadToEndAsync()
        $errorTask = $process.StandardError.ReadToEndAsync()

        if ($TimeoutSeconds -gt 0) {
            if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
                $timedOut = $true
                try { $process.Kill() } catch { Write-Debug -Message ('Falha ao terminar o processo: {0}' -f $_.Exception.Message) }
            }
        }
        else {
            $process.WaitForExit()
        }

        $standardOutput = $outputTask.GetAwaiter().GetResult()
        $standardError = $errorTask.GetAwaiter().GetResult()

        if (-not $timedOut) {
            $exitCode = $process.ExitCode
        }
    }
    catch {
        throw (Get-GitErrorRecord -Message ('Falha ao executar "{0} {1}": {2}' -f $FilePath, $commandLine, $_.Exception.Message) `
                -ErrorId 'OpfGitProcessFailure' `
                -Category ([System.Management.Automation.ErrorCategory]::NotSpecified) `
                -TargetObject $FilePath `
                -Exception $_.Exception)
    }
    finally {
        $stopwatch.Stop()
        if ($null -ne $process) {
            $process.Dispose()
        }
    }

    if ($timedOut) {
        throw (Get-GitErrorRecord -Message ('O comando "{0} {1}" excedeu o limite de {2} segundos e foi terminado.' -f $FilePath, $commandLine, $TimeoutSeconds) `
                -ErrorId 'OpfGitCommandTimeout' `
                -Category ([System.Management.Automation.ErrorCategory]::OperationTimeout) `
                -TargetObject $commandLine)
    }

    $outputLines = @()
    if (-not [string]::IsNullOrEmpty($standardOutput)) {
        $normalized = ($standardOutput -replace "`r`n", "`n").TrimEnd("`n")
        if ($normalized.Length -gt 0) {
            $outputLines = @($normalized -split "`n")
        }
    }

    return [PSCustomObject]@{
        PSTypeName       = 'OPF.Git.CommandResult'
        FilePath         = $FilePath
        Arguments        = [string[]] $ArgumentList
        CommandLine      = $commandLine
        WorkingDirectory = $WorkingDirectory
        ExitCode         = $exitCode
        Success          = ($exitCode -eq 0)
        StandardOutput   = $standardOutput
        StandardError    = $standardError
        OutputLines      = [string[]] $outputLines
        Duration         = $stopwatch.Elapsed
    }
}

function Invoke-GitCommand {
    <#
        .SYNOPSIS
            Ponto único de invocação do Git.

        .DESCRIPTION
            Todas as operações Git do módulo passam por esta função, que assegura:
              - validação da instalação do Git;
              - resolução e validação do caminho de trabalho;
              - utilização de Push-Location / Pop-Location numa pilha própria;
              - validação opcional de repositório;
              - registo de log;
              - tratamento de erros centralizado.

            Os argumentos base '--no-pager' e '-c core.quotepath=false' são sempre
            aplicados, garantindo saídas não paginadas e caminhos não codificados.

        .PARAMETER ArgumentList
            Argumentos do comando Git (sem o executável).

        .PARAMETER Path
            Caminho onde o comando é executado. Se omitido, é usada a localização actual.

        .PARAMETER RequireRepository
            Valida que o caminho pertence a um repositório Git antes de executar o comando.

        .PARAMETER IgnoreExitCode
            Não lança erro quando o código de saída é diferente de zero. O resultado é
            devolvido com a propriedade Success a $false.

        .PARAMETER TimeoutSeconds
            Tempo máximo de execução. Predefinido a partir de $script:GitTimeoutSeconds.

        .EXAMPLE
            Invoke-GitCommand -ArgumentList @('rev-parse', 'HEAD') -RequireRepository

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Git.CommandResult'.

        .NOTES
            Função privada. Não é exportada.

            O directório de trabalho do processo é definido explicitamente, pelo que
            Push-Location não é estritamente necessário para a correcção. É mantido
            porque o Git também é sensível à localização actual quando invocado por
            hooks, e usa uma pilha própria para não interferir com a do consumidor.
    #>
    [CmdletBinding()]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNullOrEmpty()]
        [string[]] $ArgumentList,

        [Parameter()]
        [string] $Path,

        [Parameter()]
        [switch] $RequireRepository,

        [Parameter()]
        [switch] $IgnoreExitCode,

        [Parameter()]
        [ValidateRange(0, 86400)]
        [int] $TimeoutSeconds = $script:GitTimeoutSeconds
    )

    $locationPushed = $false

    try {
        $git = Assert-GitInstalled

        $requestedPath = $Path
        if ([string]::IsNullOrWhiteSpace($requestedPath)) {
            $requestedPath = (Get-Location).ProviderPath
        }

        if (-not (Test-Path -LiteralPath $requestedPath -PathType Container)) {
            throw (Get-GitErrorRecord -Message ('O directório "{0}" não existe.' -f $requestedPath) `
                    -ErrorId 'OpfGitPathNotFound' `
                    -Category ([System.Management.Automation.ErrorCategory]::ObjectNotFound) `
                    -TargetObject $requestedPath)
        }

        $resolvedPath = (Resolve-Path -LiteralPath $requestedPath).ProviderPath

        Push-Location -LiteralPath $resolvedPath -StackName $script:LocationStackName
        $locationPushed = $true

        if ($RequireRepository.IsPresent) {
            [void] (Assert-GitRepository -Path $resolvedPath)
        }

        $effectiveArguments = @($script:GitBaseArguments) + @($ArgumentList)

        Write-GitLog -Level Debug -Message ('git {0} [directório: {1}]' -f ($ArgumentList -join ' '), $resolvedPath)

        $result = Get-GitCommandResult -FilePath $git.Source `
            -ArgumentList $effectiveArguments `
            -WorkingDirectory $resolvedPath `
            -TimeoutSeconds $TimeoutSeconds

        if (-not $result.Success -and -not $IgnoreExitCode.IsPresent) {
            $detail = $result.StandardError
            if ([string]::IsNullOrWhiteSpace($detail)) { $detail = $result.StandardOutput }
            if ([string]::IsNullOrWhiteSpace($detail)) { $detail = '(sem detalhe adicional)' }

            $message = 'O comando "git {0}" terminou com o código {1}: {2}' -f ($ArgumentList -join ' '), $result.ExitCode, $detail.Trim()

            # Regista-se apenas em Debug: a falha é comunicada ao chamador através do
            # ErrorRecord. Registá-la também como erro duplicaria o relato.
            Write-GitLog -Level Debug -Message $message

            throw (Get-GitErrorRecord -Message $message `
                    -ErrorId 'OpfGitCommandFailed' `
                    -Category ([System.Management.Automation.ErrorCategory]::InvalidResult) `
                    -TargetObject $result)
        }

        return $result
    }
    catch {
        $PSCmdlet.ThrowTerminatingError($_)
    }
    finally {
        if ($locationPushed) {
            Pop-Location -StackName $script:LocationStackName
        }
    }
}

#endregion Funções privadas — infra-estrutura

#region Funções privadas — leitura partilhada

function Get-GitHeadName {
    <#
        .SYNOPSIS
            Devolve o nome do ramo apontado por HEAD.

        .DESCRIPTION
            Utiliza 'git symbolic-ref --quiet --short HEAD'. O código de saída distingue
            de forma inequívoca um ramo de um HEAD destacado, sem qualquer análise de texto.

            Existe para evitar que funções públicas dependam umas das outras apenas para
            obter o nome do ramo, o que multiplicaria desnecessariamente a criação de
            processos.

        .PARAMETER Path
            Caminho dentro do repositório.

        .EXAMPLE
            (Get-GitHeadName -Path $repo).Name

        .OUTPUTS
            PSCustomObject com as propriedades Name e IsDetached.

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNullOrEmpty()]
        [string] $Path
    )

    $result = Invoke-GitCommand -ArgumentList @('symbolic-ref', '--quiet', '--short', 'HEAD') `
        -Path $Path -RequireRepository -IgnoreExitCode

    $isDetached = -not $result.Success
    $name = $null
    if (-not $isDetached) { $name = $result.StandardOutput.Trim() }

    return [PSCustomObject]@{
        Name       = $name
        IsDetached = $isDetached
    }
}

function Get-GitUpstreamName {
    <#
        .SYNOPSIS
            Devolve o ramo de seguimento configurado para HEAD.

        .DESCRIPTION
            Utiliza 'git rev-parse --abbrev-ref --symbolic-full-name @{upstream}'. A
            ausência de ramo de seguimento é detectada pelo código de saída.

            Centraliza lógica anteriormente repetida em Get-GitBranch e Get-GitAheadBehind.

        .PARAMETER Path
            Caminho dentro do repositório.

        .EXAMPLE
            (Get-GitUpstreamName -Path $repo).Upstream

        .OUTPUTS
            PSCustomObject com as propriedades Upstream e HasUpstream.

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNullOrEmpty()]
        [string] $Path
    )

    $result = Invoke-GitCommand -ArgumentList @('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}') `
        -Path $Path -IgnoreExitCode

    $hasUpstream = $result.Success
    $upstream = $null
    if ($hasUpstream) { $upstream = $result.StandardOutput.Trim() }

    return [PSCustomObject]@{
        Upstream    = $upstream
        HasUpstream = $hasUpstream
    }
}

function ConvertFrom-GitStatusEntry {
    <#
        .SYNOPSIS
            Converte um registo de 'git status --porcelain=v2 -z' num objecto.

        .DESCRIPTION
            Trata os quatro tipos de registo do formato porcelain v2: ordinário ('1'),
            renomeado ou copiado ('2'), não fundido ('u') e não seguido ou ignorado
            ('?' e '!').

            Registos malformados produzem $null, cabendo ao chamador ignorá-los. Extrair
            esta lógica da função pública reduz a complexidade ciclomática de Get-GitStatus
            e elimina a utilização de 'continue' dentro de um 'switch', que em PowerShell
            não continua o ciclo exterior (ao contrário do que sucede em C#).

        .PARAMETER Token
            Registo individual, já separado pelo delimitador NUL.

        .EXAMPLE
            ConvertFrom-GitStatusEntry -Token '1 .M N... 100644 100644 100644 abc def ficheiro.txt'

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Git.StatusEntry', ou $null se o registo for
            inválido. A propriedade RequiresOriginalPath indica que o registo seguinte
            contém o caminho de origem de uma renomeação.

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNullOrEmpty()]
        [string] $Token
    )

    $stateCode = $null
    $entryPath = $null
    $entryKind = 'Ordinary'
    $requiresOriginalPath = $false

    switch ($Token.Substring(0, 1)) {
        '1' {
            $fields = $Token -split ' ', 9
            if ($fields.Count -eq 9) {
                $stateCode = $fields[1]
                $entryPath = $fields[8]
            }
        }
        '2' {
            $fields = $Token -split ' ', 10
            if ($fields.Count -eq 10) {
                $stateCode = $fields[1]
                $entryPath = $fields[9]
                $entryKind = 'Renamed'
                $requiresOriginalPath = $true
            }
        }
        'u' {
            $fields = $Token -split ' ', 11
            if ($fields.Count -eq 11) {
                $stateCode = $fields[1]
                $entryPath = $fields[10]
                $entryKind = 'Unmerged'
            }
        }
        '?' {
            if ($Token.Length -gt 2) {
                $stateCode = '??'
                $entryPath = $Token.Substring(2)
                $entryKind = 'Untracked'
            }
        }
        '!' {
            if ($Token.Length -gt 2) {
                $stateCode = '!!'
                $entryPath = $Token.Substring(2)
                $entryKind = 'Ignored'
            }
        }
    }

    if ([string]::IsNullOrEmpty($entryPath) -or [string]::IsNullOrEmpty($stateCode)) {
        Write-Debug -Message ('Registo de estado ignorado por não corresponder ao formato porcelain v2: {0}' -f $Token)
        return $null
    }

    $stagedCode = $stateCode.Substring(0, 1)
    $unstagedCode = '.'
    if ($stateCode.Length -gt 1) { $unstagedCode = $stateCode.Substring(1, 1) }

    $isTracked = ($entryKind -eq 'Ordinary' -or $entryKind -eq 'Renamed')

    return [PSCustomObject]@{
        PSTypeName           = 'OPF.Git.StatusEntry'
        Path                 = $entryPath
        OriginalPath         = $null
        Kind                 = $entryKind
        State                = $stateCode
        StagedCode           = $stagedCode
        UnstagedCode         = $unstagedCode
        IsStaged             = ($isTracked -and $stagedCode -ne '.')
        IsUnstaged           = ($isTracked -and $unstagedCode -ne '.')
        IsUntracked          = ($entryKind -eq 'Untracked')
        IsIgnored            = ($entryKind -eq 'Ignored')
        IsConflicted         = ($entryKind -eq 'Unmerged')
        RequiresOriginalPath = $requiresOriginalPath
    }
}

function Assert-GitReferenceName {
    <#
        .SYNOPSIS
            Valida um nome de referência através do próprio Git.

        .DESCRIPTION
            Utiliza 'git check-ref-format --branch', delegando a validação na
            implementação de referência em vez de replicar as suas regras. Apenas o
            código de saída é interpretado.

            Protege contra nomes que o Git recusaria e contra nomes que escapariam do
            espaço 'refs/heads/' (por exemplo '../../HEAD').

        .PARAMETER Name
            Nome do ramo a validar.

        .PARAMETER Path
            Caminho onde a validação é executada.

        .EXAMPLE
            Assert-GitReferenceName -Name 'main' -Path $repo

        .OUTPUTS
            System.String. O nome validado.

        .NOTES
            Função privada. Não é exportada.
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseApprovedVerbs', '',
        Justification = 'Função privada e não exportada; o verbo Assert é a convenção interna do OPF para validações.')]
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNullOrEmpty()]
        [string] $Name,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateNotNullOrEmpty()]
        [string] $Path
    )

    $result = Invoke-GitCommand -ArgumentList @('check-ref-format', '--branch', $Name) -Path $Path -IgnoreExitCode

    if (-not $result.Success) {
        throw (Get-GitErrorRecord -Message ('"{0}" não é um nome de ramo válido.' -f $Name) `
                -ErrorId 'OpfGitInvalidReferenceName' `
                -Category ([System.Management.Automation.ErrorCategory]::InvalidArgument) `
                -TargetObject $Name)
    }

    return $Name
}

#endregion Funções privadas — leitura partilhada

#region Funções públicas — verificação

function Test-GitInstalled {
    <#
        .SYNOPSIS
            Indica se o Git está instalado e operacional.

        .DESCRIPTION
            Resolve o executável 'git' e executa 'git --version'. Devolve sempre um
            valor booleano, nunca lançando excepções.

        .EXAMPLE
            if (Test-GitInstalled) { 'Git disponível' }

        .OUTPUTS
            System.Boolean
    #>
    [CmdletBinding()]
    [OutputType([bool])]
    param()

    try {
        $result = Invoke-GitCommand -ArgumentList @('--version') -IgnoreExitCode
        return [bool] $result.Success
    }
    catch {
        Write-GitLog -Level Debug -Message ('Git indisponível: {0}' -f $_.Exception.Message)
        return $false
    }
}

function Test-GitRepository {
    <#
        .SYNOPSIS
            Indica se um caminho pertence a uma árvore de trabalho Git.

        .DESCRIPTION
            Utiliza 'git rev-parse --is-inside-work-tree'. Devolve sempre um valor
            booleano, nunca lançando excepções.

        .PARAMETER Path
            Caminho a verificar. Se omitido, é usada a localização actual.

        .EXAMPLE
            Test-GitRepository -Path 'C:\Projectos\OPF'

        .OUTPUTS
            System.Boolean

        .NOTES
            Um repositório 'bare' não tem árvore de trabalho e devolve $false. Para
            determinar se um caminho é a raiz de um repositório, incluindo 'bare',
            utilize Initialize-GitRepository, cuja propriedade AlreadyExisted trata
            ambos os casos.
    #>
    [CmdletBinding()]
    [OutputType([bool])]
    param(
        [Parameter(Position = 0, ValueFromPipeline = $true, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath
    )

    process {
        try {
            $result = Invoke-GitCommand -ArgumentList @('rev-parse', '--is-inside-work-tree') -Path $Path -IgnoreExitCode
            return ($result.Success -and $result.StandardOutput.Trim() -eq 'true')
        }
        catch {
            Write-GitLog -Level Debug -Message ('"{0}" não é um repositório Git: {1}' -f $Path, $_.Exception.Message)
            return $false
        }
    }
}

#endregion Funções públicas — verificação

#region Funções públicas — leitura

function Get-GitRoot {
    <#
        .SYNOPSIS
            Devolve a raiz da árvore de trabalho do repositório.

        .DESCRIPTION
            Utiliza 'git rev-parse --show-toplevel'. O caminho devolvido é normalizado
            para o separador de directório da plataforma actual.

        .PARAMETER Path
            Caminho dentro do repositório. Se omitido, é usada a localização actual.

        .EXAMPLE
            Get-GitRoot

        .OUTPUTS
            System.String. Devolve sempre uma única cadeia de caracteres.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Position = 0, ValueFromPipeline = $true, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath
    )

    process {
        try {
            $result = Invoke-GitCommand -ArgumentList @('rev-parse', '--show-toplevel') -Path $Path -RequireRepository
            $root = $result.StandardOutput.Trim()

            $separator = [System.IO.Path]::DirectorySeparatorChar
            if ($separator -ne [char]'/') {
                $root = $root.Replace([char]'/', $separator)
            }

            return [string] $root
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

function Get-GitBranch {
    <#
        .SYNOPSIS
            Devolve informação sobre o ramo activo.

        .DESCRIPTION
            Combina 'git symbolic-ref' (detecção fiável de HEAD destacado), 'git log -1'
            e a resolução do ramo de seguimento. Nenhuma saída destinada a humanos é
            analisada.

            O identificador abreviado é o produzido pelo próprio Git (%h), que respeita
            'core.abbrev' e alarga automaticamente o número de caracteres em repositórios
            grandes. Truncar o SHA completo num número fixo de caracteres produziria um
            valor divergente do devolvido por Get-GitLastCommitShort.

        .PARAMETER Path
            Caminho dentro do repositório. Se omitido, é usada a localização actual.

        .EXAMPLE
            (Get-GitBranch).Name

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Git.Branch'.
    #>
    [CmdletBinding()]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Position = 0, ValueFromPipeline = $true, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath
    )

    process {
        try {
            $head = Get-GitHeadName -Path $Path

            # O separador é produzido pelo próprio Git (%x1f). A concatenação está
            # entre parênteses: dentro de um array literal, ',"a" + $b' seria analisado
            # como dois elementos, ',"a", (+$b)'.
            $commit = Invoke-GitCommand -ArgumentList @('log', '-1', ('--format=%H%x1f%h')) -Path $Path -IgnoreExitCode

            $hasCommits = $commit.Success
            $sha = $null
            $shortSha = $null

            if ($hasCommits) {
                $fields = $commit.StandardOutput.Trim().Split($script:UnitSeparator)
                if ($fields.Count -ge 2) {
                    $sha = $fields[0]
                    $shortSha = $fields[1]
                }
            }

            $upstream = Get-GitUpstreamName -Path $Path

            return [PSCustomObject]@{
                PSTypeName  = 'OPF.Git.Branch'
                Path        = $Path
                Name        = $head.Name
                IsDetached  = $head.IsDetached
                HasCommits  = $hasCommits
                Sha         = $sha
                ShortSha    = $shortSha
                Upstream    = $upstream.Upstream
                HasUpstream = $upstream.HasUpstream
            }
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

function Get-GitRemote {
    <#
        .SYNOPSIS
            Devolve os repositórios remotos configurados.

        .DESCRIPTION
            Obtém os nomes através de 'git remote' e resolve cada URL com
            'git remote get-url', evitando a análise da saída de 'git remote -v'.

            Devolve sempre uma colecção (eventualmente vazia), nunca um objecto isolado.

        .PARAMETER Path
            Caminho dentro do repositório. Se omitido, é usada a localização actual.

        .PARAMETER Name
            Filtra o resultado por um nome de remoto específico. Um nome inexistente
            produz uma colecção vazia, não um erro.

        .EXAMPLE
            Get-GitRemote | Format-Table Name, FetchUrl

        .OUTPUTS
            PSCustomObject[] com o tipo 'OPF.Git.Remote'.

        .NOTES
            São necessárias duas invocações do Git por remoto. A alternativa
            ('git config --get-regexp') reduziria a contagem de processos, mas não
            aplicaria as reescritas de 'url.<base>.insteadOf', devolvendo URL diferentes
            dos efectivamente usados pelo Git. A correcção prevalece sobre a contagem
            de processos.
    #>
    [CmdletBinding()]
    [OutputType([PSCustomObject[]])]
    param(
        [Parameter(Position = 0, ValueFromPipeline = $true, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath,

        [Parameter()]
        [string] $Name
    )

    process {
        try {
            $namesResult = Invoke-GitCommand -ArgumentList @('remote') -Path $Path -RequireRepository
            $remotes = New-Object -TypeName 'System.Collections.Generic.List[PSObject]'

            foreach ($line in $namesResult.OutputLines) {
                $remoteName = $line.Trim()
                if ([string]::IsNullOrWhiteSpace($remoteName)) { continue }
                if (-not [string]::IsNullOrWhiteSpace($Name) -and $remoteName -ne $Name) { continue }

                $fetchResult = Invoke-GitCommand -ArgumentList @('remote', 'get-url', $remoteName) -Path $Path -IgnoreExitCode
                $pushResult = Invoke-GitCommand -ArgumentList @('remote', 'get-url', '--push', $remoteName) -Path $Path -IgnoreExitCode

                $fetchUrl = $null
                if ($fetchResult.Success) { $fetchUrl = $fetchResult.StandardOutput.Trim() }

                $pushUrl = $null
                if ($pushResult.Success) { $pushUrl = $pushResult.StandardOutput.Trim() }

                $remotes.Add([PSCustomObject]@{
                        PSTypeName = 'OPF.Git.Remote'
                        Path       = $Path
                        Name       = $remoteName
                        FetchUrl   = $fetchUrl
                        PushUrl    = $pushUrl
                    })
            }

            # -NoEnumerate garante que uma colecção com zero ou um elemento continua
            # a ser devolvida como colecção.
            Write-Output -NoEnumerate -InputObject ([PSCustomObject[]] $remotes.ToArray())
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

function Get-GitStatus {
    <#
        .SYNOPSIS
            Devolve o estado do repositório de forma estruturada.

        .DESCRIPTION
            Utiliza 'git status --porcelain=v2 --branch -z', o formato estável destinado
            a consumo por máquina. O delimitador NUL garante o tratamento correcto de
            caminhos com espaços, acentos ou mudanças de linha.

            A conversão de cada registo é delegada em ConvertFrom-GitStatusEntry e os
            contadores são calculados numa única passagem sobre os resultados.

        .PARAMETER Path
            Caminho dentro do repositório. Se omitido, é usada a localização actual.

        .PARAMETER IncludeIgnored
            Inclui também os ficheiros ignorados.

        .EXAMPLE
            $status = Get-GitStatus
            if (-not $status.IsClean) { $status.Entries }

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Git.Status'. A propriedade Entries é sempre
            uma colecção de 'OPF.Git.StatusEntry'.
    #>
    [CmdletBinding()]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Position = 0, ValueFromPipeline = $true, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath,

        [Parameter()]
        [switch] $IncludeIgnored
    )

    process {
        try {
            $arguments = @('status', '--porcelain=v2', '--branch', '--untracked-files=normal')
            if ($IncludeIgnored.IsPresent) { $arguments += '--ignored=matching' }
            $arguments += '-z'

            $result = Invoke-GitCommand -ArgumentList $arguments -Path $Path -RequireRepository

            $tokens = @()
            if (-not [string]::IsNullOrEmpty($result.StandardOutput)) {
                $tokens = @($result.StandardOutput -split "`0" | Where-Object { $_.Length -gt 0 })
            }

            $entries = New-Object -TypeName 'System.Collections.Generic.List[PSObject]'
            $branchName = $null
            $branchOid = $null
            $upstream = $null
            $hasUpstream = $false
            $isDetached = $false
            $ahead = 0
            $behind = 0
            $stagedCount = 0
            $unstagedCount = 0
            $untrackedCount = 0
            $conflictCount = 0

            for ($index = 0; $index -lt $tokens.Count; $index++) {
                $token = $tokens[$index]

                if ($token.StartsWith('#')) {
                    $headerParts = $token.Substring(1).Trim() -split '\s+', 2
                    $value = ''
                    if ($headerParts.Count -gt 1) { $value = $headerParts[1] }

                    switch ($headerParts[0]) {
                        'branch.oid' { if ($value -ne '(initial)') { $branchOid = $value } }
                        'branch.head' { if ($value -eq '(detached)') { $isDetached = $true } else { $branchName = $value } }
                        'branch.upstream' { $upstream = $value; $hasUpstream = $true }
                        'branch.ab' {
                            foreach ($part in ($value -split '\s+')) {
                                if ($part.StartsWith('+')) { $ahead = [int] $part.Substring(1) }
                                elseif ($part.StartsWith('-')) { $behind = [int] $part.Substring(1) }
                            }
                        }
                        default { }
                    }

                    continue
                }

                $entry = ConvertFrom-GitStatusEntry -Token $token
                if ($null -eq $entry) { continue }

                # Numa renomeação, o caminho de origem é o registo NUL seguinte.
                if ($entry.RequiresOriginalPath -and ($index + 1) -lt $tokens.Count) {
                    $index++
                    $entry.OriginalPath = $tokens[$index]
                }

                if ($entry.IsStaged) { $stagedCount++ }
                if ($entry.IsUnstaged) { $unstagedCount++ }
                if ($entry.IsUntracked) { $untrackedCount++ }
                if ($entry.IsConflicted) { $conflictCount++ }

                $entries.Add($entry)
            }

            return [PSCustomObject]@{
                PSTypeName     = 'OPF.Git.Status'
                Path           = $Path
                Branch         = $branchName
                IsDetached     = $isDetached
                CommitId       = $branchOid
                Upstream       = $upstream
                HasUpstream    = $hasUpstream
                Ahead          = $ahead
                Behind         = $behind
                StagedCount    = $stagedCount
                UnstagedCount  = $unstagedCount
                UntrackedCount = $untrackedCount
                ConflictCount  = $conflictCount
                IsClean        = (($stagedCount + $unstagedCount + $untrackedCount + $conflictCount) -eq 0)
                Entries        = [PSCustomObject[]] $entries.ToArray()
            }
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

function Get-GitLastCommit {
    <#
        .SYNOPSIS
            Devolve informação estruturada sobre o último commit.

        .DESCRIPTION
            Utiliza 'git log -1' com um formato delimitado pelo carácter de controlo
            US (0x1F), o que elimina qualquer ambiguidade na separação dos campos.

            As datas são convertidas com TryParse, evitando o recurso a excepções como
            mecanismo de controlo de fluxo.

        .PARAMETER Path
            Caminho dentro do repositório. Se omitido, é usada a localização actual.

        .EXAMPLE
            (Get-GitLastCommit).Subject

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Git.Commit'. Devolve $null se o repositório
            ainda não tiver commits.
    #>
    [CmdletBinding()]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Position = 0, ValueFromPipeline = $true, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath
    )

    process {
        try {
            $format = '%H%x1f%h%x1f%an%x1f%ae%x1f%aI%x1f%cn%x1f%ce%x1f%cI%x1f%s%x1f%b'
            $result = Invoke-GitCommand -ArgumentList @('log', '-1', '--no-color', ('--format=' + $format)) `
                -Path $Path -RequireRepository -IgnoreExitCode

            if (-not $result.Success) {
                Write-GitLog -Level Warning -Message ('O repositório "{0}" não tem commits.' -f $Path)
                return $null
            }

            $fields = $result.StandardOutput.Split($script:UnitSeparator)
            if ($fields.Count -lt 9) {
                throw (Get-GitErrorRecord -Message 'A saída de "git log" não tem o formato esperado.' `
                        -ErrorId 'OpfGitUnexpectedOutput' `
                        -Category ([System.Management.Automation.ErrorCategory]::InvalidData) `
                        -TargetObject $result)
            }

            $body = ''
            if ($fields.Count -gt 9) {
                $body = ($fields[9..($fields.Count - 1)] -join [string] $script:UnitSeparator).TrimEnd("`r", "`n")
            }

            $authorDate = [datetimeoffset]::MinValue
            if (-not [datetimeoffset]::TryParse($fields[4], [cultureinfo]::InvariantCulture,
                    [System.Globalization.DateTimeStyles]::None, [ref] $authorDate)) {
                $authorDate = $null
            }

            $committerDate = [datetimeoffset]::MinValue
            if (-not [datetimeoffset]::TryParse($fields[7], [cultureinfo]::InvariantCulture,
                    [System.Globalization.DateTimeStyles]::None, [ref] $committerDate)) {
                $committerDate = $null
            }

            return [PSCustomObject]@{
                PSTypeName     = 'OPF.Git.Commit'
                Path           = $Path
                Sha            = $fields[0]
                ShortSha       = $fields[1]
                AuthorName     = $fields[2]
                AuthorEmail    = $fields[3]
                AuthorDate     = $authorDate
                CommitterName  = $fields[5]
                CommitterEmail = $fields[6]
                CommitterDate  = $committerDate
                Subject        = $fields[8]
                Body           = $body
            }
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

function Get-GitLastCommitShort {
    <#
        .SYNOPSIS
            Devolve o identificador abreviado do último commit.

        .DESCRIPTION
            Utiliza 'git rev-parse --short HEAD', deixando ao Git a decisão sobre o número
            mínimo de caracteres necessário para garantir a unicidade.

        .PARAMETER Path
            Caminho dentro do repositório. Se omitido, é usada a localização actual.

        .EXAMPLE
            Get-GitLastCommitShort

        .OUTPUTS
            System.String. Devolve $null se o repositório ainda não tiver commits.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Position = 0, ValueFromPipeline = $true, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath
    )

    process {
        try {
            $result = Invoke-GitCommand -ArgumentList @('rev-parse', '--short', 'HEAD') `
                -Path $Path -RequireRepository -IgnoreExitCode

            if (-not $result.Success) {
                Write-GitLog -Level Warning -Message ('O repositório "{0}" não tem commits.' -f $Path)
                return $null
            }

            return [string] $result.StandardOutput.Trim()
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

function Get-GitLastCommitMessage {
    <#
        .SYNOPSIS
            Devolve a mensagem completa do último commit.

        .DESCRIPTION
            Utiliza 'git log -1 --format=%B', que devolve o assunto e o corpo tal como
            foram registados, sem qualquer reformatação.

        .PARAMETER Path
            Caminho dentro do repositório. Se omitido, é usada a localização actual.

        .PARAMETER SubjectOnly
            Devolve apenas a primeira linha (assunto) da mensagem.

        .EXAMPLE
            Get-GitLastCommitMessage -SubjectOnly

        .OUTPUTS
            System.String. Devolve $null se o repositório ainda não tiver commits.

        .NOTES
            Esta função não é implementada em termos de Get-GitLastCommit por uma razão
            de correcção: '%B' preserva a mensagem exactamente como foi registada,
            enquanto a recomposição a partir de '%s' e '%b' perde a estrutura original
            de linhas em branco.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Position = 0, ValueFromPipeline = $true, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath,

        [Parameter()]
        [switch] $SubjectOnly
    )

    process {
        try {
            $format = '%B'
            if ($SubjectOnly.IsPresent) { $format = '%s' }

            $result = Invoke-GitCommand -ArgumentList @('log', '-1', '--no-color', ('--format=' + $format)) `
                -Path $Path -RequireRepository -IgnoreExitCode

            if (-not $result.Success) {
                Write-GitLog -Level Warning -Message ('O repositório "{0}" não tem commits.' -f $Path)
                return $null
            }

            return [string] $result.StandardOutput.TrimEnd("`r", "`n")
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

function Get-GitAheadBehind {
    <#
        .SYNOPSIS
            Devolve o número de commits à frente e atrás do ramo de seguimento.

        .DESCRIPTION
            Resolve o ramo de seguimento e calcula a divergência com
            'git rev-list --left-right --count HEAD...@{upstream}', cuja saída é
            puramente numérica.

        .PARAMETER Path
            Caminho dentro do repositório. Se omitido, é usada a localização actual.

        .EXAMPLE
            $divergencia = Get-GitAheadBehind
            '{0} à frente, {1} atrás' -f $divergencia.Ahead, $divergencia.Behind

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Git.AheadBehind'.
    #>
    [CmdletBinding()]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Position = 0, ValueFromPipeline = $true, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath
    )

    process {
        try {
            [void] (Assert-GitRepository -Path (Resolve-Path -LiteralPath $Path).ProviderPath)

            $upstreamInfo = Get-GitUpstreamName -Path $Path
            $ahead = 0
            $behind = 0

            if ($upstreamInfo.HasUpstream) {
                $countResult = Invoke-GitCommand -ArgumentList @('rev-list', '--left-right', '--count', 'HEAD...@{upstream}') `
                    -Path $Path -IgnoreExitCode

                if ($countResult.Success) {
                    $parts = @($countResult.StandardOutput.Trim() -split '\s+' | Where-Object { $_.Length -gt 0 })
                    if ($parts.Count -ge 2) {
                        $ahead = [int] $parts[0]
                        $behind = [int] $parts[1]
                    }
                }
            }
            else {
                Write-GitLog -Level Debug -Message ('O ramo activo em "{0}" não tem ramo de seguimento.' -f $Path)
            }

            return [PSCustomObject]@{
                PSTypeName  = 'OPF.Git.AheadBehind'
                Path        = $Path
                Upstream    = $upstreamInfo.Upstream
                HasUpstream = $upstreamInfo.HasUpstream
                Ahead       = $ahead
                Behind      = $behind
                IsUpToDate  = ($upstreamInfo.HasUpstream -and $ahead -eq 0 -and $behind -eq 0)
            }
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

#endregion Funções públicas — leitura

#region Funções públicas — operações

function Invoke-GitFetch {
    <#
        .SYNOPSIS
            Obtém referências e objectos de um repositório remoto.

        .DESCRIPTION
            Executa 'git fetch' com as opções indicadas. Suporta -WhatIf e -Confirm.

        .PARAMETER Path
            Caminho dentro do repositório. Se omitido, é usada a localização actual.

        .PARAMETER Remote
            Nome do remoto. O valor predefinido é 'origin'. Não pode começar por '-',
            uma vez que o Git interpretaria o valor como opção (por exemplo
            '--upload-pack=<comando>', que executaria código arbitrário).

        .PARAMETER All
            Obtém de todos os remotos, ignorando o parâmetro Remote.

        .PARAMETER Prune
            Remove as referências de seguimento que já não existem no remoto.

        .PARAMETER Tags
            Obtém também todas as etiquetas.

        .EXAMPLE
            Invoke-GitFetch -All -Prune

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Git.CommandResult'. Devolve $null quando a
            operação é suprimida por -WhatIf.
    #>
    [CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Low')]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Position = 0, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath,

        [Parameter()]
        [ValidateNotNullOrEmpty()]
        [ValidatePattern('^[^-]')]
        [string] $Remote = 'origin',

        [Parameter()]
        [switch] $All,

        [Parameter()]
        [switch] $Prune,

        [Parameter()]
        [switch] $Tags
    )

    process {
        try {
            $arguments = @('fetch')
            if ($Prune.IsPresent) { $arguments += '--prune' }
            if ($Tags.IsPresent) { $arguments += '--tags' }
            if ($All.IsPresent) { $arguments += '--all' } else { $arguments += $Remote }

            if (-not $PSCmdlet.ShouldProcess($Path, ('git {0}' -f ($arguments -join ' ')))) {
                return $null
            }

            Write-GitLog -Level Information -Message ('A obter alterações do remoto em "{0}".' -f $Path)
            return Invoke-GitCommand -ArgumentList $arguments -Path $Path -RequireRepository
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

function Invoke-GitAdd {
    <#
        .SYNOPSIS
            Prepara ficheiros para o próximo commit.

        .DESCRIPTION
            Executa 'git add'. Os padrões de caminho são sempre passados após o separador
            '--', evitando que sejam interpretados como opções. Suporta -WhatIf e -Confirm.

        .PARAMETER Path
            Caminho dentro do repositório. Se omitido, é usada a localização actual.

        .PARAMETER PathSpec
            Padrões de caminho a preparar. Se omitido e nenhum dos parâmetros -All ou
            -Update for utilizado, é usado o padrão '.'.

        .PARAMETER All
            Prepara adições, modificações e remoções em toda a árvore de trabalho.

        .PARAMETER Update
            Prepara apenas modificações e remoções de ficheiros já seguidos.

        .EXAMPLE
            Invoke-GitAdd -All

        .EXAMPLE
            Invoke-GitAdd -PathSpec 'src', 'docs/README.md'

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Git.CommandResult'. Devolve $null quando a
            operação é suprimida por -WhatIf.
    #>
    [CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Low')]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Position = 0, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath,

        [Parameter(Position = 1)]
        [AllowEmptyCollection()]
        [string[]] $PathSpec = @(),

        [Parameter()]
        [switch] $All,

        [Parameter()]
        [switch] $Update
    )

    process {
        try {
            $arguments = @('add')
            if ($All.IsPresent) { $arguments += '--all' }
            if ($Update.IsPresent) { $arguments += '--update' }

            $specs = @($PathSpec | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
            if ($specs.Count -eq 0 -and -not ($All.IsPresent -or $Update.IsPresent)) {
                $specs = @('.')
            }

            if ($specs.Count -gt 0) {
                $arguments += '--'
                $arguments += $specs
            }

            if (-not $PSCmdlet.ShouldProcess($Path, ('git {0}' -f ($arguments -join ' ')))) {
                return $null
            }

            Write-GitLog -Level Information -Message ('A preparar alterações em "{0}".' -f $Path)
            return Invoke-GitCommand -ArgumentList $arguments -Path $Path -RequireRepository
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

function Invoke-GitCommit {
    <#
        .SYNOPSIS
            Cria um commit com as alterações preparadas.

        .DESCRIPTION
            Executa 'git commit'. Salvo indicação em contrário, valida previamente a
            existência de alterações preparadas através de 'git diff --cached --quiet',
            cujo código de saída é determinístico — evitando qualquer análise de texto.

            A confirmação -WhatIf / -Confirm é avaliada antes de qualquer invocação do
            Git: em modo -WhatIf nenhum processo é criado e nenhum erro de pré-condição
            é lançado.

        .PARAMETER Path
            Caminho dentro do repositório. Se omitido, é usada a localização actual.

        .PARAMETER Message
            Mensagem do commit. É entregue ao Git como argumento autónomo, pelo que
            qualquer conteúdo é seguro.

        .PARAMETER All
            Prepara automaticamente as modificações e remoções de ficheiros já seguidos.

        .PARAMETER Amend
            Substitui o commit anterior em vez de criar um novo.

        .PARAMETER AllowEmpty
            Permite criar um commit sem alterações.

        .PARAMETER NoVerify
            Ignora os hooks pre-commit e commit-msg.

        .EXAMPLE
            Invoke-GitCommit -Message 'feat: adiciona módulo Git'

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Git.CommandResult'. Devolve $null quando a
            operação é suprimida por -WhatIf.
    #>
    [CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Position = 0, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateNotNullOrEmpty()]
        [string] $Message,

        [Parameter()]
        [switch] $All,

        [Parameter()]
        [switch] $Amend,

        [Parameter()]
        [switch] $AllowEmpty,

        [Parameter()]
        [switch] $NoVerify
    )

    process {
        try {
            if (-not $PSCmdlet.ShouldProcess($Path, ('git commit --message "{0}"' -f $Message))) {
                return $null
            }

            if (-not ($AllowEmpty.IsPresent -or $Amend.IsPresent -or $All.IsPresent)) {
                $staged = Invoke-GitCommand -ArgumentList @('diff', '--cached', '--quiet') `
                    -Path $Path -RequireRepository -IgnoreExitCode

                if ($staged.ExitCode -eq 0) {
                    throw (Get-GitErrorRecord -Message ('Não existem alterações preparadas para commit em "{0}".' -f $Path) `
                            -ErrorId 'OpfGitNothingToCommit' `
                            -Category ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                            -TargetObject $Path)
                }
            }

            $arguments = @('commit', '--message', $Message)
            if ($All.IsPresent) { $arguments += '--all' }
            if ($Amend.IsPresent) { $arguments += '--amend' }
            if ($AllowEmpty.IsPresent) { $arguments += '--allow-empty' }
            if ($NoVerify.IsPresent) { $arguments += '--no-verify' }

            Write-GitLog -Level Information -Message ('A criar commit em "{0}".' -f $Path)
            return Invoke-GitCommand -ArgumentList $arguments -Path $Path -RequireRepository
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

function Invoke-GitPull {
    <#
        .SYNOPSIS
            Integra as alterações do repositório remoto.

        .DESCRIPTION
            Executa 'git pull' com as opções indicadas. Suporta -WhatIf e -Confirm.

        .PARAMETER Path
            Caminho dentro do repositório. Se omitido, é usada a localização actual.

        .PARAMETER Remote
            Nome do remoto. Se omitido, é usada a configuração do ramo activo. Não pode
            começar por '-' (ver a secção de segurança do módulo).

        .PARAMETER Branch
            Ramo remoto a integrar. Requer que Remote seja indicado. Não pode começar
            por '-'.

        .PARAMETER Rebase
            Aplica rebase em vez de merge.

        .PARAMETER FastForwardOnly
            Só integra se for possível avançar sem criar um commit de merge.

        .PARAMETER Prune
            Remove as referências de seguimento obsoletas.

        .EXAMPLE
            Invoke-GitPull -Rebase

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Git.CommandResult'. Devolve $null quando a
            operação é suprimida por -WhatIf.
    #>
    [CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Position = 0, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath,

        [Parameter()]
        [ValidatePattern('^([^-].*)?$')]
        [string] $Remote,

        [Parameter()]
        [ValidatePattern('^([^-].*)?$')]
        [string] $Branch,

        [Parameter()]
        [switch] $Rebase,

        [Parameter()]
        [switch] $FastForwardOnly,

        [Parameter()]
        [switch] $Prune
    )

    process {
        try {
            if (-not [string]::IsNullOrWhiteSpace($Branch) -and [string]::IsNullOrWhiteSpace($Remote)) {
                throw (Get-GitErrorRecord -Message 'O parâmetro Branch exige que o parâmetro Remote seja indicado.' `
                        -ErrorId 'OpfGitInvalidParameterCombination' `
                        -Category ([System.Management.Automation.ErrorCategory]::InvalidArgument) `
                        -TargetObject $Branch)
            }

            $arguments = @('pull')
            if ($Rebase.IsPresent) { $arguments += '--rebase' }
            if ($FastForwardOnly.IsPresent) { $arguments += '--ff-only' }
            if ($Prune.IsPresent) { $arguments += '--prune' }
            if (-not [string]::IsNullOrWhiteSpace($Remote)) { $arguments += $Remote }
            if (-not [string]::IsNullOrWhiteSpace($Branch)) { $arguments += $Branch }

            if (-not $PSCmdlet.ShouldProcess($Path, ('git {0}' -f ($arguments -join ' ')))) {
                return $null
            }

            Write-GitLog -Level Information -Message ('A integrar alterações remotas em "{0}".' -f $Path)
            return Invoke-GitCommand -ArgumentList $arguments -Path $Path -RequireRepository
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

function Invoke-GitPush {
    <#
        .SYNOPSIS
            Publica commits locais num repositório remoto.

        .DESCRIPTION
            Executa 'git push'. Quando o ramo não é indicado, é resolvido directamente
            por 'git symbolic-ref'; a operação é recusada se HEAD estiver destacado.

            O parâmetro -Force utiliza '--force-with-lease', que recusa a substituição de
            trabalho remoto que não tenha sido previamente obtido.

            Suporta -WhatIf e -Confirm.

        .PARAMETER Path
            Caminho dentro do repositório. Se omitido, é usada a localização actual.

        .PARAMETER Remote
            Nome do remoto. O valor predefinido é 'origin'. Não pode começar por '-',
            uma vez que o Git interpretaria o valor como opção (por exemplo
            '--receive-pack=<comando>', que executaria código arbitrário no destino).

        .PARAMETER Branch
            Ramo a publicar. Se omitido, é usado o ramo activo. Não pode começar por '-'.

        .PARAMETER SetUpstream
            Define o ramo remoto como ramo de seguimento.

        .PARAMETER Force
            Publica com '--force-with-lease'.

        .PARAMETER Tags
            Publica também as etiquetas.

        .EXAMPLE
            Invoke-GitPush -SetUpstream

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Git.CommandResult'. Devolve $null quando a
            operação é suprimida por -WhatIf.
    #>
    [CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Position = 0, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath,

        [Parameter()]
        [ValidateNotNullOrEmpty()]
        [ValidatePattern('^[^-]')]
        [string] $Remote = 'origin',

        [Parameter()]
        [ValidatePattern('^([^-].*)?$')]
        [string] $Branch,

        [Parameter()]
        [switch] $SetUpstream,

        [Parameter()]
        [switch] $Force,

        [Parameter()]
        [switch] $Tags
    )

    process {
        try {
            $targetBranch = $Branch

            if ([string]::IsNullOrWhiteSpace($targetBranch)) {
                $head = Get-GitHeadName -Path $Path

                if ($head.IsDetached) {
                    throw (Get-GitErrorRecord -Message ('HEAD está destacado em "{0}". Indique explicitamente o ramo a publicar.' -f $Path) `
                            -ErrorId 'OpfGitDetachedHead' `
                            -Category ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                            -TargetObject $Path)
                }

                $targetBranch = $head.Name
            }

            $arguments = @('push')
            if ($SetUpstream.IsPresent) { $arguments += '--set-upstream' }
            if ($Force.IsPresent) { $arguments += '--force-with-lease' }
            if ($Tags.IsPresent) { $arguments += '--tags' }
            $arguments += $Remote
            $arguments += $targetBranch

            if (-not $PSCmdlet.ShouldProcess($Path, ('git {0}' -f ($arguments -join ' ')))) {
                return $null
            }

            Write-GitLog -Level Information -Message ('A publicar o ramo "{0}" em "{1}".' -f $targetBranch, $Remote)
            return Invoke-GitCommand -ArgumentList $arguments -Path $Path -RequireRepository
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

function Initialize-GitRepository {
    <#
        .SYNOPSIS
            Inicializa um repositório Git.

        .DESCRIPTION
            Cria o directório de destino, caso não exista, e executa 'git init'.

            A detecção de um repositório pré-existente usa 'git rev-parse
            --absolute-git-dir', comparando o resultado com o caminho indicado. Este
            método, ao contrário de 'rev-parse --is-inside-work-tree', reconhece
            repositórios 'bare' e não confunde um subdirectório de um repositório
            existente com a raiz desse repositório — permitindo criar repositórios
            aninhados quando é isso que se pretende.

            O nome do ramo inicial é validado por 'git check-ref-format' e definido com
            'git symbolic-ref HEAD', em vez de '--initial-branch', garantindo
            compatibilidade com versões do Git anteriores à 2.28.

            Toda a operação é coberta por uma única confirmação -WhatIf / -Confirm, pelo
            que uma recusa nunca deixa um directório criado sem repositório.

        .PARAMETER Path
            Caminho do repositório a inicializar. Se omitido, é usada a localização actual.

        .PARAMETER InitialBranch
            Nome do ramo inicial (por exemplo, 'main').

        .PARAMETER Bare
            Cria um repositório sem árvore de trabalho.

        .EXAMPLE
            Initialize-GitRepository -Path 'C:\Projectos\Novo' -InitialBranch 'main'

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Git.Repository'. Devolve $null quando a
            operação é suprimida por -WhatIf.
    #>
    [CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Position = 0, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath,

        [Parameter()]
        [ValidateNotNullOrEmpty()]
        [string] $InitialBranch,

        [Parameter()]
        [switch] $Bare
    )

    process {
        try {
            $directoryExists = Test-Path -LiteralPath $Path -PathType Container
            $alreadyExisted = $false
            $resolvedPath = $Path

            if ($directoryExists) {
                $resolvedPath = (Resolve-Path -LiteralPath $Path).ProviderPath
                $gitDirResult = Invoke-GitCommand -ArgumentList @('rev-parse', '--absolute-git-dir') `
                    -Path $resolvedPath -IgnoreExitCode

                if ($gitDirResult.Success) {
                    $separator = [System.IO.Path]::DirectorySeparatorChar
                    $gitDir = $gitDirResult.StandardOutput.Trim().Replace([char]'/', $separator).TrimEnd($separator)
                    $expectedWorkTree = (Join-Path $resolvedPath '.git').TrimEnd($separator)
                    $expectedBare = $resolvedPath.TrimEnd($separator)

                    # A comparação é insensível a maiúsculas, adequada a Windows e inócua
                    # nas restantes plataformas: ambos os caminhos derivam da mesma resolução.
                    $alreadyExisted = ($gitDir -eq $expectedWorkTree) -or ($gitDir -eq $expectedBare)
                }
            }

            if ($alreadyExisted) {
                Write-GitLog -Level Warning -Message ('"{0}" já é um repositório Git. A inicialização foi ignorada.' -f $resolvedPath)
            }
            else {
                $arguments = @('init')
                if ($Bare.IsPresent) { $arguments += '--bare' }

                # Uma única confirmação cobre a criação do directório e a inicialização,
                # evitando prompts repetidos e estado parcial em caso de recusa.
                if (-not $PSCmdlet.ShouldProcess($Path, ('git {0}' -f ($arguments -join ' ')))) {
                    return $null
                }

                if (-not $directoryExists) {
                    [void] (New-Item -Path $Path -ItemType Directory -Force)
                    $resolvedPath = (Resolve-Path -LiteralPath $Path).ProviderPath
                    Write-GitLog -Level Information -Message ('Directório criado: "{0}".' -f $resolvedPath)
                }

                if (-not [string]::IsNullOrWhiteSpace($InitialBranch)) {
                    [void] (Assert-GitReferenceName -Name $InitialBranch -Path $resolvedPath)
                }

                [void] (Invoke-GitCommand -ArgumentList $arguments -Path $resolvedPath)
                Write-GitLog -Level Information -Message ('Repositório Git inicializado em "{0}".' -f $resolvedPath)

                if (-not [string]::IsNullOrWhiteSpace($InitialBranch)) {
                    $reference = 'refs/heads/{0}' -f $InitialBranch
                    [void] (Invoke-GitCommand -ArgumentList @('symbolic-ref', 'HEAD', $reference) -Path $resolvedPath)
                    Write-GitLog -Level Information -Message ('Ramo inicial definido como "{0}".' -f $InitialBranch)
                }
            }

            # Um repositório 'bare' não tem árvore de trabalho, pelo que Get-GitHeadName
            # (que a exige) não é aplicável.
            $branchName = $null
            if (-not $Bare.IsPresent) {
                $branchName = (Get-GitHeadName -Path $resolvedPath).Name
            }

            return [PSCustomObject]@{
                PSTypeName       = 'OPF.Git.Repository'
                Path             = $resolvedPath
                Branch           = $branchName
                IsBare           = $Bare.IsPresent
                AlreadyExisted   = $alreadyExisted
                DirectoryCreated = (-not $directoryExists -and -not $alreadyExisted)
            }
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

#endregion Funções públicas — operações

#region Exportação

Export-ModuleMember -Function @(
    # Verificação
    'Test-GitInstalled'
    'Test-GitRepository'

    # Leitura
    'Get-GitRoot'
    'Get-GitBranch'
    'Get-GitRemote'
    'Get-GitStatus'
    'Get-GitLastCommit'
    'Get-GitLastCommitShort'
    'Get-GitLastCommitMessage'
    'Get-GitAheadBehind'

    # Operações
    'Invoke-GitFetch'
    'Invoke-GitAdd'
    'Invoke-GitCommit'
    'Invoke-GitPull'
    'Invoke-GitPush'
    'Initialize-GitRepository'
)

#endregion Exportação
