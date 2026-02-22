# PowerShell скрипт для проверки после каждой фазы миграции

$ErrorActionPreference = "Stop"

Write-Host "`n🔍 Запуск проверок после фазы миграции..." -ForegroundColor Cyan
Write-Host ""

# Функция для проверки команды
function Test-Command {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host -NoNewline "Проверка: $Description... "
    try {
        $result = Invoke-Expression $Command 2>&1
        if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq $null) {
            Write-Host "✅ OK" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ FAILED" -ForegroundColor Red
            Write-Host $result
            return $false
        }
    } catch {
        Write-Host "❌ FAILED" -ForegroundColor Red
        Write-Host $_.Exception.Message
        return $false
    }
}

# Проверка типов
Write-Host "1️⃣  Проверка типов TypeScript..." -ForegroundColor Yellow
if (Test-Command "npm run type-check" "TypeScript types") {
    Write-Host ""
} else {
    Write-Host "`n❌ Ошибка: Проверка типов не прошла!" -ForegroundColor Red
    exit 1
}

# Проверка линтера
Write-Host "2️⃣  Проверка линтера ESLint..." -ForegroundColor Yellow
$lintPassed = Test-Command "npm run lint" "ESLint"
Write-Host ""
if (-not $lintPassed) {
    Write-Host "⚠️  Предупреждение: Есть проблемы с линтером" -ForegroundColor Yellow
    Write-Host "Попробуйте: npm run lint:fix" -ForegroundColor Cyan
    Write-Host ""
}

# Проверка зависимостей
Write-Host "3️⃣  Проверка зависимостей..." -ForegroundColor Yellow
try {
    npm run check:deps
} catch {
    # Игнорируем ошибки проверки зависимостей
}
Write-Host ""

# Итог
Write-Host "✅ Все проверки завершены!" -ForegroundColor Green
Write-Host ""
Write-Host "Следующие шаги:" -ForegroundColor Cyan
Write-Host "  • Если есть ошибки - исправьте их перед переходом к следующей фазе" -ForegroundColor White
Write-Host "  • Если есть предупреждения - рассмотрите их исправление" -ForegroundColor White
Write-Host "  • Проверьте тестовые страницы вручную" -ForegroundColor White
Write-Host ""
Write-Host "Подробнее: см. PHASE_CHECKLIST.md" -ForegroundColor Cyan
