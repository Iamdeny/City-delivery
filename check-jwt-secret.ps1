# Скрипт для проверки JWT_SECRET
Write-Host "🔍 Проверка JWT_SECRET" -ForegroundColor Cyan
Write-Host "═" * 60

# 1. Проверка в .env в корне проекта
Write-Host "`n1️⃣ .env в корне проекта:" -ForegroundColor Yellow
if (Test-Path .env) {
    $rootEnv = Get-Content .env | Select-String "JWT_SECRET"
    if ($rootEnv) {
        if ($rootEnv -match "^#") {
            Write-Host "   ⚠️  JWT_SECRET закомментирован!" -ForegroundColor Red
            Write-Host "   $rootEnv" -ForegroundColor Gray
        } else {
            Write-Host "   ✅ JWT_SECRET установлен" -ForegroundColor Green
            Write-Host "   $rootEnv" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ❌ JWT_SECRET не найден" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ .env файл не найден" -ForegroundColor Red
}

# 2. Проверка в backend/.env
Write-Host "`n2️⃣ backend/.env:" -ForegroundColor Yellow
if (Test-Path backend\.env) {
    $backendEnv = Get-Content backend\.env | Select-String "JWT_SECRET"
    if ($backendEnv) {
        if ($backendEnv -match "^#") {
            Write-Host "   ⚠️  JWT_SECRET закомментирован!" -ForegroundColor Red
            Write-Host "   $backendEnv" -ForegroundColor Gray
        } else {
            Write-Host "   ✅ JWT_SECRET установлен" -ForegroundColor Green
            Write-Host "   $backendEnv" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ❌ JWT_SECRET не найден (используется fallback)" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ backend/.env файл не найден" -ForegroundColor Red
}

# 3. Проверка в переменных окружения системы
Write-Host "`n3️⃣ Переменные окружения системы:" -ForegroundColor Yellow
if ($env:JWT_SECRET) {
    Write-Host "   ✅ JWT_SECRET установлен: $($env:JWT_SECRET.Substring(0, [Math]::Min(20, $env:JWT_SECRET.Length)))..." -ForegroundColor Green
} else {
    Write-Host "   ❌ JWT_SECRET не установлен" -ForegroundColor Red
}

# 4. Проверка в Docker контейнере (если запущен)
Write-Host "`n4️⃣ Docker контейнер backend:" -ForegroundColor Yellow
$backendContainer = docker ps -a --format "{{.Names}}" | Select-String "backend"
if ($backendContainer) {
    $containerName = $backendContainer.Line.Trim()
    Write-Host "   📦 Контейнер найден: $containerName" -ForegroundColor Cyan
    
    $dockerJwt = docker exec $containerName env 2>&1 | Select-String "JWT_SECRET"
    if ($dockerJwt) {
        Write-Host "   ✅ JWT_SECRET в контейнере установлен" -ForegroundColor Green
        Write-Host "   $dockerJwt" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ JWT_SECRET в контейнере не найден" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠️  Backend контейнер не запущен" -ForegroundColor Yellow
}

# 5. Проверка через Node.js (реальный используемый)
Write-Host "`n5️⃣ Реальный JWT_SECRET (через Node.js):" -ForegroundColor Yellow
try {
    $nodeResult = node -e "require('dotenv').config({ path: './backend/.env' }); console.log(process.env.JWT_SECRET || 'НЕ УСТАНОВЛЕН (fallback: your-secret-key-change-in-production)')" 2>&1
    if ($nodeResult -match "НЕ УСТАНОВЛЕН") {
        Write-Host "   ⚠️  $nodeResult" -ForegroundColor Red
    } else {
        Write-Host "   ✅ Используется: $($nodeResult.Substring(0, [Math]::Min(30, $nodeResult.Length)))..." -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Ошибка проверки: $_" -ForegroundColor Red
}

Write-Host "`n" + ("═" * 60)
Write-Host "`n💡 Рекомендации:" -ForegroundColor Cyan
Write-Host "   1. Раскомментируй JWT_SECRET в .env файлах" -ForegroundColor White
Write-Host "   2. Убедись что JWT_SECRET одинаковый везде" -ForegroundColor White
Write-Host "   3. JWT_SECRET должен быть минимум 32 символа" -ForegroundColor White
Write-Host "   4. После изменения перезапусти backend" -ForegroundColor White
Write-Host "   5. Пользователям нужно будет перелогиниться" -ForegroundColor White
