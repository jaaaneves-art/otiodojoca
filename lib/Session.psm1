#Requires -Version 5.1

<#
    .SYNOPSIS
        Módulo de gestão de sessões de trabalho do Open Project Framework (OPF).

    .DESCRIPTION
        Gere sessões de trabalho numeradas sequencialmente: início, fim, duração,
        objectivos, notas, resumo e contexto Git associado.

        Modelo de dados
        ---------------
        Cada sessão tem duas representações:

          - JSON (fonte de verdade), em '<raiz>/.opf/sessions/data/NNNN.json'.
            É o único formato lido pelo módulo.
          - Markdown (artefacto derivado), em '<raiz>/.opf/sessions/NNNN-titulo.md'.
            É gerado a partir do JSON e destina-se a leitura humana e a versionamento.

        A separação é deliberada: o módulo nunca analisa o Markdown para recuperar
        dados, o que elimina toda uma classe de erros de interpretação e permite
        alterar livremente o formato do documento sem quebrar a compatibilidade.

        Princípios de desenho
        ---------------------
          - Nenhuma variável global. Todo o estado em âmbito 'script' ou em disco.
          - O ponteiro da sessão activa é persistido em disco, pelo que uma sessão
            iniciada num processo pode ser terminada noutro.
          - A numeração é atribuída por criação exclusiva do ficheiro (FileMode
            CreateNew), sendo por isso segura perante concorrência.
          - Todas as escritas são atómicas (ficheiro temporário seguido de
            substituição), evitando registos truncados por interrupção.
          - As funções Get-* devolvem sempre o mesmo tipo; as Test-* devolvem [bool];
            as que alteram estado suportam -WhatIf e -Confirm.
          - As datas são persistidas em ISO 8601 com deslocamento ('o'), sendo por
            isso independentes da cultura e do fuso horário do processo.

        Dependências
        ------------
          - Utils.psm1 (OPF): função Write-Log. Opcional; sem ela o módulo degrada
            para os canais nativos do PowerShell.
          - Git.psm1 (OPF): funções Get-GitRoot, Get-GitBranch e Get-GitStatus.
            Opcional; sem elas a raiz é o caminho indicado e o contexto Git fica vazio.

          Ambas as dependências são resolvidas por nome em tempo de execução e apenas
          resultados positivos entram em cache, pelo que a ordem de importação dos
          módulos é irrelevante.

        Testabilidade
        -------------
          Os pontos de intercepção recomendados em Pester são as funções privadas
          Save-SessionFile (única a escrever em disco), Get-SessionStoreContext
          (resolve todos os caminhos) e Get-SessionGitContext (única a contactar o
          módulo Git). Mockando estas três, todo o restante código é exercitável sem
          sistema de ficheiros nem repositório:

              InModuleScope Session { Mock Save-SessionFile { } }

    .NOTES
        Projecto : Open Project Framework (OPF)
        Ficheiro : lib/Session.psm1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

#region Estado interno do módulo

# Comandos externos resolvidos em tempo de execução. Apenas resoluções
# bem-sucedidas são colocadas em cache, para que Utils.psm1 e Git.psm1 possam ser
# importados depois deste módulo.
$script:LogCommand = $null
$script:GitRootCommand = $null
$script:GitBranchCommand = $null
$script:GitStatusCommand = $null

# Estrutura do armazenamento, relativa à raiz do projecto.
$script:StoreRelativePath = '.opf/sessions'
$script:DataFolderName = 'data'
$script:ActiveStateFileName = 'active.json'
$script:ReportFileName = 'RELATORIO.md'

# Versão do esquema persistido. Incrementar sempre que a forma do JSON mudar de
# modo incompatível, para que leitores futuros possam migrar registos antigos.
$script:SchemaVersion = 1

# Profundidade de serialização JSON. O registo tem, no máximo, quatro níveis
# (registo > Notes > nota > propriedade); a margem evita truncagens silenciosas.
$script:JsonDepth = 8

# UTF-8 sem BOM, para que os documentos gerados sejam idênticos em Windows
# PowerShell 5.1 e em PowerShell 7.
$script:Utf8NoBom = New-Object -TypeName System.Text.UTF8Encoding -ArgumentList $false

# Categorias admitidas numa nota de sessão.
$script:NoteCategories = @('Info', 'Decision', 'Issue', 'Next')

# Estados finais admitidos numa sessão.
$script:Outcomes = @('Completed', 'Aborted', 'Paused')

#endregion Estado interno do módulo

#region Funções privadas — infra-estrutura

function Write-SessionLog {
    <#
        .SYNOPSIS
            Escreve uma mensagem de log através do módulo Utils.psm1.

        .DESCRIPTION
            Encaminha a mensagem para a função Write-Log do OPF. Apenas uma resolução
            bem-sucedida é colocada em cache, de modo que Utils.psm1 possa ser importado
            depois deste módulo.

            Se Write-Log não estiver disponível (ou a sua assinatura for incompatível),
            a mensagem segue para os canais nativos do PowerShell. O subsistema de
            logging nunca é motivo de falha das operações de sessão.

        .PARAMETER Message
            Texto a registar.

        .PARAMETER Level
            Severidade. Valores aceites: Debug, Information, Warning, Error.

        .EXAMPLE
            Write-SessionLog -Message 'Sessão 0007 iniciada' -Level Information

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

            if ($arguments.Count -eq 0) { & $script:LogCommand $Message } else { & $script:LogCommand @arguments }
            return
        }
        catch {
            Write-Debug -Message ('Write-Log indisponível ou incompatível: {0}' -f $_.Exception.Message)
        }
    }

    switch ($Level) {
        'Debug' { Write-Debug -Message $Message }
        'Information' { Write-Information -MessageData $Message -Tags 'OPF.Session' }
        'Warning' { Write-Warning -Message $Message }
        'Error' { Write-Error -Message $Message -ErrorAction Continue }
        default { Write-Verbose -Message $Message }
    }
}

function Get-SessionErrorRecord {
    <#
        .SYNOPSIS
            Constrói um ErrorRecord normalizado para o módulo Session.

        .DESCRIPTION
            Centraliza a criação de objectos de erro, garantindo mensagens,
            identificadores e categorias consistentes em todo o módulo. Todas as
            funções públicas relançam através de $PSCmdlet.ThrowTerminatingError,
            pelo que o identificador aqui atribuído é o que o consumidor observa em
            $_.FullyQualifiedErrorId.

        .PARAMETER Message
            Mensagem descritiva do erro.

        .PARAMETER ErrorId
            Identificador do erro. O valor predefinido é 'OpfSessionError'.

        .PARAMETER Category
            Categoria do erro.

        .PARAMETER TargetObject
            Objecto associado ao erro.

        .PARAMETER Exception
            Excepção de origem. Se omitida, é criada uma InvalidOperationException.

        .EXAMPLE
            throw (Get-SessionErrorRecord -Message 'Não há sessão activa' -ErrorId 'OpfSessionNotActive')

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
        [string] $ErrorId = 'OpfSessionError',

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

function Get-SessionField {
    <#
        .SYNOPSIS
            Lê uma propriedade de um objecto desserializado, com valor predefinido.

        .DESCRIPTION
            Sob 'Set-StrictMode -Version Latest', aceder a uma propriedade inexistente
            de um objecto produzido por ConvertFrom-Json lança um erro. Esta função
            verifica primeiro a existência da propriedade, permitindo ler registos
            gravados por versões anteriores do esquema sem os migrar.

        .PARAMETER InputObject
            Objecto a inspeccionar. Pode ser $null.

        .PARAMETER Name
            Nome da propriedade.

        .PARAMETER Default
            Valor devolvido quando a propriedade não existe ou é nula.

        .EXAMPLE
            Get-SessionField -InputObject $record -Name 'Summary' -Default ''

        .OUTPUTS
            System.Object

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([object])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [AllowNull()]
        [object] $InputObject,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateNotNullOrEmpty()]
        [string] $Name,

        [Parameter(Position = 2)]
        [AllowNull()]
        [object] $Default = $null
    )

    if ($null -eq $InputObject) { return $Default }
    if ($null -eq $InputObject.PSObject.Properties[$Name]) { return $Default }

    $value = $InputObject.$Name
    if ($null -eq $value) { return $Default }

    return $value
}

