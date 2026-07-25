#requires -Version 5.1

Set-StrictMode -Version Latest

#region Tipos

enum OpfIssueSeverity {
    Warning = 0
    Error   = 1
}

class OpfStateException : System.Exception {
    OpfStateException([string] $message) : base($message) { }
    OpfStateException([string] $message, [System.Exception] $inner) : base($message, $inner) { }
}

class OpfStateIOException : OpfStateException {
    [string] $Path

    OpfStateIOException([string] $message, [string] $path) : base($message) {
        $this.Path = $path
    }

    OpfStateIOException([string] $message, [string] $path, [System.Exception] $inner) : base($message, $inner) {
        $this.Path = $path
    }
}

class OpfStateParseException : OpfStateException {
    [int]    $LineNumber
    [string] $Path

    OpfStateParseException([string] $message, [int] $lineNumber, [string] $path) : base($message) {
        $this.LineNumber = $lineNumber
        $this.Path       = $path
    }
}

class OpfStateSectionNotFoundException : OpfStateException {
    [string] $SectionId

    OpfStateSectionNotFoundException([string] $message, [string] $sectionId) : base($message) {
        $this.SectionId = $sectionId
    }
}

class OpfStateIssue {
    [OpfIssueSeverity] $Severity
    [string]           $Code
    [string]           $Message
    [string]           $SectionId
    [int]              $LineNumber

    OpfStateIssue([OpfIssueSeverity] $severity, [string] $code, [string] $message, [string] $sectionId, [int] $lineNumber) {
        $this.Severity   = $severity
        $this.Code       = $code
        $this.Message    = $message
        $this.SectionId  = $sectionId
        $this.LineNumber = $lineNumber
    }

    [string] ToString() {
        $where = ''
        if ($this.SectionId) { $where = " [$($this.SectionId)]" }
        elseif ($this.LineNumber -gt 0) { $where = " [linha $($this.LineNumber)]" }
        return ('{0} {1}{2}: {3}' -f $this.Severity.ToString().ToUpperInvariant(), $this.Code, $where, $this.Message)
    }
}

class OpfStateValidationResult {
    [bool]                                              $IsValid
    [System.Collections.Generic.List[OpfStateIssue]]    $Issues

    OpfStateValidationResult() {
        $this.Issues  = [System.Collections.Generic.List[OpfStateIssue]]::new()
        $this.IsValid = $true
    }

    [System.Collections.Generic.List[OpfStateIssue]] GetErrors() {
        $result = [System.Collections.Generic.List[OpfStateIssue]]::new()
        foreach ($issue in $this.Issues) {
            if ($issue.Severity -eq [OpfIssueSeverity]::Error) { $result.Add($issue) }
        }
        return $result
    }

    [System.Collections.Generic.List[OpfStateIssue]] GetWarnings() {
        $result = [System.Collections.Generic.List[OpfStateIssue]]::new()
        foreach ($issue in $this.Issues) {
            if ($issue.Severity -eq [OpfIssueSeverity]::Warning) { $result.Add($issue) }
        }
        return $result
    }

    [string] ToString() {
        if ($this.Issues.Count -eq 0) { return 'Documento válido.' }
        return (($this.Issues | ForEach-Object { $_.ToString() }) -join [System.Environment]::NewLine)
    }
}

class OpfStateValidationException : OpfStateException {
    [OpfStateValidationResult] $Result

    OpfStateValidationException([string] $message, [OpfStateValidationResult] $result) : base($message) {
        $this.Result = $result
    }

    [System.Collections.Generic.List[OpfStateIssue]] get_Issues() {
        return $this.Result.Issues
    }
}

class OpfStateFrontMatterEntry {
    [string] $Key
    [string] $Value
    [string] $RawLine
    [bool]   $IsModified

    OpfStateFrontMatterEntry([string] $key, [string] $value, [string] $rawLine) {
        $this.Key        = $key
        $this.Value      = $value
        $this.RawLine    = $rawLine
        $this.IsModified = $false
    }
}

class OpfStateSection {
    [string]                                     $Id
    [string]                                     $Title
    [string]                                     $HeadingRaw
    [System.Collections.Generic.List[string]]    $BodyLines
    [int]                                        $LineNumber
    [bool]                                       $IsModified

    OpfStateSection([string] $id, [string] $title, [string] $headingRaw, [int] $lineNumber) {
        $this.Id         = $id
        $this.Title      = $title
        $this.HeadingRaw = $headingRaw
        $this.LineNumber = $lineNumber
        $this.BodyLines  = [System.Collections.Generic.List[string]]::new()
        $this.IsModified = $false
    }
}

class OpfStateDocument {
    [string]                                                    $Path
    [bool]                                                      $HasFrontMatter
    [System.Collections.Generic.List[OpfStateFrontMatterEntry]] $FrontMatter
    [System.Collections.Generic.List[string]]                   $Prologue
    [System.Collections.Generic.List[OpfStateSection]]          $Sections
    [string]                                                    $NewLine
    [bool]                                                      $HasByteOrderMark
    [bool]                                                      $IsFrontMatterModified

    OpfStateDocument() {
        $this.FrontMatter           = [System.Collections.Generic.List[OpfStateFrontMatterEntry]]::new()
        $this.Prologue              = [System.Collections.Generic.List[string]]::new()
        $this.Sections              = [System.Collections.Generic.List[OpfStateSection]]::new()
        $this.NewLine               = [System.Environment]::NewLine
        $this.HasFrontMatter        = $false
        $this.HasByteOrderMark      = $false
        $this.IsFrontMatterModified = $false
    }
}

