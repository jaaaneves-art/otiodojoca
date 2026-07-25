BeforeAll {
    Import-Module "$PSScriptRoot\..\..\lib\State.psm1" -Force
}

Describe "Save-OpfState / Get-OpfState" {

    It "Guarda e volta a carregar o estado" {

        $path = Join-Path $TestDrive "STATE.md"

        $state = New-OpfState
        $state.Path = $path

        Set-OpfStateSection $state "objetivo" "Teste Pester"
        Set-OpfStateSection $state "proximo-passo" "Validar persistência"

        Save-OpfState $state

        Test-Path $path | Should -BeTrue

        $loaded = Get-OpfState -Path $path

        $loaded | Should -Not -BeNullOrEmpty

        $objetivo = Get-OpfStateSection $loaded "objetivo"
        $proximo = Get-OpfStateSection $loaded "proximo-passo"

        $objetivo.Body | Should -Be "Teste Pester"
        $proximo.Body | Should -Be "Validar persistência"
    }

}