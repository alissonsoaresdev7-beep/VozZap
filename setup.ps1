#!/usr/bin/env pwsh
# ============================================================================
# VozZap - Setup Automatizado Supabase
# ============================================================================
# Script que:
# 1. Coleta credenciais do novo projeto Supabase
# 2. Atualiza arquivo .env
# 3. Executa migrations SQL em ordem
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VozZap - Setup Automatizado" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# PASSO 1: Coletar credenciais
# ============================================================================
Write-Host "[1/4] Coletando credenciais do Supabase..." -ForegroundColor Yellow

$supabaseUrl = Read-Host "URL do Supabase (ex: https://xxxxx.supabase.co)"
$supabaseKey = Read-Host "Chave Anon do Supabase (ex: eyJ...)"

if ([string]::IsNullOrWhiteSpace($supabaseUrl) -or [string]::IsNullOrWhiteSpace($supabaseKey)) {
    Write-Host "❌ Erro: Credenciais não podem estar vazias!" -ForegroundColor Red
    exit 1
}

# ============================================================================
# PASSO 2: Atualizar .env
# ============================================================================
Write-Host "[2/4] Atualizando arquivo .env..." -ForegroundColor Yellow

$envFile = ".env"
$envContent = @"
VITE_SUPABASE_URL=$supabaseUrl
VITE_SUPABASE_ANON_KEY=$supabaseKey
"@

try {
    Set-Content -Path $envFile -Value $envContent -Encoding UTF8
    Write-Host "✅ .env atualizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao atualizar .env: $_" -ForegroundColor Red
    exit 1
}

# ============================================================================
# PASSO 3: Executar migrations SQL
# ============================================================================
Write-Host "[3/4] Executando migrations SQL..." -ForegroundColor Yellow

$migrations = @(
    "supabase/migrations/001_tables.sql",
    "supabase/migrations/002_policies.sql",
    "supabase/migrations/003_storage.sql",
    "supabase/migrations/004_storage_setup.sql"
)

foreach ($migration in $migrations) {
    if (Test-Path $migration) {
        Write-Host "  Executando: $migration" -ForegroundColor Cyan
        Write-Host "  📝 Copie o conteúdo de: $migration" -ForegroundColor Gray
        Write-Host "  🔗 Para: https://supabase.com/dashboard/project/XXX/sql/new" -ForegroundColor Gray
        Write-Host "  ⏸️  Pressione ENTER após executar o SQL no Supabase..." -ForegroundColor Yellow
        Read-Host
    }
}

# ============================================================================
# PASSO 4: Configurar Storage
# ============================================================================
Write-Host "[4/4] Próximas etapas..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📌 Para configurar o bucket de áudio:" -ForegroundColor Cyan
Write-Host "  1. Abra: https://supabase.com/dashboard/project/XXX/storage" -ForegroundColor Gray
Write-Host "  2. Clique 'New bucket'" -ForegroundColor Gray
Write-Host "  3. Nome: audios" -ForegroundColor Gray
Write-Host "  4. ✅ Marque 'Public bucket'" -ForegroundColor Gray
Write-Host "  5. Clique 'Create bucket'" -ForegroundColor Gray
Write-Host "  6. Configure as 3 policies (SELECT, INSERT, DELETE)" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# FINALIZAÇÃO
# ============================================================================
Write-Host "✅ Setup concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Pressione ENTER para iniciar o servidor dev" -ForegroundColor Gray
Read-Host

Write-Host ""
Write-Host "Iniciando dev server..." -ForegroundColor Yellow
npm run dev