#endregion Tipos

#region Esquema

$script:OpfSchemaVersion = [version] '1.0'
$script:OpfVersionKey    = 'opf-version'

$script:OpfSchema = @(
    [pscustomobject] @{ Id = 'objetivo';             Title = 'Objetivo';             Required = $true; Content = $true  }
    [pscustomobject] @{ Id = 'invariantes';          Title = 'Invariantes';          Required = $true; Content = $false }
    [pscustomobject] @{ Id = 'concluido';            Title = 'Concluído';            Required = $true; Content = $false }
    [pscustomobject] @{ Id = 'em-curso';             Title = 'Em curso';             Required = $true; Content = $false }
    [pscustomobject] @{ Id = 'bloqueado';            Title = 'Bloqueado';            Required = $true; Content = $false }
    [pscustomobject] @{ Id = 'por-fazer';            Title = 'Por fazer';            Required = $true; Content = $false }
    [pscustomobject] @{ Id = 'decisoes';             Title = 'Decisões';             Required = $true; Content = $false }
    [pscustomobject] @{ Id = 'problemas-conhecidos'; Title = 'Problemas conhecidos'; Required = $true; Content = $false }
    [pscustomobject] @{ Id = 'proximo-passo';        Title = 'Próximo passo';        Required = $true; Content = $true  }
)

$script:OpfSchemaIndex = @{}
for ($i = 0; $i -lt $script:OpfSchema.Count; $i++) {
    $script:OpfSchemaIndex[$script:OpfSchema[$i].Id] = [pscustomobject] @{
        Definition = $script:OpfSchema[$i]
        Order      = $i
    }
}

#endregion Esquema

#region Erros

function New-OpfErrorRecord {
    [CmdletBinding()]
    [OutputType([System.Management.Automation.ErrorRecord])]
    param(
        [Parameter(Mandatory)] [System.Exception] $Exception,
        [Parameter(Mandatory)] [string] $ErrorId,
        [Parameter(Mandatory)] [System.Management.Automation.ErrorCategory] $Category,
        [Parameter()] [object] $TargetObject
    )

    return [System.Management.Automation.ErrorRecord]::new($Exception, $ErrorId, $Category, $TargetObject)
}

function Throw-OpfParseError {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseApprovedVerbs', '',
        Justification = 'Função privada, nunca exportada; o nome descreve com exatidão o efeito.')]
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [string] $Message,
        [Parameter()] [int] $LineNumber = 0,
        [Parameter()] [string] $Path
    )

    $prefix = 'STATE.md inválido'
    if ($LineNumber -gt 0) { $prefix = "$prefix (linha $LineNumber)" }

    $exception = [OpfStateParseException]::new("$prefix : $Message", $LineNumber, $Path)
    throw (New-OpfErrorRecord -Exception $exception -ErrorId 'OpfStateParseFailed' `
            -Category ([System.Management.Automation.ErrorCategory]::InvalidData) -TargetObject $Path)
}

#endregion Erros

#region Texto

function ConvertTo-OpfIdentifier {
    <#
        Normaliza um título em identificador estável: minúsculas, sem
        diacríticos, separadores colapsados em hífen.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory)] [AllowEmptyString()] [string] $Text
    )

    if ([string]::IsNullOrWhiteSpace($Text)) { return '' }

    $decomposed = $Text.Normalize([System.Text.NormalizationForm]::FormD)
    $builder    = [System.Text.StringBuilder]::new($decomposed.Length)

    foreach ($char in $decomposed.ToCharArray()) {
        $category = [System.Globalization.CharUnicodeInfo]::GetUnicodeCategory($char)
        if ($category -ne [System.Globalization.UnicodeCategory]::NonSpacingMark) {
            [void] $builder.Append($char)
        }
    }

    $flattened = $builder.ToString().Normalize([System.Text.NormalizationForm]::FormC).ToLowerInvariant()
    $slug      = [regex]::Replace($flattened, '[^a-z0-9]+', '-')

    return $slug.Trim('-')
}

function Split-OpfText {
    [CmdletBinding()]
    [OutputType([string[]])]
    param(
        [Parameter(Mandatory)] [AllowEmptyString()] [string] $Text
    )

    return [regex]::Split($Text, '\r\n|\n|\r')
}

function Get-OpfDominantNewLine {
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory)] [AllowEmptyString()] [string] $Text
    )

    $crlf = ([regex]::Matches($Text, '\r\n')).Count
    $lf   = ([regex]::Matches($Text, '(?<!\r)\n')).Count

    if ($crlf -ge $lf -and $crlf -gt 0) { return "`r`n" }
    if ($lf -gt 0) { return "`n" }

    return [System.Environment]::NewLine
}

function Test-OpfFenceDelimiter {
    <#
        Deteta a abertura ou o fecho de um bloco de código.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory)] [AllowEmptyString()] [string] $Line
    )

    $match = [regex]::Match($Line, '^\s{0,3}(`{3,}|~{3,})')
    if (-not $match.Success) { return '' }

    return $match.Groups[1].Value.Substring(0, 1)
}

#endregion Texto

#region Parsing

