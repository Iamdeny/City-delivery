# Скрипт для автоматической настройки локального домена
# Запустите от имени администратора: PowerShell -ExecutionPolicy Bypass -File setup-local-domain.ps1

Write-Host "🔧 Настройка локального домена для Telegram Widget..." -ForegroundColor Cyan

# Проверка прав администратора
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ Ошибка: Скрипт должен быть запущен от имени администратора!" -ForegroundColor Red
    Write-Host "💡 Правый клик на файл → 'Запуск от имени администратора'" -ForegroundColor Yellow
    pause
    exit 1
}

# Путь к файлу hosts
$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$domain = "local.severokat.ru"
$ip = "127.0.0.1"

# Проверяем, существует ли уже запись
$hostsContent = Get-Content $hostsPath -ErrorAction SilentlyContinue
$entryExists = $hostsContent | Select-String -Pattern $domain -Quiet

if ($entryExists) {
    Write-Host "ℹ️  Запись для $domain уже существует в файле hosts" -ForegroundColor Yellow
    
    $response = Read-Host "Хотите обновить запись? (y/n)"
    if ($response -ne 'y') {
        Write-Host "Отмена операции" -ForegroundColor Yellow
        exit 0
    }
    
    # Удаляем старую запись
    $newContent = $hostsContent | Where-Object { $_ -notmatch $domain }
    $newContent | Set-Content $hostsPath -Force
    Write-Host "✅ Старая запись удалена" -ForegroundColor Green
}

# Добавляем новую запись
try {
    Add-Content -Path $hostsPath -Value "`n$ip`t$domain" -Force -ErrorAction Stop
    Write-Host "✅ Запись добавлена в файл hosts: $ip -> $domain" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка при добавлении записи: $_" -ForegroundColor Red
    pause
    exit 1
}

# Очищаем DNS кэш
Write-Host "`n🔄 Очистка DNS кэша..." -ForegroundColor Cyan
try {
    ipconfig /flushdns | Out-Null
    Write-Host "✅ DNS кэш очищен" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Не удалось очистить DNS кэш (может потребоваться ручная очистка)" -ForegroundColor Yellow
}

# Проверяем результат
Write-Host "`n📋 Проверка результата:" -ForegroundColor Cyan
$checkContent = Get-Content $hostsPath | Select-String -Pattern $domain
if ($checkContent) {
    Write-Host "✅ Запись найдена:" -ForegroundColor Green
    Write-Host "   $checkContent" -ForegroundColor White
} else {
    Write-Host "❌ Запись не найдена. Проверьте файл hosts вручную" -ForegroundColor Red
}

Write-Host "`n📝 Следующие шаги:" -ForegroundColor Cyan
Write-Host "1. Обновите frontend/.env:" -ForegroundColor White
Write-Host "   HOST=local.severokat.ru" -ForegroundColor Gray
Write-Host "   PORT=3000" -ForegroundColor Gray
Write-Host "   REACT_APP_API_URL=http://local.severokat.ru:5000" -ForegroundColor Gray
Write-Host "`n2. Запустите фронтенд: cd frontend; npm start" -ForegroundColor White
Write-Host "`n3. Откройте браузер: http://local.severokat.ru:3000" -ForegroundColor White
Write-Host "`n4. Настройте домен в @BotFather: local.severokat.ru" -ForegroundColor White

Write-Host "`n✅ Настройка завершена!" -ForegroundColor Green
pause
