#Requires -Version 5.1
Set-StrictMode -Version Latest

#region Module Header
<#
    Markdown.psm1

    Modulo do Open Project Framework (OPF) para construcao programatica de
    documentos Markdown, usando System.Text.StringBuilder como motor interno.

    Compatibilidade: Windows PowerShell 5.1 e PowerShell 7+.

    Arquitetura interna (tres camadas, sem estado global partilhado):

      1. Modelo      OpfMarkdownDocument encapsula o StringBuilder e os
                     metadados do documento. ToString() devolve o Markdown.
      2. Composicao  Primitivas privadas (Add-OpfLine, Add-OpfBlock, ...)
                     concentram toda a escrita no StringBuilder. Nenhuma
                     funcao publica manipula o Builder diretamente.
      3. Formatacao  Funcoes puras (Get-OpfSlug, Get-OpfEscapedText,
                     Get-OpfInlineLink, ...) transformam texto sem tocar no
                     documento, o que as torna testaveis isoladamente.

    Este modulo nao possui dependencias externas obrigatorias. Tenta
    integrar-se de forma opcional e resiliente com um modulo irmao
    "Utils.psm1" (se presente na mesma pasta), reaproveitando uma eventual
    funcao de tratamento de erros caso esta exista. Se o modulo Utils.psm1
    nao existir, ou nao exportar a funcao esperada, o modulo Markdown.psm1
    continua a funcionar normalmente, usando o seu proprio tratamento de
    erros interno.

    Estrategia de erros: todas as falhas sao terminantes e passam por
    Invoke-OpfErrorHandler, que devolve o controlo atraves de
    ThrowTerminatingError com o FullyQualifiedErrorId 'OpfMarkdownError'.
#>
#endregion Module Header

#region Private Variables

# Nome da funcao de erro conhecida que podera existir no modulo Utils.psm1.
# Se existir e estiver disponivel como comando, sera usada como camada
# adicional de reporte de erro (nunca substitui o tratamento interno).
$script:OpfUtilsErrorFunctionName = 'Write-OpfError'

# Indica se a integracao opcional com Utils.psm1 foi resolvida com sucesso.
$script:OpfUtilsAvailable = $false

# Guarda uma referencia direta ao comando de erro do Utils.psm1 (quando
# disponivel), para evitar depender de resolucao de nomes entre escopos de
# modulos distintos no momento em que o erro ocorre.
$script:OpfUtilsErrorCommand = $null

# Identificador de erro unico do modulo. Faz parte do contrato publico:
# consumidores podem filtrar por FullyQualifiedErrorId.
$script:OpfMarkdownErrorId = 'OpfMarkdownError'

# Caracteres com significado especial em Markdown. A barra invertida esta
# em primeiro lugar no padrao por ser o caracter de escape.
$script:OpfMarkdownEscapePattern = '([\\`*_{}\[\]()#+\-.!|<>])'

#endregion Private Variables

#region Private Types

class OpfMarkdownDocument {
    <#
        Modelo do documento.

        O objeto representa o seu proprio conteudo: ToString() devolve o
        Markdown acumulado, pelo que "$doc", $doc.ToString() e
        Write-Output $doc.ToString() produzem todos o documento gerado.

        A propriedade Builder mantem-se publica e do mesmo tipo por
        compatibilidade com consumidores existentes.
    #>

    [System.Text.StringBuilder] $Builder
    [string] $Title
    [datetime] $CreatedAt
    [int] $HeadingCount
    [System.Collections.Specialized.OrderedDictionary] $Metadata
    [string] $NewLine

    OpfMarkdownDocument([string] $title) {
        $this.Builder      = [System.Text.StringBuilder]::new()
        $this.Title        = $title
        $this.CreatedAt    = Get-Date
        $this.HeadingCount = 0
        $this.Metadata     = [System.Collections.Specialized.OrderedDictionary]::new()
        $this.NewLine      = [System.Environment]::NewLine
    }

    [string] ToString() {
        return $this.Builder.ToString()
    }
}

#endregion Private Types

#region Private Functions - Utils Integration

function Initialize-OpfUtilsIntegration {
    <#
        .SYNOPSIS
        Tenta importar o modulo irmao Utils.psm1, sem provocar falha se este
        nao existir ou nao puder ser carregado.

        .DESCRIPTION
        Esta funcao privada procura um ficheiro "Utils.psm1" na mesma pasta
        onde o modulo Markdown.psm1 esta localizado. Se o ficheiro existir,
        tenta importa-lo. Qualquer erro durante esta operacao e silenciado
        (apenas registado como aviso em modo verbose), pois a integracao e
        estritamente opcional e nunca deve interromper o carregamento deste
        modulo.

        .OUTPUTS
        System.Boolean
        Devolve $true se o modulo Utils.psm1 foi importado com sucesso e a
        funcao de erro conhecida esta disponivel; caso contrario $false.
    #>
    [CmdletBinding()]
    [OutputType([System.Boolean])]
    param()

    $script:OpfUtilsErrorCommand = $null

    try {
        $moduleRoot = $PSScriptRoot
        if ([string]::IsNullOrWhiteSpace($moduleRoot)) {
            return $false
        }

        $utilsPath = Join-Path -Path $moduleRoot -ChildPath 'Utils.psm1'

        if (-not (Test-Path -LiteralPath $utilsPath -PathType Leaf)) {
            Write-Verbose -Message 'Modulo Utils.psm1 nao encontrado. A integracao opcional sera ignorada.'
            return $false
        }

        $utilsModule = Import-Module -Name $utilsPath -ErrorAction Stop -Force -PassThru -DisableNameChecking

        if ($null -eq $utilsModule) {
            Write-Verbose -Message 'Utils.psm1 nao pode ser resolvido como modulo importado.'
            return $false
        }

        $command = $utilsModule.ExportedFunctions[$script:OpfUtilsErrorFunctionName]
        if ($null -ne $command) {
            $script:OpfUtilsErrorCommand = $command
            Write-Verbose -Message 'Integracao opcional com Utils.psm1 estabelecida com sucesso.'
            return $true
        }

        Write-Verbose -Message 'Utils.psm1 foi importado, mas a funcao de erro esperada nao esta disponivel.'
        return $false
    }
    catch {
        Write-Verbose -Message ('Falha ao tentar integrar Utils.psm1 (ignorado): {0}' -f $_.Exception.Message)
        return $false
    }
}

function Write-OpfUtilsNotification {
    <#
        .SYNOPSIS
        Encaminha uma mensagem de erro para o modulo Utils.psm1, quando a
        integracao opcional esta disponivel.

        .DESCRIPTION
        Isolado do fluxo principal de erro de forma deliberada: uma falha
        nesta camada opcional nunca pode alterar o erro que o consumidor
        recebe.

        .PARAMETER Message
        Mensagem a encaminhar.
    #>
    [CmdletBinding()]
    [OutputType([System.Void])]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [System.String]
        $Message
    )

    if (-not $script:OpfUtilsAvailable -or $null -eq $script:OpfUtilsErrorCommand) {
        return
    }

    try {
        & $script:OpfUtilsErrorCommand -Message $Message -ErrorAction SilentlyContinue
    }
    catch {
        Write-Verbose -Message ('A funcao de erro do Utils.psm1 falhou e foi ignorada: {0}' -f $_.Exception.Message)
    }
}