function Read-OpfRawDocument {
    [CmdletBinding()]
    [OutputType([pscustomobject])]
    param(
        [Parameter(Mandatory)] [string] $Path
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        $exception = [OpfStateIOException]::new("Não existe nenhum documento de estado em '$Path'.", $Path)
        throw (New-OpfErrorRecord -Exception $exception -ErrorId 'OpfStateNotFound' `
                -Category ([System.Management.Automation.ErrorCategory]::ObjectNotFound) -TargetObject $Path)
    }

    try {
        $bytes = [System.IO.File]::ReadAllBytes($Path)
    }
    catch {
        $exception = [OpfStateIOException]::new("Não foi possível ler '$Path': $($_.Exception.Message)", $Path, $_.Exception)
        throw (New-OpfErrorRecord -Exception $exception -ErrorId 'OpfStateReadFailed' `
                -Category ([System.Management.Automation.ErrorCategory]::ReadError) -TargetObject $Path)
    }

    $hasBom = $bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF
    $offset = 0
    if ($hasBom) { $offset = 3 }

    $encoding = [System.Text.UTF8Encoding]::new($false)
    $content  = $encoding.GetString($bytes, $offset, $bytes.Length - $offset)

    return [pscustomobject] @{
        Content          = $content
        HasByteOrderMark = $hasBom
    }
}

function ConvertFrom-OpfFrontMatter {
    [CmdletBinding()]
    [OutputType([System.Collections.Generic.List[OpfStateFrontMatterEntry]])]
    param(
        [Parameter(Mandatory)] [AllowEmptyCollection()] [string[]] $Lines,
        [Parameter(Mandatory)] [int] $FirstLineNumber,
        [Parameter()] [string] $Path
    )

    $entries = [System.Collections.Generic.List[OpfStateFrontMatterEntry]]::new()
    $seen    = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

    for ($i = 0; $i -lt $Lines.Count; $i++) {
        $line       = $Lines[$i]
        $lineNumber = $FirstLineNumber + $i

        if ([string]::IsNullOrWhiteSpace($line) -or $line.TrimStart().StartsWith('#')) {
            $entries.Add([OpfStateFrontMatterEntry]::new($null, $null, $line))
            continue
        }

        $match = [regex]::Match($line, '^(?<key>[A-Za-z0-9][A-Za-z0-9_.-]*)\s*:\s*(?<value>.*)$')
        if (-not $match.Success) {
            Throw-OpfParseError -Path $Path -LineNumber $lineNumber -Message (
                "'$line' não é uma entrada de front matter. O front matter do OPF é plano: " +
                'uma chave por linha, no formato "chave: valor". Estruturas aninhadas não fazem parte do protocolo.')
        }

        $key = $match.Groups['key'].Value
        if (-not $seen.Add($key)) {
            Throw-OpfParseError -Path $Path -LineNumber $lineNumber -Message (
                "A chave '$key' está definida mais do que uma vez. Um documento de estado não pode ser ambíguo.")
        }

        $entries.Add([OpfStateFrontMatterEntry]::new($key, $match.Groups['value'].Value.Trim(), $line))
    }

    return $entries
}

function ConvertFrom-OpfDocument {
    <#
        Converte texto em modelo.
    #>
    [CmdletBinding()]
    [OutputType([OpfStateDocument])]
    param(
        [Parameter(Mandatory)] [AllowEmptyString()] [string] $Content,
        [Parameter()] [string] $Path,
        [Parameter()] [bool] $HasByteOrderMark = $false
    )

    $document                  = [OpfStateDocument]::new()
    $document.Path             = $Path
    $document.NewLine          = Get-OpfDominantNewLine -Text $Content
    $document.HasByteOrderMark = $HasByteOrderMark

    $lines = Split-OpfText -Text $Content
    $index = 0

    if ($lines.Count -gt 0 -and $lines[0].TrimEnd() -eq '---') {
        $closing = -1
        for ($i = 1; $i -lt $lines.Count; $i++) {
            if ($lines[$i].TrimEnd() -eq '---') { $closing = $i; break }
        }

        if ($closing -lt 0) {
            Throw-OpfParseError -Path $Path -LineNumber 1 -Message (
                'O front matter foi aberto mas nunca fechado. Falta a linha "---" de fecho.')
        }

        $body = @()
        if ($closing -gt 1) { $body = $lines[1..($closing - 1)] }

        $document.HasFrontMatter = $true
        $document.FrontMatter    = ConvertFrom-OpfFrontMatter -Lines $body -FirstLineNumber 2 -Path $Path
        $index                   = $closing + 1
    }

    $current    = $null
    $fenceChar  = ''
    $knownIds   = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)

    for ($i = $index; $i -lt $lines.Count; $i++) {
        $line       = $lines[$i]
        $lineNumber = $i + 1
        $delimiter  = Test-OpfFenceDelimiter -Line $line

        if ($delimiter) {
            if (-not $fenceChar) { $fenceChar = $delimiter }
            elseif ($fenceChar -eq $delimiter) { $fenceChar = '' }
        }

        $heading = $null
        if (-not $fenceChar) {
            $heading = [regex]::Match($line, '^##[ \t]+(?<title>\S.*?)\s*#*\s*$')
        }

        if ($heading -and $heading.Success) {
            $title = $heading.Groups['title'].Value
            $id    = ConvertTo-OpfIdentifier -Text $title

            if (-not $id) {
                Throw-OpfParseError -Path $Path -LineNumber $lineNumber -Message (
                    'Existe uma secção cujo título não produz um identificador utilizável.')
            }

            if (-not $knownIds.Add($id)) {
                Throw-OpfParseError -Path $Path -LineNumber $lineNumber -Message (
                    "A secção '$title' aparece mais do que uma vez. Duas secções com o mesmo " +
                    'identificador tornam o estado ambíguo.')
            }

            $current = [OpfStateSection]::new($id, $title, $line, $lineNumber)
            $document.Sections.Add($current)
            continue
        }

        if ($null -eq $current) { $document.Prologue.Add($line) }
        else { $current.BodyLines.Add($line) }
    }

    if ($document.Sections.Count -gt 0) {
        $last = $document.Sections[$document.Sections.Count - 1]
        if ($last.BodyLines.Count -gt 0 -and $last.BodyLines[$last.BodyLines.Count - 1] -eq '') {
            $last.BodyLines.RemoveAt($last.BodyLines.Count - 1)
        }
    }
    elseif ($document.Prologue.Count -gt 0 -and $document.Prologue[$document.Prologue.Count - 1] -eq '') {
        $document.Prologue.RemoveAt($document.Prologue.Count - 1)
    }

    return $document
}