function Save-SessionFile {
    <#
        .SYNOPSIS
            Escreve um ficheiro de texto de forma atómica e determinística.

        .DESCRIPTION
            Escreve primeiro num ficheiro temporário no mesmo directório e só depois o
            move sobre o destino. Uma interrupção a meio da escrita deixa intacto o
            ficheiro anterior, em vez de o truncar.

            A codificação é sempre UTF-8 sem BOM, através de [System.IO.File], porque
            os valores predefinidos de Set-Content e Out-File diferem entre Windows
            PowerShell 5.1 e PowerShell 7.

        .PARAMETER Path
            Caminho completo do ficheiro de destino.

        .PARAMETER Content
            Conteúdo a escrever.

        .EXAMPLE
            Save-SessionFile -Path $json -Content ($record | ConvertTo-Json -Depth 8)

        .OUTPUTS
            System.String. O caminho escrito.

        .NOTES
            Função privada. Não é exportada. É o único ponto de escrita em disco do
            módulo e, por isso, o ponto de intercepção natural em testes.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNullOrEmpty()]
        [string] $Path,

        [Parameter(Mandatory = $true, Position = 1)]
        [AllowEmptyString()]
        [string] $Content
    )

    $directory = Split-Path -Path $Path -Parent
    if (-not [string]::IsNullOrWhiteSpace($directory) -and -not (Test-Path -LiteralPath $directory -PathType Container)) {
        [void] (New-Item -Path $directory -ItemType Directory -Force)
    }

    $temporary = '{0}.{1}.tmp' -f $Path, ([guid]::NewGuid().ToString('N').Substring(0, 8))

    try {
        [System.IO.File]::WriteAllText($temporary, $Content, $script:Utf8NoBom)
        Move-Item -LiteralPath $temporary -Destination $Path -Force
        return $Path
    }
    catch {
        throw (Get-SessionErrorRecord -Message ('Falha ao escrever "{0}": {1}' -f $Path, $_.Exception.Message) `
                -ErrorId 'OpfSessionWriteFailure' `
                -Category ([System.Management.Automation.ErrorCategory]::WriteError) `
                -TargetObject $Path `
                -Exception $_.Exception)
    }
    finally {
        if (Test-Path -LiteralPath $temporary -PathType Leaf) {
            Remove-Item -LiteralPath $temporary -Force -ErrorAction SilentlyContinue
        }
    }
}

function ConvertTo-SessionSlug {
    <#
        .SYNOPSIS
            Converte um título num identificador seguro para nome de ficheiro.

        .DESCRIPTION
            Remove os sinais diacríticos por decomposição Unicode (FormD), converte
            para minúsculas invariantes, substitui por hífen tudo o que não seja
            alfanumérico e trunca o resultado.

            A cultura invariante é usada deliberadamente: ToLower() dependente da
            cultura produz resultados diferentes em turco, o que geraria nomes de
            ficheiro distintos para o mesmo título consoante a máquina.

        .PARAMETER Title
            Título a converter.

        .PARAMETER MaximumLength
            Comprimento máximo do resultado. O valor predefinido é 60.

        .EXAMPLE
            ConvertTo-SessionSlug -Title 'Revisão da API de autenticação'
            # revisao-da-api-de-autenticacao

        .OUTPUTS
            System.String. Devolve 'sessao' se o título não produzir caracteres úteis.

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [AllowEmptyString()]
        [string] $Title,

        [Parameter()]
        [ValidateRange(8, 200)]
        [int] $MaximumLength = 60
    )

    $normalized = $Title.Normalize([System.Text.NormalizationForm]::FormD)
    $builder = New-Object -TypeName System.Text.StringBuilder

    foreach ($character in $normalized.ToCharArray()) {
        if ([System.Globalization.CharUnicodeInfo]::GetUnicodeCategory($character) -ne
            [System.Globalization.UnicodeCategory]::NonSpacingMark) {
            [void] $builder.Append($character)
        }
    }

    $slug = $builder.ToString().ToLowerInvariant()
    $slug = $slug -replace '[^a-z0-9]+', '-'
    $slug = $slug.Trim('-')

    if ($slug.Length -gt $MaximumLength) {
        $slug = $slug.Substring(0, $MaximumLength).Trim('-')
    }

    if ([string]::IsNullOrWhiteSpace($slug)) { return 'sessao' }

    return $slug
}

function ConvertTo-SessionTimestamp {
    <#
        .SYNOPSIS
            Serializa um instante em ISO 8601 com deslocamento.

        .DESCRIPTION
            Utiliza o especificador 'o' (round-trip) com a cultura invariante, o que
            garante que o valor é lido de volta sem perda em qualquer cultura ou fuso.

        .PARAMETER Value
            Instante a serializar.

        .EXAMPLE
            ConvertTo-SessionTimestamp -Value ([datetimeoffset]::Now)

        .OUTPUTS
            System.String

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [datetimeoffset] $Value
    )

    return $Value.ToString('o', [cultureinfo]::InvariantCulture)
}

function ConvertFrom-SessionTimestamp {
    <#
        .SYNOPSIS
            Desserializa um instante em ISO 8601.

        .DESCRIPTION
            Utiliza TryParse com RoundtripKind, evitando o recurso a excepções como
            mecanismo de controlo de fluxo. Um valor ausente ou inválido produz $null,
            permitindo que registos corrompidos sejam listados em vez de fazerem falhar
            toda a leitura.

        .PARAMETER Value
            Texto a converter. Pode ser nulo ou vazio.

        .EXAMPLE
            ConvertFrom-SessionTimestamp -Value '2026-07-23T10:00:00.0000000+01:00'

        .OUTPUTS
            System.DateTimeOffset ou $null.

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([datetimeoffset])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [AllowNull()]
        [AllowEmptyString()]
        [string] $Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) { return $null }

    $parsed = [datetimeoffset]::MinValue
    if ([datetimeoffset]::TryParse($Value, [cultureinfo]::InvariantCulture,
            [System.Globalization.DateTimeStyles]::RoundtripKind, [ref] $parsed)) {
        return $parsed
    }

    Write-SessionLog -Level Warning -Message ('Data inválida no registo de sessão: "{0}".' -f $Value)
    return $null
}

#endregion Funções privadas — infra-estrutura

#region Funções privadas — armazenamento