function Invoke-OpfErrorHandler {
    <#
        .SYNOPSIS
        Ponto central e unico de tratamento de erros do modulo Markdown.

        .DESCRIPTION
        Constroi um ErrorRecord com a mensagem de contexto fornecida,
        preservando o erro original como excecao interna quando existe, e
        termina a execucao do comando chamador.

        Todas as falhas do modulo sao terminantes e usam esta funcao, pelo
        que o comportamento de erro e uniforme em toda a superficie publica.
        O FullyQualifiedErrorId e sempre 'OpfMarkdownError'.

        Quando a integracao opcional com Utils.psm1 esta disponivel, a
        mensagem e adicionalmente encaminhada para esse modulo. Essa camada
        e estritamente suplementar e nunca substitui o erro devolvido.

        .PARAMETER Message
        Mensagem de erro legivel a comunicar.

        .PARAMETER ErrorRecord
        Registo de erro original (ErrorRecord), quando disponivel. A sua
        excecao e preservada como excecao interna.

        .PARAMETER Category
        Categoria do erro. Por omissao NotSpecified.

        .PARAMETER Cmdlet
        Referencia ao $PSCmdlet do comando chamador, para que o erro seja
        reportado na posicao correta do comando publico e nao dentro desta
        funcao privada.

        .PARAMETER TargetObject
        Objeto associado ao erro.
    #>
    [CmdletBinding()]
    [OutputType([System.Void])]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [System.String]
        $Message,

        [Parameter(Mandatory = $false)]
        [System.Management.Automation.ErrorRecord]
        $ErrorRecord,

        [Parameter(Mandatory = $false)]
        [System.Management.Automation.ErrorCategory]
        $Category = [System.Management.Automation.ErrorCategory]::NotSpecified,

        [Parameter(Mandatory = $false)]
        [System.Management.Automation.PSCmdlet]
        $Cmdlet,

        [Parameter(Mandatory = $false)]
        [System.Object]
        $TargetObject
    )

    Write-OpfUtilsNotification -Message $Message

    if ($PSBoundParameters.ContainsKey('ErrorRecord') -and $null -ne $ErrorRecord) {
        $exception = [System.Exception]::new($Message, $ErrorRecord.Exception)

        if (-not $PSBoundParameters.ContainsKey('Category')) {
            $Category = $ErrorRecord.CategoryInfo.Category
        }

        if (-not $PSBoundParameters.ContainsKey('TargetObject')) {
            $TargetObject = $ErrorRecord.TargetObject
        }
    }
    else {
        $exception = [System.Exception]::new($Message)
    }

    $record = [System.Management.Automation.ErrorRecord]::new(
        $exception,
        $script:OpfMarkdownErrorId,
        $Category,
        $TargetObject
    )

    if ($PSBoundParameters.ContainsKey('Cmdlet') -and $null -ne $Cmdlet) {
        $Cmdlet.ThrowTerminatingError($record)
    }

    throw $record
}

#endregion Private Functions - Utils Integration

#region Private Functions - Document Model

function New-OpfMarkdownDocumentObject {
    <#
        .SYNOPSIS
        Cria o objeto interno que representa um documento Markdown.

        .DESCRIPTION
        Constroi uma instancia de OpfMarkdownDocument com um
        System.Text.StringBuilder interno e metadados de suporte, e regista
        o nome de tipo 'Opf.Markdown.Document' para efeitos de formatacao e
        de verificacoes de tipo por parte dos consumidores.

        Este objeto e devolvido por New-MarkdownDocument e consumido por
        todas as funcoes Add-Markdown*. Apenas cria um objeto em memoria;
        nao altera qualquer estado persistente do sistema, pelo que a
        implementacao de ShouldProcess nao e aplicavel.

        .PARAMETER Title
        Titulo opcional associado ao documento (uso informativo/metadados).

        .OUTPUTS
        OpfMarkdownDocument
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '', Justification = 'Cria apenas um objeto em memoria; nao altera estado persistente do sistema.')]
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $false)]
        [AllowEmptyString()]
        [AllowNull()]
        [System.String]
        $Title = ''
    )

    $document = [OpfMarkdownDocument]::new($Title)
    $document.PSObject.TypeNames.Insert(0, 'Opf.Markdown.Document')

    return $document
}

function Assert-OpfMarkdownDocument {
    <#
        .SYNOPSIS
        Valida que o objeto recebido e um documento Markdown OPF valido.

        .DESCRIPTION
        Verifica se o objeto de entrada tem a forma esperada (contem uma
        propriedade Builder do tipo StringBuilder). A validacao e estrutural
        e nao por tipo, o que mantem a compatibilidade com objetos de
        documento produzidos por versoes anteriores deste modulo.

        Lanca um erro terminante centralizado caso a validacao falhe.

        .PARAMETER Document
        Objeto a validar.

        .PARAMETER Cmdlet
        $PSCmdlet do comando chamador, para reporte do erro na posicao
        correta.
    #>
    [CmdletBinding()]
    [OutputType([System.Void])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowNull()]
        $Document,

        [Parameter(Mandatory = $false)]
        [System.Management.Automation.PSCmdlet]
        $Cmdlet
    )

    if ($null -eq $Document) {
        Invoke-OpfErrorHandler -Message 'O documento Markdown fornecido e nulo.' -Category InvalidArgument -Cmdlet $Cmdlet -TargetObject $Document
    }

    $hasBuilder = $false
    try {
        $hasBuilder = ($null -ne $Document.PSObject.Properties['Builder']) -and
                      ($Document.Builder -is [System.Text.StringBuilder])
    }
    catch {
        $hasBuilder = $false
    }

    if (-not $hasBuilder) {
        Invoke-OpfErrorHandler -Message 'O objeto fornecido nao e um documento Markdown OPF valido. Use New-MarkdownDocument ou Open-MarkdownDocument.' -Category InvalidArgument -Cmdlet $Cmdlet -TargetObject $Document
    }
}

function Get-OpfDocumentNewLine {
    <#
        .SYNOPSIS
        Devolve a sequencia de fim de linha a usar num documento.

        .DESCRIPTION
        Le a propriedade NewLine do documento quando esta existe. Documentos
        criados por versoes anteriores do modulo nao a possuem, pelo que a
        funcao recorre a [System.Environment]::NewLine nesse caso.

        .PARAMETER Document
        Documento de origem.

        .OUTPUTS
        System.String
    #>
    [CmdletBinding()]
    [OutputType([System.String])]
    param(
        [Parameter(Mandatory = $true)]
        $Document
    )

    if ($null -ne $Document.PSObject.Properties['NewLine']) {
        $newLine = $Document.NewLine
        if (-not [string]::IsNullOrEmpty($newLine)) {
            return $newLine
        }
    }

    return [System.Environment]::NewLine
}

#endregion Private Functions - Document Model

#region Private Functions - Composition Primitives

function Add-OpfText {
    <#
        .SYNOPSIS
        Acrescenta texto ao documento sem terminar a linha.

        .DESCRIPTION
        Primitiva de composicao. Toda a escrita no StringBuilder do
        documento passa por esta funcao ou pelas que nela assentam, de modo
        a existir um unico ponto de contacto com o motor interno.

        .PARAMETER Document
        Documento de destino.

        .PARAMETER Text
        Texto a acrescentar.
    #>
    [CmdletBinding()]
    [OutputType([System.Void])]
    param(
        [Parameter(Mandatory = $true)]
        $Document,

        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [System.String]
        $Text
    )

    $null = $Document.Builder.Append($Text)
}

function Add-OpfLine {
    <#
        .SYNOPSIS
        Acrescenta uma linha ao documento.

        .DESCRIPTION
        Escreve o texto indicado seguido do fim de linha do documento. Sem
        parametro Text escreve apenas uma linha em branco.

        .PARAMETER Document
        Documento de destino.

        .PARAMETER Text
        Texto da linha. Por omissao, linha vazia.
    #>
    [CmdletBinding()]
    [OutputType([System.Void])]
    param(
        [Parameter(Mandatory = $true)]
        $Document,

        [Parameter(Mandatory = $false)]
        [AllowEmptyString()]
        [System.String]
        $Text = ''
    )

    $null = $Document.Builder.Append($Text).Append((Get-OpfDocumentNewLine -Document $Document))
}

function Add-OpfBlock {
    <#
        .SYNOPSIS
        Acrescenta um bloco de linhas seguido de uma linha em branco.

        .DESCRIPTION
        Concentra o padrao dominante do modulo: escrever uma ou mais linhas
        e terminar com a linha em branco que separa blocos em Markdown.

        .PARAMETER Document
        Documento de destino.

        .PARAMETER Line
        Linhas a escrever, pela ordem fornecida.
    #>
    [CmdletBinding()]
    [OutputType([System.Void])]
    param(
        [Parameter(Mandatory = $true)]
        $Document,

        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [System.String[]]
        $Line
    )

    $newLine = Get-OpfDocumentNewLine -Document $Document

    foreach ($item in $Line) {
        $null = $Document.Builder.Append($item).Append($newLine)
    }

    $null = $Document.Builder.Append($newLine)
}

#endregion Private Functions - Composition Primitives

#region Private Functions - Formatting

