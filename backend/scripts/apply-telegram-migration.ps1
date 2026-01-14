# Скрипт для применения миграции Telegram полей
# Использование: .\scripts\apply-telegram-migration.ps1

Write-Host "🔧 Применение миграции для Telegram авторизации..." -ForegroundColor Cyan

# Проверяем, используется ли Docker
$dockerRunning = docker ps --filter "name=postgres" --format "{{.Names}}" 2>$null

if ($dockerRunning) {
    Write-Host "✅ Обнаружен Docker контейнер PostgreSQL" -ForegroundColor Green
    $containerName = $dockerRunning | Select-Object -First 1
    
    Write-Host "📦 Применяю миграцию через Docker..." -ForegroundColor Yellow
    $migrationPath = Join-Path $PSScriptRoot "..\src\database\migrations\add_telegram_fields.sql"
    
    if (Test-Path $migrationPath) {
        Get-Content $migrationPath | docker exec -i $containerName psql -U admin -d city_delivery
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Миграция успешно применена!" -ForegroundColor Green
        } else {
            Write-Host "❌ Ошибка при применении миграции" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Файл миграции не найден: $migrationPath" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "📝 Docker не обнаружен, пробую локальное подключение..." -ForegroundColor Yellow
    
    # Пробуем выполнить через локальный psql
    $migrationPath = Join-Path $PSScriptRoot "..\src\database\migrations\add_telegram_fields.sql"
    
    if (Test-Path $migrationPath) {
        Write-Host "💡 Выполните команду вручную:" -ForegroundColor Cyan
        Write-Host "   psql -U postgres -d city_delivery -f `"$migrationPath`"" -ForegroundColor White
        
        # Пробуем выполнить автоматически
        $env:PGPASSWORD = Read-Host "Введите пароль PostgreSQL (или нажмите Enter для пропуска)"
        
        if ($env:PGPASSWORD) {
            psql -U postgres -d city_delivery -f $migrationPath
            Remove-Item Env:\PGPASSWORD
        } else {
            Write-Host "⚠️  Автоматическое выполнение пропущено. Выполните команду вручную." -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Файл миграции не найден: $migrationPath" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n✅ Готово! Поля telegram_id и telegram_avatar добавлены в таблицу users." -ForegroundColor Green