function Resolve-SessionRoot {
    <#
        .SYNOPSIS
            Determina a raiz do projecto a que as sessões pertencem.

        .DESCRIPTION
            Se o módulo Git.psm1 estiver carregado e o caminho pertencer a um
            repositório, a raiz é a do repositório. Assim, o armazenamento de sessões é
            o mesmo independentemente do subdirectório onde o comando é invocado.

            Sem Git disponível, ou fora de um repositório, a raiz é o próprio caminho
            resolvido.

        .PARAMETER Path
            Caminho de partida.

        .EXAMPLE
            Resolve-SessionRoot -Path (Get-Location).ProviderPath

        .OUTPUTS
            System.String

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNullOrEmpty()]
        [string] $Path
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
        throw (Get-SessionErrorRecord -Message ('O directório "{0}" não existe.' -f $Path) `
                -ErrorId 'OpfSessionPathNotFound' `
                -Category ([System.Management.Automation.ErrorCategory]::ObjectNotFound) `
                -TargetObject $Path)
    }

    $resolved = (Resolve-Path -LiteralPath $Path).ProviderPath

    if ($null -eq $script:GitRootCommand) {
        $script:GitRootCommand = Get-Command -Name 'Get-GitRoot' -CommandType Function -ErrorAction SilentlyContinue |
            Select-Object -First 1
    }

    if ($null -ne $script:GitRootCommand) {
        try {
            $gitRoot = & $script:GitRootCommand -Path $resolved
            if (-not [string]::IsNullOrWhiteSpace($gitRoot)) { return [string] $gitRoot }
        }
        catch {
            Write-SessionLog -Level Debug -Message ('"{0}" não pertence a um repositório Git; usa-se o caminho directo.' -f $resolved)
        }
    }

    return $resolved
}

function Get-SessionStoreContext {
    <#
        .SYNOPSIS
            Resolve todos os caminhos do armazenamento de sessões.

        .DESCRIPTION
            Concentra num único ponto o conhecimento sobre a disposição em disco. Todas
            as restantes funções obtêm daqui os seus caminhos, pelo que uma alteração à
            estrutura de directórios se faz num só lugar.

        .PARAMETER Path
            Caminho de partida, a partir do qual a raiz é resolvida.

        .EXAMPLE
            (Get-SessionStoreContext -Path '.').DataPath

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Session.Store'.

        .NOTES
            Função privada. Não é exportada. Ponto de intercepção recomendado em testes.
    #>
    [CmdletBinding()]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNullOrEmpty()]
        [string] $Path
    )

    $root = Resolve-SessionRoot -Path $Path
    $store = Join-Path -Path $root -ChildPath ($script:StoreRelativePath -replace '/', [System.IO.Path]::DirectorySeparatorChar)
    $data = Join-Path -Path $store -ChildPath $script:DataFolderName

    return [PSCustomObject]@{
        PSTypeName = 'OPF.Session.Store'
        RootPath   = $root
        StorePath  = $store
        DataPath   = $data
        ActivePath = (Join-Path -Path $store -ChildPath $script:ActiveStateFileName)
        ReportPath = (Join-Path -Path $store -ChildPath $script:ReportFileName)
        Exists     = (Test-Path -LiteralPath $data -PathType Container)
    }
}

function Assert-SessionStore {
    <#
        .SYNOPSIS
            Garante que o armazenamento de sessões existe.

        .DESCRIPTION
            Lança um erro terminador quando o armazenamento ainda não foi inicializado,
            orientando o consumidor para Initialize-SessionStore em vez de o deixar com
            um erro genérico de caminho inexistente.

        .PARAMETER Context
            Contexto devolvido por Get-SessionStoreContext.

        .EXAMPLE
            Assert-SessionStore -Context $context

        .OUTPUTS
            PSCustomObject. O contexto validado.

        .NOTES
            Função privada. Não é exportada.
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseApprovedVerbs', '',
        Justification = 'Função privada e não exportada; o verbo Assert é a convenção interna do OPF para validações.')]
    [CmdletBinding()]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNull()]
        [PSCustomObject] $Context
    )

    if (-not $Context.Exists) {
        throw (Get-SessionErrorRecord -Message ('Não existe armazenamento de sessões em "{0}". Execute Initialize-SessionStore.' -f $Context.StorePath) `
                -ErrorId 'OpfSessionStoreNotFound' `
                -Category ([System.Management.Automation.ErrorCategory]::ObjectNotFound) `
                -TargetObject $Context.StorePath)
    }

    return $Context
}

function Get-SessionRecordPath {
    <#
        .SYNOPSIS
            Devolve o caminho do ficheiro JSON de uma sessão.

        .PARAMETER Context
            Contexto devolvido por Get-SessionStoreContext.

        .PARAMETER Number
            Número da sessão.

        .DESCRIPTION
            O nome é formatado com quatro dígitos, garantindo que a ordenação
            alfabética dos ficheiros coincide com a ordenação numérica.

        .EXAMPLE
            Get-SessionRecordPath -Context $context -Number 7

        .OUTPUTS
            System.String

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNull()]
        [PSCustomObject] $Context,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateRange(1, 9999)]
        [int] $Number
    )

    return (Join-Path -Path $Context.DataPath -ChildPath ('{0:D4}.json' -f $Number))
}