function Get-OpfEscapedText {
    <#
        .SYNOPSIS
        Efetua o escaping de caracteres especiais de Markdown num texto simples.

        .DESCRIPTION
        Escapa os caracteres com significado especial em Markdown (por
        exemplo: * _ ` [ ] ( ) # + - . ! | \ < > { }) prefixando-os com uma
        barra invertida, de forma a que o texto original seja apresentado
        literalmente quando renderizado.

        A substituicao e feita numa unica passagem sobre o texto, o que
        garante que as barras invertidas introduzidas pelo proprio escaping
        nunca sao reescapadas.

        .PARAMETER Text
        Texto a escapar.

        .OUTPUTS
        System.String
    #>
    [CmdletBinding()]
    [OutputType([System.String])]
    param(
        [Parameter(Mandatory = $false)]
        [AllowEmptyString()]
        [AllowNull()]
        [System.String]
        $Text = ''
    )

    if ([string]::IsNullOrEmpty($Text)) {
        return ''
    }

    return [regex]::Replace($Text, $script:OpfMarkdownEscapePattern, '\$1')
}

function Get-OpfSanitizedSingleLine {
    <#
        .SYNOPSIS
        Remove quebras de linha de um texto, tornando-o seguro para uso em
        contextos de uma unica linha (por exemplo celulas de tabela).

        .DESCRIPTION
        Converte qualquer quebra de linha num espaco e escapa o caracter de
        barra vertical, que delimita colunas em tabelas Markdown.

        .PARAMETER Text
        Texto a sanitizar.

        .OUTPUTS
        System.String
    #>
    [CmdletBinding()]
    [OutputType([System.String])]
    param(
        [Parameter(Mandatory = $false)]
        [AllowEmptyString()]
        [AllowNull()]
        [System.String]
        $Text = ''
    )

    if ([string]::IsNullOrEmpty($Text)) {
        return ''
    }

    $sanitized = $Text -replace '\r\n|\r|\n', ' '

    return $sanitized.Replace('|', '\|')
}

function Get-OpfSlug {
    <#
        .SYNOPSIS
        Gera um "slug" no formato usado por anchors de Markdown (por exemplo
        para construir uma tabela de conteudos), a partir de um texto de
        cabecalho.

        .DESCRIPTION
        Aplica a convencao usada pelos renderizadores GFM: converte para
        minusculas, remove pontuacao, e substitui espacos por hifenes.

        Letras e digitos sao preservados independentemente do alfabeto, pelo
        que cabecalhos acentuados produzem ancoras validas.

        .PARAMETER Text
        Texto do cabecalho de origem.

        .OUTPUTS
        System.String
    #>
    [CmdletBinding()]
    [OutputType([System.String])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [System.String]
        $Text
    )

    if ([string]::IsNullOrEmpty($Text)) {
        return ''
    }

    $slug = $Text.ToLowerInvariant()
    $slug = [regex]::Replace($slug, '[^\p{L}\p{N}\s\-_]', '')
    $slug = $slug.Trim()

    return ($slug -replace '\s+', '-')
}

function Get-OpfInlineLink {
    <#
        .SYNOPSIS
        Constroi a representacao Markdown de uma ligacao ou de uma imagem.

        .DESCRIPTION
        Fonte unica do formato "[Texto](Url)" e "![Texto](Url)", com titulo
        opcional. Usada por Add-MarkdownLink, Add-MarkdownImage e
        Add-MarkdownBadge, que assim partilham exatamente as mesmas regras
        de composicao.

        .PARAMETER Text
        Texto visivel da ligacao, ou texto alternativo da imagem.

        .PARAMETER Url
        Endereco de destino.

        .PARAMETER Title
        Titulo opcional (tooltip). Ignorado quando vazio.

        .PARAMETER AsImage
        Quando presente, produz a forma de imagem, prefixada por "!".

        .OUTPUTS
        System.String
    #>
    [CmdletBinding()]
    [OutputType([System.String])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [System.String]
        $Text,

        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [System.String]
        $Url,

        [Parameter(Mandatory = $false)]
        [AllowEmptyString()]
        [AllowNull()]
        [System.String]
        $Title,

        [Parameter(Mandatory = $false)]
        [System.Management.Automation.SwitchParameter]
        $AsImage
    )

    $builder = [System.Text.StringBuilder]::new()

    if ($AsImage) {
        $null = $builder.Append('!')
    }

    $null = $builder.Append('[').Append($Text).Append('](').Append($Url)

    if (-not [string]::IsNullOrWhiteSpace($Title)) {
        $null = $builder.Append(' "').Append($Title).Append('"')
    }

    $null = $builder.Append(')')

    return $builder.ToString()
}

function Get-OpfCodeFence {
    <#
        .SYNOPSIS
        Determina a cerca a usar num bloco de codigo.

        .DESCRIPTION
        Devolve uma sequencia de crases com comprimento suficiente para
        delimitar o codigo fornecido. Codigo que contenha cercas internas
        recebe uma cerca mais longa, conforme exigido pela especificacao
        CommonMark, o que impede que o bloco termine prematuramente.

        .PARAMETER Code
        Codigo a delimitar.

        .OUTPUTS
        System.String
    #>
    [CmdletBinding()]
    [OutputType([System.String])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [System.String]
        $Code
    )

    $longest = 0
    foreach ($match in [regex]::Matches($Code, '`+')) {
        if ($match.Length -gt $longest) {
            $longest = $match.Length
        }
    }

    $length = 3
    if ($longest -ge 3) {
        $length = $longest + 1
    }

    return ('`' * $length)
}

function Get-OpfTableSeparator {
    <#
        .SYNOPSIS
        Constroi a linha separadora de uma tabela Markdown.

        .DESCRIPTION
        Traduz os alinhamentos pedidos para a notacao de separador do GFM.
        Colunas sem alinhamento explicito usam 'Left'.

        .PARAMETER ColumnCount
        Numero de colunas da tabela.

        .PARAMETER Alignment
        Alinhamentos por coluna. Quando omitido, todas as colunas usam
        alinhamento a esquerda.

        .OUTPUTS
        System.String
    #>
    [CmdletBinding()]
    [OutputType([System.String])]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateRange(1, 2147483647)]
        [System.Int32]
        $ColumnCount,

        [Parameter(Mandatory = $false)]
        [AllowNull()]
        [System.String[]]
        $Alignment
    )

    $parts = [System.Collections.Generic.List[System.String]]::new()

    for ($i = 0; $i -lt $ColumnCount; $i++) {
        $align = 'Left'
        if ($null -ne $Alignment -and $i -lt $Alignment.Count) {
            $align = $Alignment[$i]
        }

        switch ($align) {
            'Center' { $parts.Add(':---:') }
            'Right' { $parts.Add('---:') }
            default { $parts.Add('---') }
        }
    }

    return (Get-OpfTableRow -Cell $parts)
}

function Get-OpfTableRow {
    <#
        .SYNOPSIS
        Constroi uma linha de tabela Markdown a partir das suas celulas.

        .DESCRIPTION
        Fonte unica do formato "| a | b |" usado pelo cabecalho, pelo
        separador e pelas linhas de dados.

        .PARAMETER Cell
        Valores das celulas, ja sanitizados.

        .OUTPUTS
        System.String
    #>
    [CmdletBinding()]
    [OutputType([System.String])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [System.String[]]
        $Cell
    )

    return ('| {0} |' -f ($Cell -join ' | '))
}

#endregion Private Functions - Formatting

#region Public Functions - Lifecycle

