# Скрипт для запуска PostgreSQL через Docker
Write-Host "🐳 Запуск PostgreSQL через Docker..." -ForegroundColor Cyan

# Проверка Docker
Write-Host "`n1️⃣ Проверка Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "   ✅ Docker установлен: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker не найден!" -ForegroundColor Red
    Write-Host "   💡 Установите Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
    exit 1
}

# Проверка Docker Desktop
Write-Host "`n2️⃣ Проверка Docker Desktop..." -ForegroundColor Yellow
try {
    docker ps 2>&1 | Out-Null
    Write-Host "   ✅ Docker Desktop запущен" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker Desktop не запущен!" -ForegroundColor Red
    Write-Host "   💡 Запустите Docker Desktop и попробуйте снова" -ForegroundColor Cyan
    exit 1
}

# Проверка .env файла
Write-Host "`n3️⃣ Проверка .env файла..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "   ✅ .env в корне проекта найден" -ForegroundColor Green
    $dbPassword = (Get-Content .env | Select-String "^DB_PASSWORD=") -replace "DB_PASSWORD=", ""
    if ($dbPassword) {
        Write-Host "   ✅ DB_PASSWORD установлен ($($dbPassword.Length) символов)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  DB_PASSWORD не найден в .env" -ForegroundColor Yellow
        Write-Host "   💡 Создайте .env файл с DB_PASSWORD=password" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ⚠️  .env в корне проекта не найден" -ForegroundColor Yellow
    Write-Host "   💡 Создайте .env файл с DB_PASSWORD=password" -ForegroundColor Cyan
}

# Запуск PostgreSQL
Write-Host "`n4️⃣ Запуск PostgreSQL контейнера..." -ForegroundColor Yellow
try {
    docker-compose up -d postgres 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ PostgreSQL контейнер запущен" -ForegroundColor Green
        
        # Ждем пока PostgreSQL запустится
        Write-Host "`n⏳ Ожидание запуска PostgreSQL (10 секунд)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        # Проверка статуса
        $containerStatus = docker ps --format "{{.Names}} {{.Status}}" | Select-String "postgres"
        if ($containerStatus) {
            Write-Host "   ✅ Контейнер работает: $containerStatus" -ForegroundColor Green
        }
    } else {
        Write-Host "   ❌ Ошибка запуска контейнера" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Ошибка: $_" -ForegroundColor Red
    exit 1
}

# Проверка подключения
Write-Host "`n5️⃣ Проверка подключения к PostgreSQL..." -ForegroundColor Yellow
try {
    $testResult = docker exec city-delivery-postgres-1 psql -U admin -d city_delivery -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Подключение успешно!" -ForegroundColor Green
        Write-Host "   $testResult" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  База данных city_delivery может не существовать" -ForegroundColor Yellow
        Write-Host "   💡 Примените схему: docker exec -i city-delivery-postgres-1 psql -U admin -d city_delivery < backend/src/database/schema.sql" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ⚠️  Не удалось проверить подключение (контейнер может еще запускаться)" -ForegroundColor Yellow
}

Write-Host "`n" + ("═" * 60)
Write-Host "✅ PostgreSQL готов к использованию!" -ForegroundColor Green
Write-Host "`n💡 Следующие шаги:" -ForegroundColor Cyan
Write-Host "   1. Проверьте подключение: cd backend; npm run test:db" -ForegroundColor White
Write-Host "   2. Если база данных пустая, примените схему:" -ForegroundColor White
Write-Host "      docker exec -i city-delivery-postgres-1 psql -U admin -d city_delivery < backend/src/database/schema.sql" -ForegroundColor White