#endregion Parsing

#region Modelo

function Find-OpfSection {
    [CmdletBinding()]
    [OutputType([OpfStateSection])]
    param(
        [Parameter(Mandatory)] [OpfStateDocument] $Document,
        [Parameter(Mandatory)] [string] $Id
    )

    foreach ($section in $Document.Sections) {
        if ($section.Id -eq $Id) { return $section }
    }

    return $null
}

function Find-OpfFrontMatterEntry {
    [CmdletBinding()]
    [OutputType([OpfStateFrontMatterEntry])]
    param(
        [Parameter(Mandatory)] [OpfStateDocument] $Document,
        [Parameter(Mandatory)] [string] $Name
    )

    foreach ($entry in $Document.FrontMatter) {
        if ($entry.Key -and $entry.Key -eq $Name) { return $entry }
    }

    return $null
}

function Get-OpfSectionDefinition {
    [CmdletBinding()]
    [OutputType([pscustomobject])]
    param(
        [Parameter(Mandatory)] [string] $Id
    )

    if ($script:OpfSchemaIndex.ContainsKey($Id)) { return $script:OpfSchemaIndex[$Id] }

    return $null
}

function ConvertTo-OpfSectionView {
    [CmdletBinding()]
    [OutputType([pscustomobject])]
    param(
        [Parameter(Mandatory)] [OpfStateSection] $Section,
        [Parameter(Mandatory)] [int] $Position
    )

    $definition = Get-OpfSectionDefinition -Id $Section.Id
    $body       = ($Section.BodyLines -join [System.Environment]::NewLine).Trim()

    return [pscustomobject] @{
        PSTypeName = 'Opf.State.SectionView'
        Id         = $Section.Id
        Title      = $Section.Title
        Body       = $body
        Lines      = @($Section.BodyLines)
        IsEmpty    = [string]::IsNullOrWhiteSpace($body)
        IsKnown    = ($null -ne $definition)
        IsRequired = ($null -ne $definition -and $definition.Definition.Required)
        IsModified = $Section.IsModified
        Position   = $Position
        LineNumber = $Section.LineNumber
    }
}

function Add-OpfSection {
    [CmdletBinding()]
    [OutputType([OpfStateSection])]
    param(
        [Parameter(Mandatory)] [OpfStateDocument] $Document,
        [Parameter(Mandatory)] [string] $Id,
        [Parameter(Mandatory)] [string] $Title
    )

    $section            = [OpfStateSection]::new($Id, $Title, ('## {0}' -f $Title), 0)
    $section.IsModified = $true

    $definition = Get-OpfSectionDefinition -Id $Id
    if ($null -eq $definition) {
        $Document.Sections.Add($section)
        return $section
    }

    $insertAt = $Document.Sections.Count
    for ($i = 0; $i -lt $Document.Sections.Count; $i++) {
        $existing = Get-OpfSectionDefinition -Id $Document.Sections[$i].Id
        if ($null -ne $existing -and $existing.Order -gt $definition.Order) {
            $insertAt = $i
            break
        }
    }

    $Document.Sections.Insert($insertAt, $section)
    return $section
}

#endregion Modelo

#region Validação