function New-MarkdownDocument {
    <#
        .SYNOPSIS
        Cria um novo documento Markdown vazio.

        .DESCRIPTION
        Inicializa um objeto de documento Markdown baseado em
        System.Text.StringBuilder, pronto para receber conteudo atraves das
        funcoes Add-Markdown*. Opcionalmente aceita um titulo, que e
        adicionado automaticamente como cabecalho de nivel 1.

        O objeto devolvido representa o seu proprio conteudo: $doc.ToString()
        devolve o documento Markdown gerado.

        .PARAMETER Title
        Titulo opcional do documento. Se fornecido, e escrito imediatamente
        como um cabecalho de nivel 1 no topo do documento.

        .EXAMPLE
        $doc = New-MarkdownDocument -Title 'Relatorio Mensal'
        Cria um novo documento com o cabecalho "# Relatorio Mensal".

        .EXAMPLE
        $doc = New-MarkdownDocument
        Cria um documento vazio, sem cabecalho inicial.

        .EXAMPLE
        $doc = New-MarkdownDocument -Title 'Notas'
        $doc.ToString()
        Devolve o texto Markdown acumulado no documento.

        .OUTPUTS
        OpfMarkdownDocument

        .NOTES
        O objeto devolvido continua a expor a propriedade Builder, do tipo
        System.Text.StringBuilder, por compatibilidade com codigo existente.
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '', Justification = 'Cria apenas um objeto em memoria; nao altera estado persistente do sistema.')]
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $false, Position = 0)]
        [AllowEmptyString()]
        [AllowNull()]
        [System.String]
        $Title
    )

    try {
        $document = New-OpfMarkdownDocumentObject -Title $Title

        if (-not [string]::IsNullOrWhiteSpace($Title)) {
            $null = Add-MarkdownHeading -Document $document -Text $Title -Level 1
        }

        return $document
    }
    catch {
        Invoke-OpfErrorHandler -Message 'Falha ao criar um novo documento Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
    }
}

function Open-MarkdownDocument {
    <#
        .SYNOPSIS
        Abre um ficheiro Markdown existente e carrega o seu conteudo para um
        novo objeto de documento OPF.

        .DESCRIPTION
        Le o conteudo textual de um ficheiro .md existente no disco e
        constroi um objeto de documento Markdown OPF cujo StringBuilder
        interno e inicializado com esse conteudo, permitindo continuar a
        editar o documento atraves das funcoes Add-Markdown*.

        O titulo do documento e definido a partir do nome do ficheiro, sem
        extensao.

        .PARAMETER Path
        Caminho para o ficheiro Markdown a abrir.

        .PARAMETER Encoding
        Codificacao a usar na leitura do ficheiro. Por omissao "UTF8".

        .EXAMPLE
        $doc = Open-MarkdownDocument -Path 'C:\docs\relatorio.md'

        .EXAMPLE
        Get-ChildItem *.md | Open-MarkdownDocument
        Abre cada ficheiro Markdown da pasta atual.

        .OUTPUTS
        OpfMarkdownDocument

        .NOTES
        O valor 'UTF7' mantem-se no conjunto de valores aceites por
        compatibilidade com a API publica, embora esteja obsoleto no
        PowerShell 7 e nao deva ser usado em codigo novo.
    #>
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        [ValidateNotNullOrEmpty()]
        [System.String]
        $Path,

        [Parameter(Mandatory = $false)]
        [ValidateSet('UTF8', 'ASCII', 'Unicode', 'UTF7', 'UTF32', 'Default')]
        [System.String]
        $Encoding = 'UTF8'
    )

    process {
        try {
            if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
                Invoke-OpfErrorHandler -Message ('O ficheiro "{0}" nao foi encontrado.' -f $Path) -Category ObjectNotFound -Cmdlet $PSCmdlet -TargetObject $Path
            }

            $resolvedPath = (Resolve-Path -LiteralPath $Path -ErrorAction Stop).Path

            $content = Get-Content -LiteralPath $resolvedPath -Raw -Encoding $Encoding -ErrorAction Stop

            if ($null -eq $content) {
                $content = ''
            }

            $document = New-OpfMarkdownDocumentObject -Title ([System.IO.Path]::GetFileNameWithoutExtension($resolvedPath))
            Add-OpfText -Document $document -Text $content

            return $document
        }
        catch {
            Invoke-OpfErrorHandler -Message ('Falha ao abrir o documento Markdown "{0}".' -f $Path) -ErrorRecord $_ -Cmdlet $PSCmdlet -TargetObject $Path
        }
    }
}

function Save-MarkdownDocument {
    <#
        .SYNOPSIS
        Grava o conteudo atual de um documento Markdown num ficheiro.

        .DESCRIPTION
        Escreve o conteudo textual acumulado no documento para um ficheiro
        no disco. Por predefinicao usa UTF-8 sem BOM, com compatibilidade
        garantida tanto em Windows PowerShell 5.1 como em PowerShell 7+.

        As pastas intermedias em falta sao criadas. Caminhos relativos sao
        resolvidos em relacao a localizacao atual do PowerShell.

        .PARAMETER Document
        Objeto de documento Markdown, criado por New-MarkdownDocument ou
        Open-MarkdownDocument.

        .PARAMETER Path
        Caminho de destino do ficheiro a gravar.

        .PARAMETER Force
        Sobrescreve o ficheiro de destino se ja existir.

        .PARAMETER NoNewLine
        Quando presente, nao adiciona uma quebra de linha final ao gravar.

        .EXAMPLE
        $doc | Save-MarkdownDocument -Path 'C:\docs\saida.md' -Force

        .EXAMPLE
        Save-MarkdownDocument -Document $doc -Path './relatorio.md' -WhatIf
        Mostra a operacao de gravacao sem a executar.

        .OUTPUTS
        System.IO.FileInfo
    #>
    [CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Low')]
    [OutputType([System.IO.FileInfo])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        $Document,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateNotNullOrEmpty()]
        [System.String]
        $Path,

        [Parameter(Mandatory = $false)]
        [System.Management.Automation.SwitchParameter]
        $Force,

        [Parameter(Mandatory = $false)]
        [System.Management.Automation.SwitchParameter]
        $NoNewLine
    )

    process {
        try {
            Assert-OpfMarkdownDocument -Document $Document -Cmdlet $PSCmdlet

            $targetPath = $PSCmdlet.GetUnresolvedProviderPathFromPSPath($Path)

            if ((Test-Path -LiteralPath $targetPath -PathType Leaf) -and -not $Force) {
                Invoke-OpfErrorHandler -Message ('O ficheiro "{0}" ja existe. Use -Force para sobrescrever.' -f $Path) -Category ResourceExists -Cmdlet $PSCmdlet -TargetObject $Path
            }

            if (-not $PSCmdlet.ShouldProcess($targetPath, 'Save-MarkdownDocument')) {
                return
            }

            $text = $Document.Builder.ToString()
            if (-not $NoNewLine -and -not $text.EndsWith([System.Environment]::NewLine) -and -not $text.EndsWith("`n")) {
                $text += [System.Environment]::NewLine
            }

            $parentDir = Split-Path -Path $targetPath -Parent
            if (-not [string]::IsNullOrWhiteSpace($parentDir) -and -not (Test-Path -LiteralPath $parentDir -PathType Container)) {
                $null = New-Item -Path $parentDir -ItemType Directory -Force -ErrorAction Stop
            }

            $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
            [System.IO.File]::WriteAllText($targetPath, $text, $utf8NoBom)

            return Get-Item -LiteralPath $targetPath
        }
        catch {
            Invoke-OpfErrorHandler -Message ('Falha ao gravar o documento Markdown em "{0}".' -f $Path) -ErrorRecord $_ -Cmdlet $PSCmdlet -TargetObject $Path
        }
    }
}

