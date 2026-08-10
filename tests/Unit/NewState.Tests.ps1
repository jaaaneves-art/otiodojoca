BeforeAll {
    Import-Module "$PSScriptRoot\..\..\lib\State.psm1" -Force
}

Describe "New-OpfState" {

    It "Cria um documento" {

        $state = New-OpfState

        $state | Should -Not -BeNullOrEmpty
    }

    It "Devolve o tipo esperado" {

        $state = New-OpfState

        $state.GetType().Name | Should -Be "OpfStateDocument"
    }

    It "Inicializa todas as secções obrigatórias" {

        $state = New-OpfState

        ($state.Sections.Id) | Should -Contain "objetivo"
        ($state.Sections.Id) | Should -Contain "invariantes"
        ($state.Sections.Id) | Should -Contain "concluido"
        ($state.Sections.Id) | Should -Contain "em-curso"
        ($state.Sections.Id) | Should -Contain "bloqueado"
        ($state.Sections.Id) | Should -Contain "por-fazer"
        ($state.Sections.Id) | Should -Contain "decisoes"
        ($state.Sections.Id) | Should -Contain "problemas-conhecidos"
        ($state.Sections.Id) | Should -Contain "proximo-passo"
    }

}