function Test-OpfDocument {
    [CmdletBinding()]
    [OutputType([OpfStateValidationResult])]
    param(
        [Parameter(Mandatory)] [OpfStateDocument] $Document
    )

    $result = [OpfStateValidationResult]::new()

    $add = {
        param([OpfIssueSeverity] $severity, [string] $code, [string] $message, [string] $sectionId, [int] $lineNumber)
        $result.Issues.Add([OpfStateIssue]::new($severity, $code, $message, $sectionId, $lineNumber))
    }

    if (-not $Document.HasFrontMatter) {
        & $add ([OpfIssueSeverity]::Error) 'OPF001' (
            'O documento não tem front matter. O bloco delimitado por "---" no início do ficheiro é obrigatório.') '' 1
    }
    else {
        $versionEntry = Find-OpfFrontMatterEntry -Document $Document -Name $script:OpfVersionKey
        if ($null -eq $versionEntry) {
            & $add ([OpfIssueSeverity]::Error) 'OPF002' (
                "Falta a chave obrigatória '$($script:OpfVersionKey)' no front matter.") '' 1
        }
        else {
            $parsed = $null
            if (-not [version]::TryParse($versionEntry.Value, [ref] $parsed)) {
                & $add ([OpfIssueSeverity]::Error) 'OPF003' (
                    "'$($versionEntry.Value)' não é uma versão de protocolo válida. Esperado, por exemplo, " +
                    "'$($script:OpfSchemaVersion)'.") '' 1
            }
            elseif ($parsed.Major -gt $script:OpfSchemaVersion.Major) {
                & $add ([OpfIssueSeverity]::Error) 'OPF004' (
                    "O documento declara a versão $parsed do protocolo e este módulo implementa a " +
                    "$($script:OpfSchemaVersion). Versões maiores diferentes são incompatíveis.") '' 1
            }
            elseif ($parsed -gt $script:OpfSchemaVersion) {
                & $add ([OpfIssueSeverity]::Warning) 'OPF005' (
                    "O documento declara a versão $parsed e este módulo implementa a " +
                    "$($script:OpfSchemaVersion). Pode conter informação que este módulo preserva mas não interpreta.") '' 1
            }
        }
    }

    $seenOrders = [System.Collections.Generic.List[int]]::new()

    foreach ($definition in $script:OpfSchema) {
        $section = Find-OpfSection -Document $Document -Id $definition.Id

        if ($null -eq $section) {
            if ($definition.Required) {
                & $add ([OpfIssueSeverity]::Error) 'OPF010' (
                    "Falta a secção obrigatória '## $($definition.Title)'.") $definition.Id 0
            }
            continue
        }

        $body = ($section.BodyLines -join "`n").Trim()
        if ($definition.Content -and [string]::IsNullOrWhiteSpace($body)) {
            & $add ([OpfIssueSeverity]::Error) 'OPF011' (
                "A secção '## $($definition.Title)' está vazia e é precisamente a informação que um " +
                'agente novo não consegue reconstruir a partir do código.') $definition.Id $section.LineNumber
        }
        elseif ([string]::IsNullOrWhiteSpace($body)) {
            & $add ([OpfIssueSeverity]::Warning) 'OPF012' (
                "A secção '## $($definition.Title)' está vazia.") $definition.Id $section.LineNumber
        }
    }

    foreach ($section in $Document.Sections) {
        $definition = Get-OpfSectionDefinition -Id $section.Id
        if ($null -ne $definition) { $seenOrders.Add($definition.Order) }
    }

    for ($i = 1; $i -lt $seenOrders.Count; $i++) {
        if ($seenOrders[$i] -lt $seenOrders[$i - 1]) {
            & $add ([OpfIssueSeverity]::Warning) 'OPF013' (
                'As secções conhecidas não estão pela ordem canónica. O módulo não reordena nada ' +
                'automaticamente; corrija manualmente se pretender a ordem de referência.') '' 0
            break
        }
    }

    $result.IsValid = ($result.GetErrors().Count -eq 0)
    return $result
}

#endregion Validação

#region Persistência

function ConvertTo-OpfText {
    <#
        Render determinístico. Blocos não alterados são devolvidos tal
        como foram lidos; apenas o que mudou é reescrito na forma
        canónica.
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory)] [OpfStateDocument] $Document
    )

    $lines = [System.Collections.Generic.List[string]]::new()

    if ($Document.HasFrontMatter) {
        $lines.Add('---')
        foreach ($entry in $Document.FrontMatter) {
            if ($entry.IsModified -or $null -eq $entry.RawLine) {
                $lines.Add(('{0}: {1}' -f $entry.Key, $entry.Value))
            }
            else {
                $lines.Add($entry.RawLine)
            }
        }
        $lines.Add('---')
    }

    foreach ($line in $Document.Prologue) { $lines.Add($line) }

    for ($i = 0; $i -lt $Document.Sections.Count; $i++) {
        $section = $Document.Sections[$i]

        if (-not $section.IsModified) {
            $lines.Add($section.HeadingRaw)
            foreach ($line in $section.BodyLines) { $lines.Add($line) }
            continue
        }

        if ($lines.Count -gt 0 -and $lines[$lines.Count - 1] -ne '') { $lines.Add('') }

        $lines.Add(('## {0}' -f $section.Title))
        $lines.Add('')

        $body = [System.Collections.Generic.List[string]]::new($section.BodyLines)
        while ($body.Count -gt 0 -and [string]::IsNullOrWhiteSpace($body[0])) { $body.RemoveAt(0) }
        while ($body.Count -gt 0 -and [string]::IsNullOrWhiteSpace($body[$body.Count - 1])) { $body.RemoveAt($body.Count - 1) }

        foreach ($line in $body) { $lines.Add($line) }

        if ($i -lt $Document.Sections.Count - 1) { $lines.Add('') }
    }

    while ($lines.Count -gt 0 -and [string]::IsNullOrWhiteSpace($lines[$lines.Count - 1])) {
        $lines.RemoveAt($lines.Count - 1)
    }

    return (($lines -join $Document.NewLine) + $Document.NewLine)
}

