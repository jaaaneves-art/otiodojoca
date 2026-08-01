$ErrorActionPreference = 'Stop'

Write-Host "====================================="
Write-Host " OTJ DATABASE AUDIT"
Write-Host "====================================="
Write-Host ""

if (!(Test-Path ".\supabase")) {
    throw "Pasta supabase não encontrada."
}

Write-Host "[OK] Projeto Supabase"

$version = npx supabase --version

if ($LASTEXITCODE -ne 0) {
    throw "Supabase CLI não encontrada."
}

Write-Host "[OK] Supabase CLI $version"
Write-Host ""

$status = npx supabase status 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Supabase Local"
    Write-Host ""
    $status
}
else {
    Write-Host "[INFO] Supabase Local não está em execução."
    Write-Host ""
    Write-Host "Será utilizada a base de dados remota."
}