function Register-SessionNumber {
    <#
        .SYNOPSIS
            Reserva o próximo número de sessão disponível.

        .DESCRIPTION
            Percorre os números a partir do maior já existente e reserva o primeiro
            livre criando o ficheiro correspondente em modo exclusivo (FileMode
            CreateNew). Se dois processos tentarem reservar em simultâneo, apenas um
            consegue criar o ficheiro; o outro avança para o número seguinte.

            Esta abordagem dispensa ficheiros de bloqueio, que ficariam órfãos se o
            processo terminasse abruptamente.

        .PARAMETER Context
            Contexto devolvido por Get-SessionStoreContext.

        .EXAMPLE
            $numero = Register-SessionNumber -Context $context

        .OUTPUTS
            System.Int32. O número reservado, com o ficheiro já criado e vazio.

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([int])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNull()]
        [PSCustomObject] $Context
    )

    $existing = @(Get-ChildItem -LiteralPath $Context.DataPath -Filter '*.json' -File -ErrorAction SilentlyContinue)
    $candidate = 1

    foreach ($file in $existing) {
        $parsed = 0
        if ([int]::TryParse([System.IO.Path]::GetFileNameWithoutExtension($file.Name), [ref] $parsed) -and $parsed -ge $candidate) {
            $candidate = $parsed + 1
        }
    }

    while ($candidate -le 9999) {
        $path = Get-SessionRecordPath -Context $Context -Number $candidate
        $stream = $null

        try {
            $stream = [System.IO.File]::Open($path, [System.IO.FileMode]::CreateNew,
                [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
            return $candidate
        }
        catch [System.IO.IOException] {
            # Número tomado por outro processo entre a listagem e a criação.
            $candidate++
        }
        finally {
            if ($null -ne $stream) { $stream.Dispose() }
        }
    }

    throw (Get-SessionErrorRecord -Message 'Foi atingido o limite de 9999 sessões neste projecto.' `
            -ErrorId 'OpfSessionNumberExhausted' `
            -Category ([System.Management.Automation.ErrorCategory]::LimitsExceeded) `
            -TargetObject $Context.DataPath)
}

function Get-ActiveSessionNumber {
    <#
        .SYNOPSIS
            Devolve o número da sessão activa, se existir.

        .DESCRIPTION
            Lê o ponteiro persistido em disco. Como o ponteiro não vive em memória, uma
            sessão iniciada numa consola pode ser terminada noutra, ou por uma tarefa
            agendada.

            Um ponteiro que aponte para um registo inexistente ou já terminado é
            considerado obsoleto e ignorado, evitando que um estado corrompido bloqueie
            o arranque de novas sessões.

        .PARAMETER Context
            Contexto devolvido por Get-SessionStoreContext.

        .EXAMPLE
            Get-ActiveSessionNumber -Context $context

        .OUTPUTS
            System.Nullable[System.Int32]. $null quando não há sessão activa.

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([int])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNull()]
        [PSCustomObject] $Context
    )

    if (-not (Test-Path -LiteralPath $Context.ActivePath -PathType Leaf)) { return $null }

    try {
        $raw = [System.IO.File]::ReadAllText($Context.ActivePath, $script:Utf8NoBom)
        if ([string]::IsNullOrWhiteSpace($raw)) { return $null }

        $state = $raw | ConvertFrom-Json
        $number = [int] (Get-SessionField -InputObject $state -Name 'Number' -Default 0)
        if ($number -le 0) { return $null }

        $record = Read-SessionRecord -Context $Context -Number $number
        if ($null -eq $record) {
            Write-SessionLog -Level Warning -Message ('O ponteiro de sessão activa aponta para a sessão {0:D4}, que não existe. Foi ignorado.' -f $number)
            return $null
        }

        if (-not [string]::IsNullOrWhiteSpace([string] (Get-SessionField -InputObject $record -Name 'EndedAt' -Default ''))) {
            Write-SessionLog -Level Warning -Message ('O ponteiro de sessão activa aponta para a sessão {0:D4}, já terminada. Foi ignorado.' -f $number)
            return $null
        }

        return $number
    }
    catch {
        Write-SessionLog -Level Warning -Message ('Ponteiro de sessão activa ilegível: {0}' -f $_.Exception.Message)
        return $null
    }
}

function Save-ActiveSessionNumber {
    <#
        .SYNOPSIS
            Persiste o ponteiro da sessão activa.

        .PARAMETER Context
            Contexto devolvido por Get-SessionStoreContext.

        .PARAMETER Number
            Número da sessão a marcar como activa.

        .DESCRIPTION
            O ponteiro é gravado atomicamente, tal como os registos, para que nunca
            seja observado num estado parcialmente escrito.

        .EXAMPLE
            Save-ActiveSessionNumber -Context $context -Number 7

        .OUTPUTS
            Nenhum.

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([void])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNull()]
        [PSCustomObject] $Context,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateRange(1, 9999)]
        [int] $Number
    )

    $state = [PSCustomObject]@{
        SchemaVersion = $script:SchemaVersion
        Number        = $Number
        UpdatedAt     = (ConvertTo-SessionTimestamp -Value ([datetimeoffset]::Now))
    }

    [void] (Save-SessionFile -Path $Context.ActivePath -Content ($state | ConvertTo-Json -Depth $script:JsonDepth))
}

function Clear-ActiveSessionNumber {
    <#
        .SYNOPSIS
            Remove o ponteiro da sessão activa.

        .PARAMETER Context
            Contexto devolvido por Get-SessionStoreContext.

        .DESCRIPTION
            A remoção é tolerante: um ponteiro já inexistente não é um erro, o que torna
            a operação idempotente e segura em recuperação de falhas.

        .EXAMPLE
            Clear-ActiveSessionNumber -Context $context

        .OUTPUTS
            Nenhum.

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([void])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNull()]
        [PSCustomObject] $Context
    )

    if (Test-Path -LiteralPath $Context.ActivePath -PathType Leaf) {
        Remove-Item -LiteralPath $Context.ActivePath -Force -ErrorAction SilentlyContinue
    }
}

#endregion Funções privadas — armazenamento

#region Funções privadas — registos

function Read-SessionRecord {
    <#
        .SYNOPSIS
            Lê o registo JSON de uma sessão.

        .DESCRIPTION
            Devolve o objecto desserializado tal como está em disco (datas ainda em
            texto). Um ficheiro inexistente produz $null; um ficheiro ilegível produz
            $null com aviso, para que uma sessão corrompida não impeça a listagem das
            restantes.

        .PARAMETER Context
            Contexto devolvido por Get-SessionStoreContext.

        .PARAMETER Number
            Número da sessão.

        .EXAMPLE
            Read-SessionRecord -Context $context -Number 7

        .OUTPUTS
            PSCustomObject ou $null.

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNull()]
        [PSCustomObject] $Context,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateRange(1, 9999)]
        [int] $Number
    )

    $path = Get-SessionRecordPath -Context $Context -Number $Number
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { return $null }

    try {
        $raw = [System.IO.File]::ReadAllText($path, $script:Utf8NoBom)
        if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
        return ($raw | ConvertFrom-Json)
    }
    catch {
        Write-SessionLog -Level Warning -Message ('Registo de sessão ilegível em "{0}": {1}' -f $path, $_.Exception.Message)
        return $null
    }
}

function Save-SessionRecord {
    <#
        .SYNOPSIS
            Persiste o registo de uma sessão e regenera o respectivo documento.

        .DESCRIPTION
            Escreve o JSON (fonte de verdade) e, de seguida, o Markdown derivado. Ambas
            as representações são sempre actualizadas em conjunto, o que impede que o
            documento legível divirja dos dados.

        .PARAMETER Context
            Contexto devolvido por Get-SessionStoreContext.

        .PARAMETER Record
            Registo a persistir.

        .EXAMPLE
            Save-SessionRecord -Context $context -Record $record

        .OUTPUTS
            Nenhum.

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([void])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNull()]
        [PSCustomObject] $Context,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateNotNull()]
        [PSCustomObject] $Record
    )

    $number = [int] $Record.Number
    $recordPath = Get-SessionRecordPath -Context $Context -Number $number
    [void] (Save-SessionFile -Path $recordPath -Content ($Record | ConvertTo-Json -Depth $script:JsonDepth))

    $documentName = [string] (Get-SessionField -InputObject $Record -Name 'DocumentName' -Default ('{0:D4}.md' -f $number))
    $documentPath = Join-Path -Path $Context.StorePath -ChildPath $documentName
    [void] (Save-SessionFile -Path $documentPath -Content (Format-SessionDocument -Record $Record))
}

function ConvertTo-SessionObject {
    <#
        .SYNOPSIS
            Converte um registo persistido no objecto público de sessão.

        .DESCRIPTION
            Transforma as datas em [datetimeoffset] e calcula as propriedades
            derivadas (duração, estado). A duração nunca é persistida: é sempre
            recalculada a partir do início e do fim, pelo que não pode divergir deles.

            Numa sessão ainda activa, Duration reflecte o tempo decorrido até ao
            momento da leitura.

        .PARAMETER Context
            Contexto devolvido por Get-SessionStoreContext.

        .PARAMETER Record
            Registo lido de disco.

        .EXAMPLE
            ConvertTo-SessionObject -Context $context -Record $record

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Session'.

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNull()]
        [PSCustomObject] $Context,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateNotNull()]
        [PSCustomObject] $Record
    )

    $number = [int] (Get-SessionField -InputObject $Record -Name 'Number' -Default 0)
    $startedAt = ConvertFrom-SessionTimestamp -Value ([string] (Get-SessionField -InputObject $Record -Name 'StartedAt' -Default ''))
    $endedAt = ConvertFrom-SessionTimestamp -Value ([string] (Get-SessionField -InputObject $Record -Name 'EndedAt' -Default ''))

    $isActive = ($null -ne $startedAt -and $null -eq $endedAt)

    $duration = [timespan]::Zero
    if ($null -ne $startedAt) {
        if ($null -ne $endedAt) { $duration = $endedAt - $startedAt }
        else { $duration = [datetimeoffset]::Now - $startedAt }
    }

    $notes = New-Object -TypeName 'System.Collections.Generic.List[PSObject]'
    foreach ($note in @(Get-SessionField -InputObject $Record -Name 'Notes' -Default @())) {
        $notes.Add([PSCustomObject]@{
                PSTypeName = 'OPF.Session.Note'
                Timestamp  = (ConvertFrom-SessionTimestamp -Value ([string] (Get-SessionField -InputObject $note -Name 'Timestamp' -Default '')))
                Category   = [string] (Get-SessionField -InputObject $note -Name 'Category' -Default 'Info')
                Text       = [string] (Get-SessionField -InputObject $note -Name 'Text' -Default '')
            })
    }

    $documentName = [string] (Get-SessionField -InputObject $Record -Name 'DocumentName' -Default ('{0:D4}.md' -f $number))

    return [PSCustomObject]@{
        PSTypeName   = 'OPF.Session'
        Number       = $number
        Title        = [string] (Get-SessionField -InputObject $Record -Name 'Title' -Default '')
        StartedAt    = $startedAt
        EndedAt      = $endedAt
        Duration     = $duration
        IsActive     = $isActive
        Outcome      = [string] (Get-SessionField -InputObject $Record -Name 'Outcome' -Default '')
        Objectives   = [string[]] @(Get-SessionField -InputObject $Record -Name 'Objectives' -Default @())
        Tags         = [string[]] @(Get-SessionField -InputObject $Record -Name 'Tags' -Default @())
        Notes        = [PSCustomObject[]] $notes.ToArray()
        Summary      = [string] (Get-SessionField -InputObject $Record -Name 'Summary' -Default '')
        Git          = (Get-SessionField -InputObject $Record -Name 'Git' -Default $null)
        DocumentPath = (Join-Path -Path $Context.StorePath -ChildPath $documentName)
        RecordPath   = (Get-SessionRecordPath -Context $Context -Number $number)
        RootPath     = $Context.RootPath
    }
}

function Get-SessionGitContext {
    <#
        .SYNOPSIS
            Captura o estado do repositório Git num dado instante.

        .DESCRIPTION
            Utiliza exclusivamente a API pública do módulo Git.psm1 (Get-GitBranch e
            Get-GitStatus). O módulo Session nunca invoca o executável 'git'
            directamente: toda a interacção com o Git permanece centralizada num só
            módulo, como manda a separação de responsabilidades.

            A ausência do módulo Git, ou qualquer falha na sua invocação, produz um
            contexto com valores nulos. Registar o contexto é um complemento à sessão,
            nunca um requisito para a iniciar ou terminar.

        .PARAMETER Path
            Caminho dentro do repositório.

        .EXAMPLE
            Get-SessionGitContext -Path $root

        .OUTPUTS
            PSCustomObject com as propriedades Branch, Commit, ShortCommit e IsClean.

        .NOTES
            Função privada. Não é exportada. Ponto de intercepção recomendado em testes.
    #>
    [CmdletBinding()]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNullOrEmpty()]
        [string] $Path
    )

    $context = [PSCustomObject]@{
        Branch      = $null
        Commit      = $null
        ShortCommit = $null
        IsClean     = $null
    }

    if ($null -eq $script:GitBranchCommand) {
        $script:GitBranchCommand = Get-Command -Name 'Get-GitBranch' -CommandType Function -ErrorAction SilentlyContinue |
            Select-Object -First 1
    }
    if ($null -eq $script:GitStatusCommand) {
        $script:GitStatusCommand = Get-Command -Name 'Get-GitStatus' -CommandType Function -ErrorAction SilentlyContinue |
            Select-Object -First 1
    }

    if ($null -ne $script:GitBranchCommand) {
        try {
            $branch = & $script:GitBranchCommand -Path $Path
            $context.Branch = $branch.Name
            $context.Commit = $branch.Sha
            $context.ShortCommit = $branch.ShortSha
        }
        catch {
            Write-SessionLog -Level Debug -Message ('Contexto Git indisponível em "{0}": {1}' -f $Path, $_.Exception.Message)
        }
    }

    if ($null -ne $script:GitStatusCommand) {
        try {
            $status = & $script:GitStatusCommand -Path $Path
            $context.IsClean = $status.IsClean
        }
        catch {
            Write-SessionLog -Level Debug -Message ('Estado Git indisponível em "{0}": {1}' -f $Path, $_.Exception.Message)
        }
    }

    return $context
}

function Format-SessionDuration {
    <#
        .SYNOPSIS
            Formata uma duração de modo legível e independente da cultura.

        .DESCRIPTION
            Produz o formato 'HHhMMm' (por exemplo '02h35m'), acrescentando os dias
            quando aplicável. Evita ToString() sem argumentos, cujo resultado varia com
            a cultura do processo.

        .PARAMETER Duration
            Duração a formatar.

        .EXAMPLE
            Format-SessionDuration -Duration ([timespan]::FromMinutes(155))
            # 02h35m

        .OUTPUTS
            System.String

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [timespan] $Duration
    )

    if ($Duration.Ticks -lt 0) { return '00h00m' }

    if ($Duration.Days -gt 0) {
        return ('{0}d {1:00}h{2:00}m' -f $Duration.Days, $Duration.Hours, $Duration.Minutes)
    }

    return ('{0:00}h{1:00}m' -f $Duration.Hours, $Duration.Minutes)
}

function Format-SessionDocument {
    <#
        .SYNOPSIS
            Gera o documento Markdown de uma sessão.

        .DESCRIPTION
            Produz o artefacto legível a partir do registo. O documento inclui um aviso
            de que é gerado automaticamente: como a fonte de verdade é o JSON, qualquer
            edição manual seria perdida na gravação seguinte.

            Os valores provenientes do utilizador (título, objectivos, notas, resumo)
            são inseridos tal como foram fornecidos, mas nunca em posições onde possam
            alterar a estrutura do documento: os títulos e as células de tabela têm os
            caracteres de controlo de Markdown escapados.

        .PARAMETER Record
            Registo da sessão.

        .EXAMPLE
            Format-SessionDocument -Record $record

        .OUTPUTS
            System.String

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [ValidateNotNull()]
        [PSCustomObject] $Record
    )

    $number = [int] (Get-SessionField -InputObject $Record -Name 'Number' -Default 0)
    $title = [string] (Get-SessionField -InputObject $Record -Name 'Title' -Default '')
    $startedText = [string] (Get-SessionField -InputObject $Record -Name 'StartedAt' -Default '')
    $endedText = [string] (Get-SessionField -InputObject $Record -Name 'EndedAt' -Default '')
    $startedAt = ConvertFrom-SessionTimestamp -Value $startedText
    $endedAt = ConvertFrom-SessionTimestamp -Value $endedText

    $duration = [timespan]::Zero
    $state = 'Em curso'
    if ($null -ne $startedAt -and $null -ne $endedAt) {
        $duration = $endedAt - $startedAt
        $state = [string] (Get-SessionField -InputObject $Record -Name 'Outcome' -Default 'Completed')
    }

    $builder = New-Object -TypeName System.Text.StringBuilder
    $newLine = [System.Environment]::NewLine

    [void] $builder.Append('<!-- Documento gerado automaticamente pelo módulo Session.psm1 do OPF.').Append($newLine)
    [void] $builder.Append('     Não editar: a fonte de verdade é ').Append('{0:D4}.json' -f $number).Append(' e este ficheiro é').Append($newLine)
    [void] $builder.Append('     regenerado a cada alteração da sessão. -->').Append($newLine).Append($newLine)

    # O -f é resolvido numa variável: dentro de .Append(...) a vírgula seria lida
    # como separador de argumentos do método, não como o array de formatação.
    $heading = '# Sessão {0:D4} — {1}' -f $number, (Format-SessionMarkdownText -Text $title)
    [void] $builder.Append($heading).Append($newLine).Append($newLine)

    [void] $builder.Append('| Campo | Valor |').Append($newLine)
    [void] $builder.Append('| --- | --- |').Append($newLine)
    [void] $builder.Append('| Estado | {0} |' -f $state).Append($newLine)
    [void] $builder.Append('| Início | {0} |' -f (Format-SessionMarkdownText -Text $startedText)).Append($newLine)
    [void] $builder.Append('| Fim | {0} |' -f (Format-SessionMarkdownText -Text $endedText)).Append($newLine)
    [void] $builder.Append('| Duração | {0} |' -f (Format-SessionDuration -Duration $duration)).Append($newLine)

    $tags = @(Get-SessionField -InputObject $Record -Name 'Tags' -Default @())
    if ($tags.Count -gt 0) {
        [void] $builder.Append('| Etiquetas | {0} |' -f (Format-SessionMarkdownText -Text ($tags -join ', '))).Append($newLine)
    }

    $git = Get-SessionField -InputObject $Record -Name 'Git' -Default $null
    if ($null -ne $git) {
        $startBranch = [string] (Get-SessionField -InputObject $git -Name 'StartBranch' -Default '')
        $startCommit = [string] (Get-SessionField -InputObject $git -Name 'StartShortCommit' -Default '')
        $endCommit = [string] (Get-SessionField -InputObject $git -Name 'EndShortCommit' -Default '')

        if (-not [string]::IsNullOrWhiteSpace($startBranch)) {
            [void] $builder.Append('| Ramo | {0} |' -f (Format-SessionMarkdownText -Text $startBranch)).Append($newLine)
        }
        if (-not [string]::IsNullOrWhiteSpace($startCommit)) {
            [void] $builder.Append('| Commit inicial | `{0}` |' -f $startCommit).Append($newLine)
        }
        if (-not [string]::IsNullOrWhiteSpace($endCommit)) {
            [void] $builder.Append('| Commit final | `{0}` |' -f $endCommit).Append($newLine)
        }
    }

    [void] $builder.Append($newLine)

    $objectives = @(Get-SessionField -InputObject $Record -Name 'Objectives' -Default @())
    if ($objectives.Count -gt 0) {
        [void] $builder.Append('## Objectivos').Append($newLine).Append($newLine)
        foreach ($objective in $objectives) {
            [void] $builder.Append('- {0}' -f $objective).Append($newLine)
        }
        [void] $builder.Append($newLine)
    }

    $notes = @(Get-SessionField -InputObject $Record -Name 'Notes' -Default @())
    if ($notes.Count -gt 0) {
        [void] $builder.Append('## Notas').Append($newLine).Append($newLine)
        foreach ($note in $notes) {
            $timestamp = ConvertFrom-SessionTimestamp -Value ([string] (Get-SessionField -InputObject $note -Name 'Timestamp' -Default ''))
            $clock = '--:--'
            if ($null -ne $timestamp) { $clock = $timestamp.ToString('HH:mm', [cultureinfo]::InvariantCulture) }

            $line = '- **{0}** [{1}] {2}' -f $clock,
                ([string] (Get-SessionField -InputObject $note -Name 'Category' -Default 'Info')),
                ([string] (Get-SessionField -InputObject $note -Name 'Text' -Default ''))
            [void] $builder.Append($line).Append($newLine)
        }
        [void] $builder.Append($newLine)
    }

    $summary = [string] (Get-SessionField -InputObject $Record -Name 'Summary' -Default '')
    if (-not [string]::IsNullOrWhiteSpace($summary)) {
        [void] $builder.Append('## Resumo').Append($newLine).Append($newLine)
        [void] $builder.Append($summary).Append($newLine)
    }

    return $builder.ToString()
}

function Format-SessionMarkdownText {
    <#
        .SYNOPSIS
            Neutraliza os caracteres que quebrariam a estrutura do documento.

        .DESCRIPTION
            Substitui as mudanças de linha por espaços e escapa o caracter de barra
            vertical, que de outro modo introduziria colunas adicionais numa tabela
            Markdown ou dividiria um título em várias linhas.

            Aplica-se apenas a valores colocados em títulos e em células de tabela; o
            corpo das notas e do resumo é preservado tal como foi escrito.

        .PARAMETER Text
            Texto a neutralizar.

        .EXAMPLE
            Format-SessionMarkdownText -Text "linha 1`nlinha 2 | coluna"

        .OUTPUTS
            System.String

        .NOTES
            Função privada. Não é exportada.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [AllowEmptyString()]
        [AllowNull()]
        [string] $Text
    )

    if ([string]::IsNullOrEmpty($Text)) { return '' }

    $result = $Text -replace "`r`n", ' '
    $result = $result -replace "[`r`n]", ' '
    $result = $result -replace '\|', '\|'

    return $result.Trim()
}

#endregion Funções privadas — registos

#region Funções públicas — armazenamento

function Initialize-SessionStore {
    <#
        .SYNOPSIS
            Cria a estrutura de armazenamento de sessões.

        .DESCRIPTION
            Cria '<raiz>/.opf/sessions' e o subdirectório 'data', bem como um ficheiro
            .gitignore que exclui o ponteiro de sessão activa do controlo de versões —
            trata-se de estado local de máquina, que não deve gerar conflitos entre
            colaboradores.

            A operação é idempotente: executá-la sobre um armazenamento existente não
            altera nada e não produz erro.

            A raiz é resolvida através de Get-GitRoot quando o módulo Git.psm1 está
            disponível, pelo que o armazenamento fica sempre na raiz do repositório,
            independentemente do subdirectório onde o comando é invocado.

        .PARAMETER Path
            Caminho de partida. Se omitido, é usada a localização actual.

        .EXAMPLE
            Initialize-SessionStore

        .EXAMPLE
            Initialize-SessionStore -Path 'C:\Projectos\OPF' -WhatIf

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Session.Store'. Devolve $null quando a
            operação é suprimida por -WhatIf.
    #>
    [CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Low')]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Position = 0, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath
    )

    process {
        try {
            $context = Get-SessionStoreContext -Path $Path

            if ($context.Exists) {
                Write-SessionLog -Level Debug -Message ('O armazenamento de sessões já existe em "{0}".' -f $context.StorePath)
                return $context
            }

            if (-not $PSCmdlet.ShouldProcess($context.StorePath, 'Criar armazenamento de sessões')) {
                return $null
            }

            [void] (New-Item -Path $context.DataPath -ItemType Directory -Force)

            $ignorePath = Join-Path -Path $context.StorePath -ChildPath '.gitignore'
            if (-not (Test-Path -LiteralPath $ignorePath -PathType Leaf)) {
                $ignore = @(
                    '# Ponteiro local da sessão activa: não deve ser versionado.'
                    $script:ActiveStateFileName
                    '*.tmp'
                ) -join [System.Environment]::NewLine

                [void] (Save-SessionFile -Path $ignorePath -Content $ignore)
            }

            Write-SessionLog -Level Information -Message ('Armazenamento de sessões criado em "{0}".' -f $context.StorePath)

            return (Get-SessionStoreContext -Path $Path)
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

function Test-SessionActive {
    <#
        .SYNOPSIS
            Indica se existe uma sessão activa.

        .DESCRIPTION
            Devolve sempre um valor booleano, nunca lançando excepções. Um ponteiro
            obsoleto — apontando para uma sessão inexistente ou já terminada — é tratado
            como ausência de sessão activa.

        .PARAMETER Path
            Caminho de partida. Se omitido, é usada a localização actual.

        .EXAMPLE
            if (Test-SessionActive) { Stop-Session -Summary 'Interrompida' }

        .OUTPUTS
            System.Boolean
    #>
    [CmdletBinding()]
    [OutputType([bool])]
    param(
        [Parameter(Position = 0, ValueFromPipeline = $true, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath
    )

    process {
        try {
            $context = Get-SessionStoreContext -Path $Path
            if (-not $context.Exists) { return $false }

            return ($null -ne (Get-ActiveSessionNumber -Context $context))
        }
        catch {
            Write-SessionLog -Level Debug -Message ('Não foi possível determinar a sessão activa: {0}' -f $_.Exception.Message)
            return $false
        }
    }
}

#endregion Funções públicas — armazenamento

#region Funções públicas — ciclo de vida

function Start-Session {
    <#
        .SYNOPSIS
            Inicia uma nova sessão de trabalho.

        .DESCRIPTION
            Reserva o número sequencial seguinte, regista o instante de início e o
            contexto Git, cria o documento Markdown e marca a sessão como activa.

            Só pode existir uma sessão activa por projecto. A tentativa de iniciar uma
            segunda produz um erro identificado por 'OpfSessionAlreadyActive', em vez de
            terminar silenciosamente a anterior — encerrar trabalho de outrem nunca deve
            ser um efeito colateral.

            Se o armazenamento ainda não existir, é criado.

        .PARAMETER Path
            Caminho de partida. Se omitido, é usada a localização actual.

        .PARAMETER Title
            Título da sessão. Se omitido, é usado 'Sessão NNNN'.

        .PARAMETER Objective
            Objectivos da sessão, um por elemento.

        .PARAMETER Tag
            Etiquetas de classificação.

        .EXAMPLE
            Start-Session -Title 'Refactor do módulo Git' -Objective 'Corrigir injecção de argumentos', 'Adicionar testes'

        .EXAMPLE
            Start-Session -Tag 'manutencao', 'ci'

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Session'. Devolve $null quando a operação é
            suprimida por -WhatIf.
    #>
    [CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Low')]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Position = 0, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath,

        [Parameter(Position = 1)]
        [ValidateLength(0, 200)]
        [string] $Title,

        [Parameter()]
        [AllowEmptyCollection()]
        [string[]] $Objective = @(),

        [Parameter()]
        [AllowEmptyCollection()]
        [string[]] $Tag = @()
    )

    process {
        try {
            $context = Get-SessionStoreContext -Path $Path

            if (-not $PSCmdlet.ShouldProcess($context.RootPath, 'Iniciar sessão de trabalho')) {
                return $null
            }

            if (-not $context.Exists) {
                [void] (Initialize-SessionStore -Path $Path -Confirm:$false)
                $context = Get-SessionStoreContext -Path $Path
            }

            $active = Get-ActiveSessionNumber -Context $context
            if ($null -ne $active) {
                throw (Get-SessionErrorRecord -Message ('Já existe uma sessão activa ({0:D4}). Termine-a com Stop-Session antes de iniciar outra.' -f $active) `
                        -ErrorId 'OpfSessionAlreadyActive' `
                        -Category ([System.Management.Automation.ErrorCategory]::ResourceExists) `
                        -TargetObject $active)
            }

            $number = Register-SessionNumber -Context $context

            $effectiveTitle = $Title
            if ([string]::IsNullOrWhiteSpace($effectiveTitle)) {
                $effectiveTitle = 'Sessão {0:D4}' -f $number
            }

            $git = Get-SessionGitContext -Path $context.RootPath

            $record = [PSCustomObject]@{
                SchemaVersion = $script:SchemaVersion
                Number        = $number
                Title         = $effectiveTitle
                DocumentName  = ('{0:D4}-{1}.md' -f $number, (ConvertTo-SessionSlug -Title $effectiveTitle))
                StartedAt     = (ConvertTo-SessionTimestamp -Value ([datetimeoffset]::Now))
                EndedAt       = $null
                Outcome       = $null
                Objectives    = [string[]] @($Objective | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
                Tags          = [string[]] @($Tag | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
                Notes         = @()
                Summary       = $null
                Git           = [PSCustomObject]@{
                    StartBranch      = $git.Branch
                    StartCommit      = $git.Commit
                    StartShortCommit = $git.ShortCommit
                    StartIsClean     = $git.IsClean
                    EndBranch        = $null
                    EndCommit        = $null
                    EndShortCommit   = $null
                    EndIsClean       = $null
                }
            }

            Save-SessionRecord -Context $context -Record $record
            Save-ActiveSessionNumber -Context $context -Number $number

            Write-SessionLog -Level Information -Message ('Sessão {0:D4} iniciada: {1}' -f $number, $effectiveTitle)

            return (ConvertTo-SessionObject -Context $context -Record $record)
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

function Stop-Session {
    <#
        .SYNOPSIS
            Termina a sessão activa.

        .DESCRIPTION
            Regista o instante de fim, o desfecho, o resumo e o contexto Git final,
            regenera o documento e liberta o ponteiro de sessão activa.

            A duração não é gravada: é sempre derivada do início e do fim, pelo que não
            pode divergir deles nem ser adulterada por edição do registo.

        .PARAMETER Path
            Caminho de partida. Se omitido, é usada a localização actual.

        .PARAMETER Summary
            Resumo do trabalho realizado. É incluído na secção 'Resumo' do documento.

        .PARAMETER Outcome
            Desfecho da sessão. Valores aceites: Completed, Aborted, Paused.
            O valor predefinido é 'Completed'.

        .EXAMPLE
            Stop-Session -Summary 'Corrigidos 6 defeitos e adicionados testes de regressão.'

        .EXAMPLE
            Stop-Session -Outcome Aborted -Summary 'Interrompida por indisponibilidade do ambiente.'

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Session'. Devolve $null quando a operação é
            suprimida por -WhatIf.
    #>
    [CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Position = 0, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath,

        [Parameter(Position = 1)]
        [AllowEmptyString()]
        [string] $Summary,

        [Parameter()]
        [ValidateSet('Completed', 'Aborted', 'Paused')]
        [string] $Outcome = 'Completed'
    )

    process {
        try {
            $context = Assert-SessionStore -Context (Get-SessionStoreContext -Path $Path)

            $number = Get-ActiveSessionNumber -Context $context
            if ($null -eq $number) {
                throw (Get-SessionErrorRecord -Message ('Não existe nenhuma sessão activa em "{0}".' -f $context.RootPath) `
                        -ErrorId 'OpfSessionNotActive' `
                        -Category ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                        -TargetObject $context.RootPath)
            }

            if (-not $PSCmdlet.ShouldProcess(('Sessão {0:D4}' -f $number), 'Terminar sessão de trabalho')) {
                return $null
            }

            $record = Read-SessionRecord -Context $context -Number $number
            if ($null -eq $record) {
                throw (Get-SessionErrorRecord -Message ('O registo da sessão {0:D4} não pôde ser lido.' -f $number) `
                        -ErrorId 'OpfSessionRecordUnreadable' `
                        -Category ([System.Management.Automation.ErrorCategory]::ReadError) `
                        -TargetObject $number)
            }

            $git = Get-SessionGitContext -Path $context.RootPath

            $record.EndedAt = ConvertTo-SessionTimestamp -Value ([datetimeoffset]::Now)
            $record.Outcome = $Outcome
            if (-not [string]::IsNullOrWhiteSpace($Summary)) { $record.Summary = $Summary }

            if ($null -ne (Get-SessionField -InputObject $record -Name 'Git' -Default $null)) {
                $record.Git.EndBranch = $git.Branch
                $record.Git.EndCommit = $git.Commit
                $record.Git.EndShortCommit = $git.ShortCommit
                $record.Git.EndIsClean = $git.IsClean
            }

            Save-SessionRecord -Context $context -Record $record
            Clear-ActiveSessionNumber -Context $context

            $session = ConvertTo-SessionObject -Context $context -Record $record
            Write-SessionLog -Level Information -Message ('Sessão {0:D4} terminada ({1}); duração {2}.' -f `
                    $number, $Outcome, (Format-SessionDuration -Duration $session.Duration))

            return $session
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

function Add-SessionNote {
    <#
        .SYNOPSIS
            Acrescenta uma nota à sessão activa.

        .DESCRIPTION
            Cada nota é datada no momento em que é acrescentada e classificada por
            categoria, permitindo distinguir observações, decisões, problemas e próximos
            passos ao reler o documento.

            O registo é relido de disco antes de cada alteração, de modo que notas
            acrescentadas por outro processo não sejam perdidas.

        .PARAMETER Path
            Caminho de partida. Se omitido, é usada a localização actual.

        .PARAMETER Note
            Texto da nota.

        .PARAMETER Category
            Classificação da nota. Valores aceites: Info, Decision, Issue, Next.
            O valor predefinido é 'Info'.

        .EXAMPLE
            Add-SessionNote -Note 'Optámos por JSON como fonte de verdade.' -Category Decision

        .EXAMPLE
            'Testes de integração ainda em falta' | Add-SessionNote -Category Next

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Session'. Devolve $null quando a operação é
            suprimida por -WhatIf.
    #>
    [CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Low')]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        [ValidateNotNullOrEmpty()]
        [string] $Note,

        [Parameter()]
        [ValidateSet('Info', 'Decision', 'Issue', 'Next')]
        [string] $Category = 'Info',

        [Parameter(ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath
    )

    process {
        try {
            $context = Assert-SessionStore -Context (Get-SessionStoreContext -Path $Path)

            $number = Get-ActiveSessionNumber -Context $context
            if ($null -eq $number) {
                throw (Get-SessionErrorRecord -Message ('Não existe nenhuma sessão activa em "{0}".' -f $context.RootPath) `
                        -ErrorId 'OpfSessionNotActive' `
                        -Category ([System.Management.Automation.ErrorCategory]::InvalidOperation) `
                        -TargetObject $context.RootPath)
            }

            if (-not $PSCmdlet.ShouldProcess(('Sessão {0:D4}' -f $number), 'Acrescentar nota')) {
                return $null
            }

            $record = Read-SessionRecord -Context $context -Number $number
            if ($null -eq $record) {
                throw (Get-SessionErrorRecord -Message ('O registo da sessão {0:D4} não pôde ser lido.' -f $number) `
                        -ErrorId 'OpfSessionRecordUnreadable' `
                        -Category ([System.Management.Automation.ErrorCategory]::ReadError) `
                        -TargetObject $number)
            }

            $notes = New-Object -TypeName 'System.Collections.Generic.List[PSObject]'
            foreach ($existing in @(Get-SessionField -InputObject $record -Name 'Notes' -Default @())) {
                $notes.Add($existing)
            }

            $notes.Add([PSCustomObject]@{
                    Timestamp = (ConvertTo-SessionTimestamp -Value ([datetimeoffset]::Now))
                    Category  = $Category
                    Text      = $Note
                })

            $record.Notes = @($notes.ToArray())

            Save-SessionRecord -Context $context -Record $record
            Write-SessionLog -Level Debug -Message ('Nota [{0}] acrescentada à sessão {1:D4}.' -f $Category, $number)

            return (ConvertTo-SessionObject -Context $context -Record $record)
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

#endregion Funções públicas — ciclo de vida

#region Funções públicas — consulta

function Get-Session {
    <#
        .SYNOPSIS
            Devolve as sessões registadas.

        .DESCRIPTION
            Lê os registos JSON e emite-os para o pipeline, ordenados por número.

            À semelhança dos cmdlets nativos, os objectos são emitidos individualmente:
            'Get-Session | ForEach-Object { ... }' itera por sessão. Para obter uma
            colecção garantida, mesmo com zero ou um resultado, use o idioma habitual
            '@(Get-Session)'. Emitir a colecção como objecto único (Write-Output
            -NoEnumerate) garantiria o tipo, mas quebraria a iteração no pipeline e
            faria '@(...)' produzir um array dentro de um array.

            Registos ilegíveis são omitidos com aviso, em vez de fazerem falhar toda a
            consulta.

        .PARAMETER Path
            Caminho de partida. Se omitido, é usada a localização actual.

        .PARAMETER Number
            Devolve apenas as sessões com estes números.

        .PARAMETER Active
            Devolve apenas a sessão activa.

        .PARAMETER Last
            Devolve apenas as N sessões mais recentes.

        .PARAMETER Tag
            Devolve apenas as sessões que tenham pelo menos uma destas etiquetas.

        .EXAMPLE
            Get-Session -Last 5 | Format-Table Number, Title, Duration

        .EXAMPLE
            Get-Session -Active

        .EXAMPLE
            Get-Session -Tag 'manutencao'

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Session', um por sessão.
    #>
    [CmdletBinding(DefaultParameterSetName = 'Filter')]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Position = 0, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath,

        [Parameter(ParameterSetName = 'Filter')]
        [ValidateRange(1, 9999)]
        [int[]] $Number,

        [Parameter(Mandatory = $true, ParameterSetName = 'Active')]
        [switch] $Active,

        [Parameter(ParameterSetName = 'Filter')]
        [ValidateRange(1, 9999)]
        [int] $Last,

        [Parameter(ParameterSetName = 'Filter')]
        [string[]] $Tag
    )

    process {
        try {
            $context = Get-SessionStoreContext -Path $Path
            $sessions = New-Object -TypeName 'System.Collections.Generic.List[PSObject]'

            if (-not $context.Exists) {
                return
            }

            if ($PSCmdlet.ParameterSetName -eq 'Active') {
                $activeNumber = Get-ActiveSessionNumber -Context $context
                if ($null -ne $activeNumber) {
                    $record = Read-SessionRecord -Context $context -Number $activeNumber
                    if ($null -ne $record) {
                        $sessions.Add((ConvertTo-SessionObject -Context $context -Record $record))
                    }
                }

                Write-Output -InputObject $sessions.ToArray()
                return
            }

            $files = @(Get-ChildItem -LiteralPath $context.DataPath -Filter '*.json' -File -ErrorAction SilentlyContinue)

            foreach ($file in ($files | Sort-Object -Property Name)) {
                $parsed = 0
                if (-not [int]::TryParse([System.IO.Path]::GetFileNameWithoutExtension($file.Name), [ref] $parsed)) { continue }
                if ($PSBoundParameters.ContainsKey('Number') -and $parsed -notin $Number) { continue }

                $record = Read-SessionRecord -Context $context -Number $parsed
                if ($null -eq $record) { continue }

                $session = ConvertTo-SessionObject -Context $context -Record $record

                if ($PSBoundParameters.ContainsKey('Tag')) {
                    $matched = @($session.Tags | Where-Object { $_ -in $Tag })
                    if ($matched.Count -eq 0) { continue }
                }

                $sessions.Add($session)
            }

            $result = $sessions.ToArray()
            if ($PSBoundParameters.ContainsKey('Last') -and $result.Count -gt $Last) {
                $result = $result[($result.Count - $Last)..($result.Count - 1)]
            }

            Write-Output -InputObject $result
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

function Get-SessionSummary {
    <#
        .SYNOPSIS
            Devolve estatísticas agregadas das sessões.

        .DESCRIPTION
            Calcula contagens, duração total e média, e o intervalo temporal coberto.

            A sessão activa é contabilizada separadamente e a sua duração parcial não
            entra na duração total: incluí-la faria com que o mesmo comando devolvesse
            valores diferentes a cada invocação.

        .PARAMETER Path
            Caminho de partida. Se omitido, é usada a localização actual.

        .EXAMPLE
            Get-SessionSummary | Format-List

        .OUTPUTS
            PSCustomObject com o tipo 'OPF.Session.Summary'.
    #>
    [CmdletBinding()]
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Position = 0, ValueFromPipeline = $true, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath
    )

    process {
        try {
            $context = Get-SessionStoreContext -Path $Path
            $sessions = @(Get-Session -Path $Path)

            $completed = @($sessions | Where-Object { -not $_.IsActive })
            $totalTicks = 0L

            foreach ($session in $completed) {
                $totalTicks += $session.Duration.Ticks
            }

            $total = [timespan]::FromTicks($totalTicks)
            $average = [timespan]::Zero
            if ($completed.Count -gt 0) {
                $average = [timespan]::FromTicks([long] ($totalTicks / $completed.Count))
            }

            $firstStart = $null
            $lastEnd = $null
            if ($sessions.Count -gt 0) {
                $firstStart = $sessions[0].StartedAt
                $lastEnd = $sessions[$sessions.Count - 1].EndedAt
            }

            return [PSCustomObject]@{
                PSTypeName       = 'OPF.Session.Summary'
                RootPath         = $context.RootPath
                StorePath        = $context.StorePath
                TotalSessions    = $sessions.Count
                CompletedCount   = $completed.Count
                ActiveCount      = ($sessions.Count - $completed.Count)
                TotalDuration    = $total
                TotalDurationText = (Format-SessionDuration -Duration $total)
                AverageDuration  = $average
                FirstStartedAt   = $firstStart
                LastEndedAt      = $lastEnd
            }
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

function Export-SessionReport {
    <#
        .SYNOPSIS
            Gera um relatório Markdown consolidado de todas as sessões.

        .DESCRIPTION
            Produz um documento único com os totais agregados e uma tabela de sessões,
            adequado a ser versionado como registo de progresso do projecto.

            O relatório é integralmente derivado dos registos JSON; pode ser eliminado e
            regenerado a qualquer momento sem perda de informação.

        .PARAMETER Path
            Caminho de partida. Se omitido, é usada a localização actual.

        .PARAMETER Destination
            Caminho do ficheiro a gerar. Se omitido, é usado '<armazenamento>/RELATORIO.md'.

        .PARAMETER Last
            Inclui apenas as N sessões mais recentes.

        .EXAMPLE
            Export-SessionReport

        .EXAMPLE
            Export-SessionReport -Last 20 -Destination './docs/sessoes.md'

        .OUTPUTS
            System.String. O caminho do ficheiro gerado. Devolve $null quando a operação
            é suprimida por -WhatIf.
    #>
    [CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Low')]
    [OutputType([string])]
    param(
        [Parameter(Position = 0, ValueFromPipelineByPropertyName = $true)]
        [string] $Path = (Get-Location).ProviderPath,

        [Parameter(Position = 1)]
        [string] $Destination,

        [Parameter()]
        [ValidateRange(1, 9999)]
        [int] $Last
    )

    process {
        try {
            $context = Assert-SessionStore -Context (Get-SessionStoreContext -Path $Path)

            $target = $Destination
            if ([string]::IsNullOrWhiteSpace($target)) { $target = $context.ReportPath }

            if (-not $PSCmdlet.ShouldProcess($target, 'Gerar relatório de sessões')) {
                return $null
            }

            $arguments = @{ Path = $Path }
            if ($PSBoundParameters.ContainsKey('Last')) { $arguments['Last'] = $Last }
            $sessions = @(Get-Session @arguments)

            $summary = Get-SessionSummary -Path $Path
            $newLine = [System.Environment]::NewLine
            $builder = New-Object -TypeName System.Text.StringBuilder

            [void] $builder.Append('<!-- Relatório gerado automaticamente pelo módulo Session.psm1 do OPF. -->').Append($newLine).Append($newLine)
            [void] $builder.Append('# Registo de sessões').Append($newLine).Append($newLine)
            [void] $builder.Append('- Sessões registadas: {0}' -f $summary.TotalSessions).Append($newLine)
            [void] $builder.Append('- Sessões concluídas: {0}' -f $summary.CompletedCount).Append($newLine)
            [void] $builder.Append('- Tempo total: {0}' -f $summary.TotalDurationText).Append($newLine)
            [void] $builder.Append('- Duração média: {0}' -f (Format-SessionDuration -Duration $summary.AverageDuration)).Append($newLine).Append($newLine)

            [void] $builder.Append('| N.º | Título | Início | Duração | Estado |').Append($newLine)
            [void] $builder.Append('| --- | --- | --- | --- | --- |').Append($newLine)

            foreach ($session in $sessions) {
                $start = ''
                if ($null -ne $session.StartedAt) {
                    $start = $session.StartedAt.ToString('yyyy-MM-dd HH:mm', [cultureinfo]::InvariantCulture)
                }

                $state = 'Em curso'
                if (-not $session.IsActive) {
                    $state = $session.Outcome
                    if ([string]::IsNullOrWhiteSpace($state)) { $state = 'Completed' }
                }

                $row = '| {0:D4} | [{1}]({2}) | {3} | {4} | {5} |' -f $session.Number,
                    (Format-SessionMarkdownText -Text $session.Title),
                    (Split-Path -Path $session.DocumentPath -Leaf),
                    $start,
                    (Format-SessionDuration -Duration $session.Duration),
                    $state
                [void] $builder.Append($row).Append($newLine)
            }

            [void] (Save-SessionFile -Path $target -Content $builder.ToString())
            Write-SessionLog -Level Information -Message ('Relatório de sessões gerado em "{0}".' -f $target)

            return [string] $target
        }
        catch {
            $PSCmdlet.ThrowTerminatingError($_)
        }
    }
}

#endregion Funções públicas — consulta

#region Exportação

Export-ModuleMember -Function @(
    # Armazenamento
    'Initialize-SessionStore'
    'Test-SessionActive'

    # Ciclo de vida
    'Start-Session'
    'Stop-Session'
    'Add-SessionNote'

    # Consulta
    'Get-Session'
    'Get-SessionSummary'
    'Export-SessionReport'
)

#endregion Exportação