function Write-OpfFile {
    <#
        Escrita atómica. Um documento de estado meio escrito é pior do
        que um documento antigo intacto: escreve-se num ficheiro
        temporário na mesma pasta e só depois se substitui o destino.

        CORREÇÃO APLICADA: Usar $null em vez de [NullString]::Value
        para o parâmetro destinationBackupFileName do File.Replace().
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [string] $Path,
        [Parameter(Mandatory)] [AllowEmptyString()] [string] $Content,
        [Parameter()] [bool] $WithByteOrderMark = $false
    )

    $directory = Split-Path -Path $Path -Parent
    if ($directory -and -not (Test-Path -LiteralPath $directory -PathType Container)) {
        try {
            [void] (New-Item -Path $directory -ItemType Directory -Force -ErrorAction Stop)
        }
        catch {
            $exception = [OpfStateIOException]::new(
                "Não foi possível criar a pasta '$directory': $($_.Exception.Message)", $Path, $_.Exception)
            throw (New-OpfErrorRecord -Exception $exception -ErrorId 'OpfStateWriteFailed' `
                    -Category ([System.Management.Automation.ErrorCategory]::WriteError) -TargetObject $Path)
        }
    }

    $encoding  = [System.Text.UTF8Encoding]::new($WithByteOrderMark)
    $temporary = '{0}.{1}.tmp' -f $Path, ([guid]::NewGuid().ToString('N'))

    try {
        [System.IO.File]::WriteAllBytes($temporary, $encoding.GetBytes($Content))

        if (Test-Path -LiteralPath $Path -PathType Leaf) {
            # CORREÇÃO: Usar $null em vez de [NullString]::Value
            # O File.Replace() lança "The path is empty." quando o 3º parâmetro é string vazia
            [System.IO.File]::Replace($temporary, $Path, $null)
        }
        else {
            [System.IO.File]::Move($temporary, $Path)
        }
    }
    catch {
        $exception = [OpfStateIOException]::new(
            "Não foi possível guardar '$Path': $($_.Exception.Message)", $Path, $_.Exception)
        throw (New-OpfErrorRecord -Exception $exception -ErrorId 'OpfStateWriteFailed' `
                -Category ([System.Management.Automation.ErrorCategory]::WriteError) -TargetObject $Path)
    }
    finally {
        if (Test-Path -LiteralPath $temporary -PathType Leaf) {
            Remove-Item -LiteralPath $temporary -Force -ErrorAction SilentlyContinue
        }
    }
}

#endregion Persistência

#region API pública

function New-OpfState {
    [CmdletBinding()]
    [OutputType([OpfStateDocument])]
    param(
        [Parameter(Position = 0)]
        [ValidateNotNullOrEmpty()]
        [string] $Path,

        [Parameter()]
        [ValidateNotNull()]
        [System.Collections.IDictionary] $Property = @{}
    )

    $document                       = [OpfStateDocument]::new()
    $document.Path                  = $Path
    $document.HasFrontMatter        = $true
    $document.IsFrontMatterModified = $true

    $version = [OpfStateFrontMatterEntry]::new($script:OpfVersionKey, $script:OpfSchemaVersion.ToString(), $null)
    $version.IsModified = $true
    $document.FrontMatter.Add($version)

    foreach ($key in $Property.Keys) {
        if ($key -eq $script:OpfVersionKey) { continue }

        $entry = [OpfStateFrontMatterEntry]::new([string] $key, [string] $Property[$key], $null)
        $entry.IsModified = $true
        $document.FrontMatter.Add($entry)
    }

    foreach ($definition in $script:OpfSchema) {
        if (-not $definition.Required) { continue }
        [void] (Add-OpfSection -Document $document -Id $definition.Id -Title $definition.Title)
    }

    Write-Verbose "Documento de estado criado com $($document.Sections.Count) secções obrigatórias."
    return $document
}

function Get-OpfState {
    [CmdletBinding(DefaultParameterSetName = 'Path')]
    [OutputType([OpfStateDocument])]
    param(
        [Parameter(Mandatory, Position = 0, ParameterSetName = 'Path', ValueFromPipeline, ValueFromPipelineByPropertyName)]
        [ValidateNotNullOrEmpty()]
        [Alias('FullName')]
        [string] $Path,

        [Parameter(Mandatory, ParameterSetName = 'Content')]
        [AllowEmptyString()]
        [string] $Content,

        [Parameter()]
        [switch] $SkipValidation
    )

    process {
        if ($PSCmdlet.ParameterSetName -eq 'Path') {
            $resolved = $PSCmdlet.GetUnresolvedProviderPathFromPSPath($Path)
            $raw      = Read-OpfRawDocument -Path $resolved
            $document = ConvertFrom-OpfDocument -Content $raw.Content -Path $resolved -HasByteOrderMark $raw.HasByteOrderMark
        }
        else {
            $document = ConvertFrom-OpfDocument -Content $Content
        }

        Write-Verbose "Documento interpretado: $($document.Sections.Count) secções, $($document.FrontMatter.Count) entradas de front matter."

        if (-not $SkipValidation) {
            Assert-OpfState -State $document
        }

        return $document
    }
}

function Test-OpfState {
    [CmdletBinding()]
    [OutputType([bool])]
    param(
        [Parameter(Mandatory, Position = 0, ValueFromPipeline)]
        [ValidateNotNull()]
        [OpfStateDocument] $State,

        [Parameter()]
        [switch] $Strict,

        [Parameter()]
        [switch] $Detailed
    )

    process {
        $result = Test-OpfDocument -Document $State

        if ($Strict -and $result.GetWarnings().Count -gt 0) {
            $result.IsValid = $false
        }

        if ($Detailed) { return $result }

        return $result.IsValid
    }
}

