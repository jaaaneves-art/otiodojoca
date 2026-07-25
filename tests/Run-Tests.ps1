Import-Module Pester -Force

$ErrorActionPreference = 'Stop'

Invoke-Pester -Path $PSScriptRoot -Output Detailed