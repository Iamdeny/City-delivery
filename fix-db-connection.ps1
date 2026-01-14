# Скрипт для диагностики и исправления подключения к БД
Write-Host "🔍 Диагностика подключения к базе данных" -ForegroundColor Cyan
Write-Host "═" * 60

# 1. Проверка .env файлов
Write-Host "`n1️⃣ Проверка .env файлов:" -ForegroundColor Yellow

$rootEnvExists = Test-Path .env
$backendEnvExists = Test-Path backend\.env

if ($rootEnvExists) {
    Write-Host "   ✅ .env в корне проекта существует" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .env в корне проекта НЕ найден (не критично для локального запуска)" -ForegroundColor Yellow
}

if ($backendEnvExists) {
    Write-Host "   ✅ backend/.env существует" -ForegroundColor Green
    
    # Проверка переменных в backend/.env
    $backendEnv = Get-Content backend\.env -ErrorAction SilentlyContinue
    $dbHost = ($backendEnv | Select-String "^DB_HOST=") -replace "DB_HOST=", ""
    $dbPassword = ($backendEnv | Select-String "^DB_PASSWORD=") -replace "DB_PASSWORD=", ""
    $dbName = ($backendEnv | Select-String "^DB_NAME=") -replace "DB_NAME=", ""
    
    Write-Host "   📊 DB_HOST: $($dbHost -or 'NOT SET')" -ForegroundColor $(if ($dbHost) { "Green" } else { "Red" })
    Write-Host "   📊 DB_PASSWORD: $(if ($dbPassword) { 'SET (' + $dbPassword.Length + ' chars)' } else { 'NOT SET' })" -ForegroundColor $(if ($dbPassword) { "Green" } else { "Red" })
    Write-Host "   📊 DB_NAME: $($dbName -or 'NOT SET')" -ForegroundColor $(if ($dbName) { "Green" } else { "Red" })
} else {
    Write-Host "   ❌ backend/.env НЕ найден!" -ForegroundColor Red
    Write-Host "   💡 Создайте файл backend/.env с настройками БД" -ForegroundColor Cyan
}

# 2. Проверка Docker контейнера
Write-Host "`n2️⃣ Проверка Docker контейнера PostgreSQL:" -ForegroundColor Yellow
$postgresContainer = docker ps -a --format "{{.Names}}" | Select-String "postgres"
if ($postgresContainer) {
    $containerName = $postgresContainer.Line.Trim()
    Write-Host "   ✅ Контейнер найден: $containerName" -ForegroundColor Green
    
    $containerStatus = docker inspect --format='{{.State.Status}}' $containerName 2>&1
    if ($containerStatus -eq "running") {
        Write-Host "   ✅ Контейнер запущен" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Контейнер остановлен. Запустите: docker-compose up -d postgres" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Контейнер PostgreSQL не найден" -ForegroundColor Red
    Write-Host "   💡 Запустите: docker-compose up -d postgres" -ForegroundColor Cyan
}

# 3. Проверка подключения через Node.js
Write-Host "`n3️⃣ Проверка загрузки переменных через Node.js:" -ForegroundColor Yellow
try {
    Push-Location backend
    $nodeResult = node -e "require('dotenv').config(); console.log('DB_HOST=' + (process.env.DB_HOST || 'NOT SET')); console.log('DB_PASSWORD=' + (process.env.DB_PASSWORD ? 'SET' : 'NOT SET')); console.log('DB_NAME=' + (process.env.DB_NAME || 'NOT SET'));" 2>&1
    
    if ($nodeResult -match "NOT SET") {
        Write-Host "   ⚠️  Некоторые переменные не загружены!" -ForegroundColor Red
        Write-Host "   $nodeResult" -ForegroundColor Gray
    } else {
        Write-Host "   ✅ Переменные загружены корректно" -ForegroundColor Green
        Write-Host "   $nodeResult" -ForegroundColor Gray
    }
    Pop-Location
} catch {
    Write-Host "   ❌ Ошибка проверки: $_" -ForegroundColor Red
    Pop-Location
}

# 4. Тест подключения к БД
Write-Host "`n4️⃣ Тест подключения к базе данных:" -ForegroundColor Yellow
try {
    Push-Location backend
    $dbTest = npm run test:db 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Подключение к БД успешно!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Ошибка подключения к БД" -ForegroundColor Red
        Write-Host "   $dbTest" -ForegroundColor Gray
    }
    Pop-Location
} catch {
    Write-Host "   ❌ Ошибка теста: $_" -ForegroundColor Red
    Pop-Location
}

Write-Host "`n" + ("═" * 60)
Write-Host "`n💡 Рекомендации:" -ForegroundColor Cyan

if (-not $backendEnvExists) {
    Write-Host "   1. Создайте backend/.env файл с настройками БД" -ForegroundColor White
    Write-Host "   2. Убедитесь, что DB_PASSWORD совпадает с паролем в docker-compose.yml" -ForegroundColor White
}

if ($postgresContainer -and ($containerStatus -ne "running")) {
    Write-Host "   1. Запустите Docker контейнер: docker-compose up -d postgres" -ForegroundColor White
}

Write-Host "   2. После исправления перезапустите backend: cd backend; npm run dev" -ForegroundColor White
Write-Host "   3. Проверьте логи сервера на наличие ошибок подключения" -ForegroundColor White