function Assert-OpfState {
    [CmdletBinding()]
    [OutputType([void])]
    param(
        [Parameter(Mandatory, Position = 0, ValueFromPipeline)]
        [ValidateNotNull()]
        [OpfStateDocument] $State,

        [Parameter()]
        [switch] $Strict
    )

    process {
        $result = Test-OpfState -State $State -Strict:$Strict -Detailed

        if ($result.IsValid) {
            foreach ($warning in $result.GetWarnings()) { Write-Verbose $warning.ToString() }
            return
        }

        $summary   = ($result.Issues | ForEach-Object { "  $($_.ToString())" }) -join [System.Environment]::NewLine
        $where     = 'O documento de estado'
        if ($State.Path) { $where = "'$($State.Path)'" }

        $exception = [OpfStateValidationException]::new(
            ("$where não cumpre o protocolo OPF:" + [System.Environment]::NewLine + $summary), $result)

        throw (New-OpfErrorRecord -Exception $exception -ErrorId 'OpfStateInvalid' `
                -Category ([System.Management.Automation.ErrorCategory]::InvalidData) -TargetObject $State.Path)
    }
}

function Get-OpfStateSection {
    [CmdletBinding()]
    [OutputType('Opf.State.SectionView')]
    param(
        [Parameter(Mandatory, Position = 0, ValueFromPipeline)]
        [ValidateNotNull()]
        [OpfStateDocument] $State,

        [Parameter(Position = 1)]
        [ValidateNotNullOrEmpty()]
        [string] $Id
    )

    process {
        if (-not $PSBoundParameters.ContainsKey('Id')) {
            for ($i = 0; $i -lt $State.Sections.Count; $i++) {
                ConvertTo-OpfSectionView -Section $State.Sections[$i] -Position $i
            }
            return
        }

        $normalized = ConvertTo-OpfIdentifier -Text $Id
        $section    = Find-OpfSection -Document $State -Id $normalized

        if ($null -eq $section) {
            $exception = [OpfStateSectionNotFoundException]::new(
                "O documento não tem nenhuma secção '$Id'.", $normalized)
            throw (New-OpfErrorRecord -Exception $exception -ErrorId 'OpfStateSectionNotFound' `
                    -Category ([System.Management.Automation.ErrorCategory]::ObjectNotFound) -TargetObject $Id)
        }

        ConvertTo-OpfSectionView -Section $section -Position $State.Sections.IndexOf($section)
    }
}

function Set-OpfStateSection {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
        Justification = 'Altera um objeto em memória; a escrita em disco pertence a Save-OpfState.')]
    [CmdletBinding()]
    [OutputType([void], [OpfStateDocument])]
    param(
        [Parameter(Mandatory, Position = 0, ValueFromPipeline)]
        [ValidateNotNull()]
        [OpfStateDocument] $State,

        [Parameter(Mandatory, Position = 1)]
        [ValidateNotNullOrEmpty()]
        [string] $Id,

        [Parameter(Mandatory, Position = 2)]
        [AllowEmptyString()]
        [AllowEmptyCollection()]
        [string[]] $Body,

        [Parameter()]
        [ValidateNotNullOrEmpty()]
        [string] $Title,

        [Parameter()]
        [switch] $PassThru
    )

    process {
        $normalized = ConvertTo-OpfIdentifier -Text $Id
        if (-not $normalized) {
            throw (New-OpfErrorRecord -Exception ([OpfStateException]::new(
                        "'$Id' não produz um identificador de secção utilizável.")) -ErrorId 'OpfStateInvalidSectionId' `
                    -Category ([System.Management.Automation.ErrorCategory]::InvalidArgument) -TargetObject $Id)
        }

        $section = Find-OpfSection -Document $State -Id $normalized

        if ($null -eq $section) {
            $definition = Get-OpfSectionDefinition -Id $normalized

            if ($null -ne $definition) {
                $sectionTitle = $definition.Definition.Title
            }
            elseif ($PSBoundParameters.ContainsKey('Title')) {
                $sectionTitle = $Title
            }
            else {
                throw (New-OpfErrorRecord -Exception ([OpfStateSectionNotFoundException]::new(
                            ("A secção '$Id' não existe no documento nem pertence ao protocolo. " +
                            'Indique -Title para a criar.'), $normalized)) -ErrorId 'OpfStateSectionNotFound' `
                        -Category ([System.Management.Automation.ErrorCategory]::ObjectNotFound) -TargetObject $Id)
            }

            $section = Add-OpfSection -Document $State -Id $normalized -Title $sectionTitle
            Write-Verbose "Secção '$($section.Title)' criada."
        }
        elseif ($PSBoundParameters.ContainsKey('Title') -and $Title -ne $section.Title) {
            $section.Title = $Title
        }

        $section.BodyLines.Clear()
        foreach ($line in $Body) {
            foreach ($split in (Split-OpfText -Text $line)) { $section.BodyLines.Add($split) }
        }

        $section.IsModified = $true

        if ($PassThru) { return $State }
    }
}

function Get-OpfStateProperty {
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory, Position = 0, ValueFromPipeline)]
        [ValidateNotNull()]
        [OpfStateDocument] $State,

        [Parameter(Position = 1)]
        [ValidateNotNullOrEmpty()]
        [string] $Name
    )

    process {
        if (-not $PSBoundParameters.ContainsKey('Name')) {
            foreach ($entry in $State.FrontMatter) {
                if (-not $entry.Key) { continue }

                [pscustomobject] @{
                    PSTypeName = 'Opf.State.Property'
                    Name       = $entry.Key
                    Value      = $entry.Value
                }
            }
            return
        }

        $entry = Find-OpfFrontMatterEntry -Document $State -Name $Name
        if ($null -eq $entry) { return $null }

        return $entry.Value
    }
}

