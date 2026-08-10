BeforeAll {
    Import-Module "$PSScriptRoot\..\..\lib\State.psm1" -Force
}

Describe "Write-OpfFile" {

    It "Guarda o mesmo ficheiro duas vezes consecutivas" {

        $path = Join-Path $TestDrive "STATE.md"

        $state = New-OpfState
        $state.Path = $path

        Set-OpfStateSection $state "objetivo" "Primeira versão"
        Set-OpfStateSection $state "proximo-passo" "Guardar"

        { Save-OpfState $state } | Should -Not -Throw

        Set-OpfStateSection $state "objetivo" "Segunda versão"

        { Save-OpfState $state } | Should -Not -Throw

        $loaded = Get-OpfState -Path $path

        (Get-OpfStateSection $loaded "objetivo").Body |
            Should -Be "Segunda versão"
    }

}