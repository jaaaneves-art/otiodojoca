# ROLLBACK-DOCS.ps1

<#
.SYNOPSIS
Rollback da migração documental OTJ.

.DESCRIPTION
Script base para reverter a migração da documentação caso seja necessário.
Deve ser executado apenas após validação da equipa.
#>

Write-Host ""
Write-Host "====================================="
Write-Host " OTJ - DOCUMENT ROLLBACK"
Write-Host "====================================="
Write-Host ""

Write-Host "PASSO 1 - Reverter documentos"
Write-Host "PASSO 2 - Restaurar estrutura"
Write-Host "PASSO 3 - Validar documentação"
Write-Host "PASSO 4 - Confirmar integridade"
Write-Host "PASSO 5 - Commit de rollback"

Write-Host ""
Write-Host "Script em modo de preparação."
Write-Host "Adicionar comandos após validação da migração."