function Clear-MarkdownDocument {
    <#
        .SYNOPSIS
        Limpa todo o conteudo de um documento Markdown existente.

        .DESCRIPTION
        Remove todo o texto acumulado no documento, reiniciando os
        contadores de metadados internos (por exemplo HeadingCount), mas
        mantendo o mesmo objeto de documento (a mesma referencia),
        permitindo continuar a usa-lo em pipeline.

        .PARAMETER Document
        Objeto de documento Markdown a limpar.

        .EXAMPLE
        $doc = Clear-MarkdownDocument -Document $doc

        .EXAMPLE
        $doc | Clear-MarkdownDocument | Add-MarkdownHeading -Text 'Novo inicio'

        .OUTPUTS
        OpfMarkdownDocument
    #>
    [CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        $Document
    )

    process {
        try {
            Assert-OpfMarkdownDocument -Document $Document -Cmdlet $PSCmdlet

            if (-not $PSCmdlet.ShouldProcess('Documento Markdown', 'Clear-MarkdownDocument')) {
                return $Document
            }

            $null = $Document.Builder.Clear()
            $Document.HeadingCount = 0
            $Document.Metadata.Clear()

            return $Document
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao limpar o documento Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

#endregion Public Functions - Lifecycle

#region Public Functions - Content Blocks

function Add-MarkdownHeading {
    <#
        .SYNOPSIS
        Adiciona um cabecalho ao documento Markdown.

        .DESCRIPTION
        Escreve uma linha de cabecalho Markdown (usando cardinais "#") com o
        nivel indicado (1 a 6), seguida de uma linha em branco, e incrementa
        o contador HeadingCount do documento.

        O texto e escrito tal como fornecido, sem escaping, o que permite
        incluir formatacao Markdown no proprio cabecalho. Use
        Escape-MarkdownText quando o texto vier de uma fonte externa.

        .PARAMETER Document
        Objeto de documento Markdown de destino.

        .PARAMETER Text
        Texto do cabecalho.

        .PARAMETER Level
        Nivel do cabecalho, entre 1 e 6. Por omissao 1.

        .EXAMPLE
        $doc = Add-MarkdownHeading -Document $doc -Text 'Introducao' -Level 2

        .EXAMPLE
        $doc | Add-MarkdownHeading -Text 'Anexos' -Level 3

        .OUTPUTS
        OpfMarkdownDocument
    #>
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        $Document,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateNotNullOrEmpty()]
        [System.String]
        $Text,

        [Parameter(Mandatory = $false, Position = 2)]
        [ValidateRange(1, 6)]
        [System.Int32]
        $Level = 1
    )

    process {
        try {
            Assert-OpfMarkdownDocument -Document $Document -Cmdlet $PSCmdlet

            Add-OpfBlock -Document $Document -Line ('{0} {1}' -f ('#' * $Level), $Text)

            $Document.HeadingCount = $Document.HeadingCount + 1

            return $Document
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao adicionar um cabecalho ao documento Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

function Add-MarkdownParagraph {
    <#
        .SYNOPSIS
        Adiciona um paragrafo de texto ao documento Markdown.

        .DESCRIPTION
        Escreve o texto fornecido seguido de duas quebras de linha, de forma
        a garantir a separacao correta entre paragrafos em Markdown.

        .PARAMETER Document
        Objeto de documento Markdown de destino.

        .PARAMETER Text
        Texto do paragrafo.

        .EXAMPLE
        $doc = Add-MarkdownParagraph -Document $doc -Text 'Este e um paragrafo de exemplo.'

        .OUTPUTS
        OpfMarkdownDocument
    #>
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        $Document,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateNotNullOrEmpty()]
        [System.String]
        $Text
    )

    process {
        try {
            Assert-OpfMarkdownDocument -Document $Document -Cmdlet $PSCmdlet

            Add-OpfBlock -Document $Document -Line $Text

            return $Document
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao adicionar um paragrafo ao documento Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

function Add-MarkdownHorizontalRule {
    <#
        .SYNOPSIS
        Adiciona uma linha horizontal (separador) ao documento Markdown.

        .DESCRIPTION
        Escreve uma linha horizontal usando tres hifens, seguida de uma
        linha em branco.

        .PARAMETER Document
        Objeto de documento Markdown de destino.

        .EXAMPLE
        $doc = Add-MarkdownHorizontalRule -Document $doc

        .OUTPUTS
        OpfMarkdownDocument
    #>
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        $Document
    )

    process {
        try {
            Assert-OpfMarkdownDocument -Document $Document -Cmdlet $PSCmdlet

            Add-OpfBlock -Document $Document -Line '---'

            return $Document
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao adicionar uma linha horizontal ao documento Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

function Add-MarkdownLineBreak {
    <#
        .SYNOPSIS
        Adiciona uma quebra de linha explicita ao documento Markdown.

        .DESCRIPTION
        Escreve uma quebra de linha "dura" (dois espacos seguidos de nova
        linha), conforme a especificacao Markdown para forcar uma quebra de
        linha dentro do mesmo paragrafo. O parametro Count permite repetir a
        operacao.

        .PARAMETER Document
        Objeto de documento Markdown de destino.

        .PARAMETER Count
        Numero de quebras de linha a adicionar. Por omissao 1.

        .EXAMPLE
        $doc = Add-MarkdownLineBreak -Document $doc

        .EXAMPLE
        $doc = Add-MarkdownLineBreak -Document $doc -Count 2

        .OUTPUTS
        OpfMarkdownDocument
    #>
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        $Document,

        [Parameter(Mandatory = $false, Position = 1)]
        [ValidateRange(1, 100)]
        [System.Int32]
        $Count = 1
    )

    process {
        try {
            Assert-OpfMarkdownDocument -Document $Document -Cmdlet $PSCmdlet

            for ($i = 0; $i -lt $Count; $i++) {
                Add-OpfLine -Document $Document -Text '  '
            }

            return $Document
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao adicionar uma quebra de linha ao documento Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

function Add-MarkdownList {
    <#
        .SYNOPSIS
        Adiciona uma lista nao ordenada (bullets) ao documento Markdown.

        .DESCRIPTION
        Escreve cada item fornecido como uma linha de lista nao ordenada,
        usando o hifen como marcador. Suporta indentacao simples atraves do
        parametro IndentLevel.

        .PARAMETER Document
        Objeto de documento Markdown de destino.

        .PARAMETER Items
        Coleccao de textos a adicionar como itens de lista.

        .PARAMETER IndentLevel
        Nivel de indentacao (cada nivel corresponde a dois espacos). Por
        omissao 0.

        .EXAMPLE
        $doc = Add-MarkdownList -Document $doc -Items @('Primeiro item', 'Segundo item')

        .EXAMPLE
        $doc = Add-MarkdownList -Document $doc -Items @('Subitem') -IndentLevel 1

        .OUTPUTS
        OpfMarkdownDocument
    #>
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        $Document,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateNotNull()]
        [System.String[]]
        $Items,

        [Parameter(Mandatory = $false)]
        [ValidateRange(0, 10)]
        [System.Int32]
        $IndentLevel = 0
    )

    process {
        try {
            Assert-OpfMarkdownDocument -Document $Document -Cmdlet $PSCmdlet

            $indent = '  ' * $IndentLevel

            $lines = foreach ($item in $Items) {
                '{0}- {1}' -f $indent, $item
            }

            Add-OpfBlock -Document $Document -Line ([System.String[]]@($lines))

            return $Document
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao adicionar uma lista ao documento Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

function Add-MarkdownNumberedList {
    <#
        .SYNOPSIS
        Adiciona uma lista numerada (ordenada) ao documento Markdown.

        .DESCRIPTION
        Escreve cada item fornecido como uma linha de lista ordenada,
        numerando sequencialmente a partir de 1 (ou do valor de StartNumber).

        .PARAMETER Document
        Objeto de documento Markdown de destino.

        .PARAMETER Items
        Coleccao de textos a adicionar como itens de lista numerada.

        .PARAMETER StartNumber
        Numero inicial da lista. Por omissao 1.

        .EXAMPLE
        $doc = Add-MarkdownNumberedList -Document $doc -Items @('Passo um', 'Passo dois')

        .EXAMPLE
        $doc = Add-MarkdownNumberedList -Document $doc -Items @('Quarto passo') -StartNumber 4

        .OUTPUTS
        OpfMarkdownDocument
    #>
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        $Document,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateNotNull()]
        [System.String[]]
        $Items,

        [Parameter(Mandatory = $false)]
        [ValidateRange(0, 2147483647)]
        [System.Int32]
        $StartNumber = 1
    )

    process {
        try {
            Assert-OpfMarkdownDocument -Document $Document -Cmdlet $PSCmdlet

            $number = $StartNumber
            $lines = foreach ($item in $Items) {
                '{0}. {1}' -f $number, $item
                $number++
            }

            Add-OpfBlock -Document $Document -Line ([System.String[]]@($lines))

            return $Document
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao adicionar uma lista numerada ao documento Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

function Add-MarkdownChecklist {
    <#
        .SYNOPSIS
        Adiciona uma lista de verificacao (checklist) ao documento Markdown.

        .DESCRIPTION
        Escreve cada item fornecido como uma linha de checklist Markdown
        (formato compativel com GitHub Flavored Markdown), marcando cada
        item como concluido ou pendente de acordo com a coleccao de estados
        fornecida.

        .PARAMETER Document
        Objeto de documento Markdown de destino.

        .PARAMETER Items
        Coleccao de textos a adicionar como itens da checklist.

        .PARAMETER Checked
        Coleccao de valores booleanos indicando o estado de cada item, na
        mesma ordem de Items. Se omitido, todos os itens sao marcados como
        nao concluidos. Se fornecido, deve ter o mesmo numero de elementos
        que Items.

        .EXAMPLE
        $doc = Add-MarkdownChecklist -Document $doc -Items @('Tarefa A', 'Tarefa B') -Checked @($true, $false)

        .EXAMPLE
        $doc = Add-MarkdownChecklist -Document $doc -Items @('Por fazer')

        .OUTPUTS
        OpfMarkdownDocument
    #>
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        $Document,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateNotNull()]
        [System.String[]]
        $Items,

        [Parameter(Mandatory = $false, Position = 2)]
        [ValidateNotNull()]
        [System.Boolean[]]
        $Checked
    )

    process {
        try {
            Assert-OpfMarkdownDocument -Document $Document -Cmdlet $PSCmdlet

            $hasChecked = $PSBoundParameters.ContainsKey('Checked')

            if ($hasChecked -and $Checked.Count -ne $Items.Count) {
                Invoke-OpfErrorHandler -Message 'O numero de elementos em Checked tem de ser igual ao numero de elementos em Items.' -Category InvalidArgument -Cmdlet $PSCmdlet
            }

            $lines = for ($i = 0; $i -lt $Items.Count; $i++) {
                $marker = '[ ]'
                if ($hasChecked -and $Checked[$i]) {
                    $marker = '[x]'
                }

                '- {0} {1}' -f $marker, $Items[$i]
            }

            Add-OpfBlock -Document $Document -Line ([System.String[]]@($lines))

            return $Document
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao adicionar uma checklist ao documento Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

function Add-MarkdownTable {
    <#
        .SYNOPSIS
        Adiciona uma tabela Markdown ao documento.

        .DESCRIPTION
        Escreve uma tabela Markdown a partir de uma coleccao de cabecalhos e
        uma coleccao de linhas (cada linha e uma coleccao de valores de
        celula). Efetua o escaping do caracter "|" e a remocao de quebras de
        linha internas em cada celula, garantindo uma tabela valida.

        A tabela e integralmente validada antes de qualquer escrita, pelo
        que uma linha malformada nao deixa uma tabela incompleta no
        documento.

        .PARAMETER Document
        Objeto de documento Markdown de destino.

        .PARAMETER Headers
        Coleccao de nomes de coluna.

        .PARAMETER Rows
        Coleccao de linhas. Cada linha deve ser um array/coleccao de valores
        com o mesmo numero de elementos que Headers.

        .PARAMETER Alignment
        Alinhamento opcional das colunas: 'Left', 'Center', 'Right'. Se
        fornecido, deve ter o mesmo numero de elementos que Headers. Por
        omissao usa 'Left' para todas as colunas.

        .EXAMPLE
        $doc = Add-MarkdownTable -Document $doc -Headers @('Nome','Idade') -Rows @(@('Ana','30'), @('Rui','25'))

        .EXAMPLE
        $doc = Add-MarkdownTable -Document $doc -Headers @('Chave','Valor') -Rows @(@('a','1')) -Alignment @('Left','Right')

        .OUTPUTS
        OpfMarkdownDocument
    #>
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        $Document,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateNotNull()]
        [System.String[]]
        $Headers,

        [Parameter(Mandatory = $true, Position = 2)]
        [ValidateNotNull()]
        [System.Object[]]
        $Rows,

        [Parameter(Mandatory = $false)]
        [ValidateSet('Left', 'Center', 'Right')]
        [System.String[]]
        $Alignment
    )

    process {
        try {
            Assert-OpfMarkdownDocument -Document $Document -Cmdlet $PSCmdlet

            if ($Headers.Count -eq 0) {
                Invoke-OpfErrorHandler -Message 'A tabela Markdown tem de ter pelo menos uma coluna.' -Category InvalidArgument -Cmdlet $PSCmdlet
            }

            if ($PSBoundParameters.ContainsKey('Alignment') -and $Alignment.Count -ne $Headers.Count) {
                Invoke-OpfErrorHandler -Message 'O numero de elementos em Alignment tem de ser igual ao numero de elementos em Headers.' -Category InvalidArgument -Cmdlet $PSCmdlet
            }

            $dataRows = [System.Collections.Generic.List[System.String]]::new()

            foreach ($row in $Rows) {
                $rowValues = @($row)

                if ($rowValues.Count -ne $Headers.Count) {
                    Invoke-OpfErrorHandler -Message 'Cada linha da tabela tem de ter o mesmo numero de valores que Headers.' -Category InvalidArgument -Cmdlet $PSCmdlet
                }

                $cells = foreach ($value in $rowValues) {
                    Get-OpfSanitizedSingleLine -Text ([System.String]$value)
                }

                $dataRows.Add((Get-OpfTableRow -Cell ([System.String[]]@($cells))))
            }

            $headerCells = foreach ($header in $Headers) {
                Get-OpfSanitizedSingleLine -Text $header
            }

            $lines = [System.Collections.Generic.List[System.String]]::new()
            $lines.Add((Get-OpfTableRow -Cell ([System.String[]]@($headerCells))))
            $lines.Add((Get-OpfTableSeparator -ColumnCount $Headers.Count -Alignment $Alignment))
            $lines.AddRange($dataRows)

            Add-OpfBlock -Document $Document -Line $lines.ToArray()

            return $Document
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao adicionar uma tabela ao documento Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

function Add-MarkdownCodeBlock {
    <#
        .SYNOPSIS
        Adiciona um bloco de codigo (fenced code block) ao documento Markdown.

        .DESCRIPTION
        Escreve o texto de codigo fornecido delimitado por cercas de crases,
        com identificacao opcional da linguagem para efeitos de realce de
        sintaxe.

        Quando o codigo contem cercas internas, a cerca exterior e alongada
        conforme a especificacao CommonMark, de modo a que o bloco nao
        termine prematuramente.

        .PARAMETER Document
        Objeto de documento Markdown de destino.

        .PARAMETER Code
        Texto do bloco de codigo.

        .PARAMETER Language
        Identificador da linguagem (por exemplo 'powershell', 'json',
        'yaml'). Opcional.

        .EXAMPLE
        $doc = Add-MarkdownCodeBlock -Document $doc -Code 'Write-Output "Ola"' -Language 'powershell'

        .OUTPUTS
        OpfMarkdownDocument
    #>
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        $Document,

        [Parameter(Mandatory = $true, Position = 1)]
        [AllowEmptyString()]
        [System.String]
        $Code,

        [Parameter(Mandatory = $false, Position = 2)]
        [AllowEmptyString()]
        [AllowNull()]
        [System.String]
        $Language = ''
    )

    process {
        try {
            Assert-OpfMarkdownDocument -Document $Document -Cmdlet $PSCmdlet

            $fence    = Get-OpfCodeFence -Code $Code
            $tag      = Get-OpfSanitizedSingleLine -Text $Language

            Add-OpfBlock -Document $Document -Line ([System.String[]]@(
                    ('{0}{1}' -f $fence, $tag.Trim())
                    $Code
                    $fence
                ))

            return $Document
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao adicionar um bloco de codigo ao documento Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

function Add-MarkdownInlineCode {
    <#
        .SYNOPSIS
        Adiciona um trecho de codigo em linha (inline code) ao documento
        Markdown.

        .DESCRIPTION
        Escreve o texto fornecido delimitado por crases simples. Por omissao
        nao termina a linha, permitindo continuar a compor a mesma frase com
        chamadas subsequentes.

        .PARAMETER Document
        Objeto de documento Markdown de destino.

        .PARAMETER Text
        Texto a apresentar como codigo em linha.

        .PARAMETER AppendNewLine
        Quando presente, termina o paragrafo apos o texto, escrevendo duas
        quebras de linha.

        .EXAMPLE
        $doc = Add-MarkdownInlineCode -Document $doc -Text 'Get-Item'

        .EXAMPLE
        $doc = Add-MarkdownInlineCode -Document $doc -Text 'Get-Item' -AppendNewLine

        .OUTPUTS
        OpfMarkdownDocument
    #>
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        $Document,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateNotNullOrEmpty()]
        [System.String]
        $Text,

        [Parameter(Mandatory = $false)]
        [System.Management.Automation.SwitchParameter]
        $AppendNewLine
    )

    process {
        try {
            Assert-OpfMarkdownDocument -Document $Document -Cmdlet $PSCmdlet

            Add-OpfText -Document $Document -Text ('`{0}`' -f $Text)

            if ($AppendNewLine) {
                Add-OpfLine -Document $Document
                Add-OpfLine -Document $Document
            }

            return $Document
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao adicionar codigo em linha ao documento Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

function Add-MarkdownQuote {
    <#
        .SYNOPSIS
        Adiciona uma citacao (blockquote) ao documento Markdown.

        .DESCRIPTION
        Escreve o texto fornecido como uma citacao Markdown, prefixando cada
        linha com o caracter ">". Suporta texto multi-linha.

        .PARAMETER Document
        Objeto de documento Markdown de destino.

        .PARAMETER Text
        Texto da citacao. Pode conter multiplas linhas.

        .EXAMPLE
        $doc = Add-MarkdownQuote -Document $doc -Text 'Esta e uma citacao importante.'

        .OUTPUTS
        OpfMarkdownDocument
    #>
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        $Document,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateNotNullOrEmpty()]
        [System.String]
        $Text
    )

    process {
        try {
            Assert-OpfMarkdownDocument -Document $Document -Cmdlet $PSCmdlet

            $lines = foreach ($line in ($Text -split '\r\n|\r|\n')) {
                '> {0}' -f $line
            }

            Add-OpfBlock -Document $Document -Line ([System.String[]]@($lines))

            return $Document
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao adicionar uma citacao ao documento Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

function Add-MarkdownLink {
    <#
        .SYNOPSIS
        Adiciona uma hiperligacao (link) ao documento Markdown.

        .DESCRIPTION
        Escreve um link Markdown no formato "[Texto](Url)", com suporte
        opcional para titulo (tooltip). Por omissao nao adiciona quebra de
        linha, permitindo compor links dentro de frases.

        .PARAMETER Document
        Objeto de documento Markdown de destino.

        .PARAMETER Text
        Texto visivel do link.

        .PARAMETER Url
        Endereco de destino do link.

        .PARAMETER Title
        Titulo opcional (tooltip) do link.

        .PARAMETER AppendNewLine
        Quando presente, adiciona uma quebra de paragrafo apos o link.

        .EXAMPLE
        $doc = Add-MarkdownLink -Document $doc -Text 'Documentacao' -Url 'https://example.com/docs'

        .EXAMPLE
        $doc = Add-MarkdownLink -Document $doc -Text 'Manual' -Url 'https://example.com' -Title 'Abrir manual' -AppendNewLine

        .OUTPUTS
        OpfMarkdownDocument
    #>
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        $Document,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateNotNullOrEmpty()]
        [System.String]
        $Text,

        [Parameter(Mandatory = $true, Position = 2)]
        [ValidateNotNullOrEmpty()]
        [System.String]
        $Url,

        [Parameter(Mandatory = $false)]
        [AllowEmptyString()]
        [AllowNull()]
        [System.String]
        $Title,

        [Parameter(Mandatory = $false)]
        [System.Management.Automation.SwitchParameter]
        $AppendNewLine
    )

    process {
        try {
            Assert-OpfMarkdownDocument -Document $Document -Cmdlet $PSCmdlet

            Add-OpfText -Document $Document -Text (Get-OpfInlineLink -Text $Text -Url $Url -Title $Title)

            if ($AppendNewLine) {
                Add-OpfLine -Document $Document
                Add-OpfLine -Document $Document
            }

            return $Document
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao adicionar uma ligacao ao documento Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

function Add-MarkdownImage {
    <#
        .SYNOPSIS
        Adiciona uma imagem ao documento Markdown.

        .DESCRIPTION
        Escreve uma imagem Markdown no formato "![TextoAlternativo](Url)",
        com suporte opcional para titulo (tooltip), seguida de uma quebra de
        paragrafo.

        .PARAMETER Document
        Objeto de documento Markdown de destino.

        .PARAMETER AltText
        Texto alternativo da imagem.

        .PARAMETER Url
        Endereco (caminho ou URL) da imagem.

        .PARAMETER Title
        Titulo opcional (tooltip) da imagem.

        .EXAMPLE
        $doc = Add-MarkdownImage -Document $doc -AltText 'Logotipo' -Url './logo.png'

        .OUTPUTS
        OpfMarkdownDocument
    #>
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        $Document,

        [Parameter(Mandatory = $true, Position = 1)]
        [AllowEmptyString()]
        [System.String]
        $AltText,

        [Parameter(Mandatory = $true, Position = 2)]
        [ValidateNotNullOrEmpty()]
        [System.String]
        $Url,

        [Parameter(Mandatory = $false)]
        [AllowEmptyString()]
        [AllowNull()]
        [System.String]
        $Title
    )

    process {
        try {
            Assert-OpfMarkdownDocument -Document $Document -Cmdlet $PSCmdlet

            Add-OpfBlock -Document $Document -Line (Get-OpfInlineLink -Text $AltText -Url $Url -Title $Title -AsImage)

            return $Document
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao adicionar uma imagem ao documento Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

function Add-MarkdownBadge {
    <#
        .SYNOPSIS
        Adiciona um badge (imagem/etiqueta de estado) ao documento Markdown.

        .DESCRIPTION
        Escreve um badge no formato tipico usado em ficheiros README,
        opcionalmente envolvendo a imagem do badge num link. Segue o formato
        "[![Label](ImageUrl)](LinkUrl)" quando LinkUrl e fornecido, ou
        apenas "![Label](ImageUrl)" caso contrario.

        Termina com um espaco e sem quebra de linha, o que permite compor
        varios badges na mesma linha.

        .PARAMETER Document
        Objeto de documento Markdown de destino.

        .PARAMETER Label
        Texto alternativo/etiqueta do badge.

        .PARAMETER ImageUrl
        Endereco da imagem do badge (por exemplo um endpoint shields.io).

        .PARAMETER LinkUrl
        Endereco opcional para onde o badge deve apontar quando clicado.

        .EXAMPLE
        $doc = Add-MarkdownBadge -Document $doc -Label 'build' -ImageUrl 'https://img.shields.io/badge/build-passing-brightgreen' -LinkUrl 'https://example.com/ci'

        .OUTPUTS
        OpfMarkdownDocument
    #>
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        $Document,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateNotNullOrEmpty()]
        [System.String]
        $Label,

        [Parameter(Mandatory = $true, Position = 2)]
        [ValidateNotNullOrEmpty()]
        [System.String]
        $ImageUrl,

        [Parameter(Mandatory = $false, Position = 3)]
        [AllowEmptyString()]
        [AllowNull()]
        [System.String]
        $LinkUrl
    )

    process {
        try {
            Assert-OpfMarkdownDocument -Document $Document -Cmdlet $PSCmdlet

            $badge = Get-OpfInlineLink -Text $Label -Url $ImageUrl -AsImage

            if (-not [string]::IsNullOrWhiteSpace($LinkUrl)) {
                $badge = Get-OpfInlineLink -Text $badge -Url $LinkUrl
            }

            Add-OpfText -Document $Document -Text ('{0} ' -f $badge)

            return $Document
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao adicionar um badge ao documento Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

function Add-MarkdownTOC {
    <#
        .SYNOPSIS
        Adiciona uma tabela de conteudos (TOC) ao documento Markdown.

        .DESCRIPTION
        Constroi uma lista de ligacoes de ancora a partir de uma coleccao de
        titulos de secao fornecida explicitamente pelo utilizador. Cada
        entrada gera um item de lista com uma ligacao para o slug
        correspondente ao titulo, no formato usado por renderizadores GFM.

        .PARAMETER Document
        Objeto de documento Markdown de destino.

        .PARAMETER Headings
        Coleccao ordenada de titulos de secao a incluir na tabela de
        conteudos.

        .PARAMETER Title
        Titulo da propria seccao de indice, escrito como cabecalho de nivel
        2. Por omissao "Table of Contents". Um valor vazio omite o
        cabecalho.

        .EXAMPLE
        $doc = Add-MarkdownTOC -Document $doc -Headings @('Introducao', 'Instalacao', 'Uso')

        .EXAMPLE
        $doc = Add-MarkdownTOC -Document $doc -Headings @('Resumo') -Title 'Indice'

        .OUTPUTS
        OpfMarkdownDocument

        .NOTES
        Os titulos acentuados produzem ancoras que preservam os acentos,
        conforme a convencao dos renderizadores GFM.
    #>
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        $Document,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateNotNull()]
        [System.String[]]
        $Headings,

        [Parameter(Mandatory = $false)]
        [AllowEmptyString()]
        [AllowNull()]
        [System.String]
        $Title = 'Table of Contents'
    )

    process {
        try {
            Assert-OpfMarkdownDocument -Document $Document -Cmdlet $PSCmdlet

            if (-not [string]::IsNullOrWhiteSpace($Title)) {
                Add-OpfBlock -Document $Document -Line ('## {0}' -f $Title)
            }

            $lines = foreach ($heading in $Headings) {
                '- [{0}](#{1})' -f $heading, (Get-OpfSlug -Text $heading)
            }

            Add-OpfBlock -Document $Document -Line ([System.String[]]@($lines))

            return $Document
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao adicionar uma tabela de conteudos ao documento Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

function Add-MarkdownMetadata {
    <#
        .SYNOPSIS
        Adiciona um bloco de metadados (front matter) YAML ao documento
        Markdown.

        .DESCRIPTION
        Escreve um bloco de front matter delimitado por linhas "---", a
        partir de um dicionario de pares chave/valor. Tipicamente usado para
        metadados consumidos por geradores de sites estaticos.

        Os pares sao tambem registados na propriedade Metadata do documento,
        pela ordem em que sao enumerados.

        O bloco e escrito na posicao atual do documento. Como o front matter
        so e valido no inicio do ficheiro, esta funcao deve ser chamada
        antes de qualquer outro conteudo.

        .PARAMETER Document
        Objeto de documento Markdown de destino.

        .PARAMETER Metadata
        Dicionario (hashtable ou IDictionary ordenado) de metadados a
        escrever. As chaves sao escritas na ordem em que sao enumeradas.

        .EXAMPLE
        $doc = Add-MarkdownMetadata -Document $doc -Metadata ([ordered]@{ title = 'Relatorio'; author = 'OPF' })

        .OUTPUTS
        OpfMarkdownDocument

        .NOTES
        O nome desta funcao usa o substantivo plural "Metadata" de forma
        deliberada, por ser um requisito explicito da API publica do modulo
        OPF e por "Metadata" ser, no uso corrente em lingua inglesa, tratado
        como um termo de massa (mass noun) em vez de um plural regular.

        Uma hashtable simples nao garante a ordem das chaves. Use [ordered]
        quando a ordem do front matter for relevante.
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseSingularNouns', '', Justification = 'Nome da funcao definido pelos requisitos da API publica do modulo OPF; Metadata e um termo de massa em ingles.')]
    [CmdletBinding()]
    [OutputType([OpfMarkdownDocument])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        $Document,

        [Parameter(Mandatory = $true, Position = 1)]
        [ValidateNotNull()]
        [System.Collections.IDictionary]
        $Metadata
    )

    process {
        try {
            Assert-OpfMarkdownDocument -Document $Document -Cmdlet $PSCmdlet

            $lines = [System.Collections.Generic.List[System.String]]::new()
            $lines.Add('---')

            foreach ($key in $Metadata.Keys) {
                $value = $Metadata[$key]
                $lines.Add(('{0}: {1}' -f $key, (Get-OpfSanitizedSingleLine -Text ([System.String]$value))))
                $Document.Metadata[$key] = $value
            }

            $lines.Add('---')

            Add-OpfBlock -Document $Document -Line $lines.ToArray()

            return $Document
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao adicionar metadados ao documento Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

#endregion Public Functions - Content Blocks

#region Public Functions - Text Utilities

function ConvertTo-MarkdownText {
    <#
        .SYNOPSIS
        Aplica formatacao textual Markdown (negrito, italico, tachado, etc.)
        a uma string simples.

        .DESCRIPTION
        Envolve o texto fornecido com os delimitadores Markdown
        correspondentes ao estilo pedido. Suporta os estilos 'Bold',
        'Italic', 'BoldItalic', 'Strikethrough' e 'None'.

        Nao altera o documento: devolve texto, para ser usado como argumento
        de qualquer funcao Add-Markdown*.

        .PARAMETER Text
        Texto a formatar.

        .PARAMETER Style
        Estilo de formatacao a aplicar. Por omissao 'None' (sem alteracao).

        .EXAMPLE
        ConvertTo-MarkdownText -Text 'importante' -Style Bold

        .EXAMPLE
        'a', 'b' | ConvertTo-MarkdownText -Style Italic

        .OUTPUTS
        System.String
    #>
    [CmdletBinding()]
    [OutputType([System.String])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        [AllowEmptyString()]
        [System.String]
        $Text,

        [Parameter(Mandatory = $false, Position = 1)]
        [ValidateSet('None', 'Bold', 'Italic', 'BoldItalic', 'Strikethrough')]
        [System.String]
        $Style = 'None'
    )

    process {
        try {
            if ([string]::IsNullOrEmpty($Text)) {
                return ''
            }

            switch ($Style) {
                'Bold' { return ('**{0}**' -f $Text) }
                'Italic' { return ('*{0}*' -f $Text) }
                'BoldItalic' { return ('***{0}***' -f $Text) }
                'Strikethrough' { return ('~~{0}~~' -f $Text) }
                default { return $Text }
            }
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao converter texto para formatacao Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

function Escape-MarkdownText {
    <#
        .SYNOPSIS
        Efetua o escaping de caracteres especiais Markdown numa string.

        .DESCRIPTION
        Prefixa com uma barra invertida todos os caracteres que possuem
        significado especial em Markdown, produzindo um texto que sera
        apresentado literalmente quando renderizado. Util antes de inserir
        texto proveniente de dados externos ou gerado dinamicamente em
        qualquer bloco do documento.

        .PARAMETER Text
        Texto a escapar.

        .EXAMPLE
        Escape-MarkdownText -Text 'Preco: 10 * 2 = 20 (aprox.)'

        .EXAMPLE
        $seguro = $dadosExternos | Escape-MarkdownText

        .OUTPUTS
        System.String

        .NOTES
        O nome desta funcao usa o verbo "Escape", que nao consta na lista de
        verbos aprovados do PowerShell (Get-Verb), por ser um requisito
        explicito da API publica do modulo OPF. O verbo aprovado mais
        proximo em significado e disponibilizado como alias funcional
        atraves de ConvertTo-MarkdownText para outros cenarios de formatacao,
        mas o nome Escape-MarkdownText e mantido tal como especificado.
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseApprovedVerbs', '', Justification = 'Nome da funcao definido pelos requisitos da API publica do modulo OPF.')]
    [CmdletBinding()]
    [OutputType([System.String])]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        [AllowEmptyString()]
        [System.String]
        $Text
    )

    process {
        try {
            return Get-OpfEscapedText -Text $Text
        }
        catch {
            Invoke-OpfErrorHandler -Message 'Falha ao escapar texto Markdown.' -ErrorRecord $_ -Cmdlet $PSCmdlet
        }
    }
}

#endregion Public Functions - Text Utilities

#region Module Initialization

$script:OpfUtilsAvailable = Initialize-OpfUtilsIntegration

#endregion Module Initialization

#region Module Exports

Export-ModuleMember -Function @(
    'New-MarkdownDocument',
    'Open-MarkdownDocument',
    'Save-MarkdownDocument',
    'Clear-MarkdownDocument',
    'Add-MarkdownHeading',
    'Add-MarkdownParagraph',
    'Add-MarkdownHorizontalRule',
    'Add-MarkdownLineBreak',
    'Add-MarkdownList',
    'Add-MarkdownNumberedList',
    'Add-MarkdownChecklist',
    'Add-MarkdownTable',
    'Add-MarkdownCodeBlock',
    'Add-MarkdownInlineCode',
    'Add-MarkdownQuote',
    'Add-MarkdownLink',
    'Add-MarkdownImage',
    'Add-MarkdownBadge',
    'Add-MarkdownTOC',
    'Add-MarkdownMetadata',
    'ConvertTo-MarkdownText',
    'Escape-MarkdownText'
)

#endregion Module Exports
