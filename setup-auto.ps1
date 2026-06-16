#!/usr/bin/env pwsh
# ============================================================================
# VozZap - Setup 100% Automático com Supabase CLI
# ============================================================================
# Script que cria novo projeto e configura tudo automaticamente
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VozZap - Setup 100% Automático" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# VERIFICAR SE SUPABASE CLI ESTÁ INSTALADO
# ============================================================================
Write-Host "[1/5] Verificando Supabase CLI..." -ForegroundColor Yellow

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI não está instalado!" -ForegroundColor Red
    Write-Host "   Instale com: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI encontrado" -ForegroundColor Green

# ============================================================================
# FAZER LOGIN
# ============================================================================
Write-Host "[2/5] Fazendo login no Supabase..." -ForegroundColor Yellow
Write-Host "   Se não estiver logado, será aberto um navegador..." -ForegroundColor Gray

supabase login

# ============================================================================
# INSERIR DADOS DO NOVO PROJETO
# ============================================================================
Write-Host "[3/5] Configurando novo projeto..." -ForegroundColor Yellow

$projectRef = Read-Host "Project ref do novo projeto Supabase (ex: blopcuugcawqvgdctjwz)"
$supabaseUrl = Read-Host "URL Supabase (ex: https://xxxxx.supabase.co)"
$supabaseKey = Read-Host "Chave Anon (ex: eyJ...)"

# ============================================================================
# ATUALIZAR .env
# ============================================================================
Write-Host "[4/5] Atualizando .env..." -ForegroundColor Yellow

$envFile = ".env"
$envContent = @"
VITE_SUPABASE_URL=$supabaseUrl
VITE_SUPABASE_ANON_KEY=$supabaseKey
"@

Set-Content -Path $envFile -Value $envContent -Encoding UTF8
Write-Host "✅ .env atualizado" -ForegroundColor Green

# ============================================================================
# FAZER LINK COM PROJETO
# ============================================================================
Write-Host "[5/5] Sincronizando com Supabase..." -ForegroundColor Yellow

supabase link --project-ref $projectRef
supabase db push --skip-seed

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migrations executadas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Algumas migrations podem ter falhado. Verifique os logs acima." -ForegroundColor Yellow
}

# ============================================================================
# INSTRUÇÕES FINAIS
# ============================================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Concluído!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📌 Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Abra: https://supabase.com/dashboard/project/$projectRef/storage" -ForegroundColor Gray
Write-Host "  2. Crie um novo bucket chamado 'audios'" -ForegroundColor Gray
Write-Host "  3. Marque como 'Public bucket'" -ForegroundColor Gray
Write-Host "  4. Configure as 3 policies (SELECT, INSERT, DELETE)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Depois, inicie o dev server:" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Green
Write-Host ""