function Set-OpfStateProperty {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
        Justification = 'Altera um objeto em memória; a escrita em disco pertence a Save-OpfState.')]
    [CmdletBinding()]
    [OutputType([void], [OpfStateDocument])]
    param(
        [Parameter(Mandatory, Position = 0, ValueFromPipeline)]
        [ValidateNotNull()]
        [OpfStateDocument] $State,

        [Parameter(Mandatory, Position = 1)]
        [ValidatePattern('^[A-Za-z0-9][A-Za-z0-9_.-]*$')]
        [string] $Name,

        [Parameter(Mandatory, Position = 2)]
        [AllowEmptyString()]
        [string] $Value,

        [Parameter()]
        [switch] $PassThru
    )

    process {
        if ($Value -match '[\r\n]') {
            throw (New-OpfErrorRecord -Exception ([OpfStateException]::new(
                        "O valor de '$Name' não pode conter mudanças de linha: o front matter do OPF é plano.")) `
                    -ErrorId 'OpfStateInvalidPropertyValue' `
                    -Category ([System.Management.Automation.ErrorCategory]::InvalidArgument) -TargetObject $Name)
        }

        $entry = Find-OpfFrontMatterEntry -Document $State -Name $Name

        if ($null -eq $entry) {
            $entry = [OpfStateFrontMatterEntry]::new($Name, $Value, $null)
            $State.FrontMatter.Add($entry)
            $State.HasFrontMatter = $true
        }
        else {
            $entry.Value = $Value
        }

        $entry.IsModified            = $true
        $State.IsFrontMatterModified = $true

        if ($PassThru) { return $State }
    }
}

function Save-OpfState {
    [CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'Medium')]
    [OutputType([void], [OpfStateDocument])]
    param(
        [Parameter(Mandatory, Position = 0, ValueFromPipeline)]
        [ValidateNotNull()]
        [OpfStateDocument] $State,

        [Parameter(Position = 1)]
        [ValidateNotNullOrEmpty()]
        [string] $Path,

        [Parameter()]
        [switch] $SkipValidation,

        [Parameter()]
        [switch] $PassThru
    )

    process {
        if ($PSBoundParameters.ContainsKey('Path')) { $target = $Path }
        else { $target = $State.Path }

        if ([string]::IsNullOrWhiteSpace($target)) {
            throw (New-OpfErrorRecord -Exception ([OpfStateIOException]::new(
                        'O documento não tem caminho associado. Indique -Path.', $null)) -ErrorId 'OpfStatePathMissing' `
                    -Category ([System.Management.Automation.ErrorCategory]::InvalidArgument) -TargetObject $State)
        }

        $resolved = $PSCmdlet.GetUnresolvedProviderPathFromPSPath($target)

        if (-not $SkipValidation) { Assert-OpfState -State $State }

        $content = ConvertTo-OpfText -Document $State

        if ($PSCmdlet.ShouldProcess($resolved, 'Guardar o documento de estado OPF')) {
            Write-OpfFile -Path $resolved -Content $content -WithByteOrderMark $State.HasByteOrderMark

            $State.Path                  = $resolved
            $State.IsFrontMatterModified = $false

            foreach ($entry in $State.FrontMatter) {
                if ($entry.IsModified) {
                    $entry.RawLine = '{0}: {1}' -f $entry.Key, $entry.Value
                }

                $entry.IsModified = $false
            }

            for ($index = 0; $index -lt $State.Sections.Count; $index++) {
                $section = $State.Sections[$index]

                if ($section.IsModified) {
                    $section.HeadingRaw = '## {0}' -f $section.Title

                    $body = [System.Collections.Generic.List[string]]::new($section.BodyLines)
                    while ($body.Count -gt 0 -and [string]::IsNullOrWhiteSpace($body[0])) { $body.RemoveAt(0) }
                    while ($body.Count -gt 0 -and [string]::IsNullOrWhiteSpace($body[$body.Count - 1])) { $body.RemoveAt($body.Count - 1) }

                    $body.Insert(0, '')
                    if ($index -lt $State.Sections.Count - 1) { $body.Add('') }

                    $section.BodyLines.Clear()
                    foreach ($line in $body) { $section.BodyLines.Add($line) }
                }

                $section.IsModified = $false
            }

            Write-Verbose "Estado guardado em '$resolved'."
        }

        if ($PassThru) { return $State }
    }
}

function Get-OpfStateSchema {
    [CmdletBinding()]
    [OutputType('Opf.State.Schema')]
    param()

    $sections = foreach ($definition in $script:OpfSchema) {
        [pscustomobject] @{
            PSTypeName      = 'Opf.State.SchemaSection'
            Id              = $definition.Id
            Title           = $definition.Title
            Required        = $definition.Required
            MustHaveContent = $definition.Content
        }
    }

    return [pscustomobject] @{
        PSTypeName     = 'Opf.State.Schema'
        Version        = $script:OpfSchemaVersion
        VersionKey     = $script:OpfVersionKey
        Sections       = @($sections)
    }
}

#endregion API pública

Export-ModuleMember -Function @(
    'New-OpfState'
    'Get-OpfState'
    'Test-OpfState'
    'Assert-OpfState'
    'Get-OpfStateSection'
    'Set-OpfStateSection'
    'Get-OpfStateProperty'
    'Set-OpfStateProperty'
    'Save-OpfState'
    'Get-OpfStateSchema'
)