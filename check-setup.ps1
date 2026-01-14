```powershell
Write-Host "🔍 Проверка настройки проекта..." -ForegroundColor Cyan

# Проверка .env
if (Test-Path backend\.env) {
    Write-Host "✅ backend/.env существует" -ForegroundColor Green
} else {
    Write-Host "❌ backend/.env НЕ НАЙДЕН!" -ForegroundColor Red
}

# Проверка зависимостей
if (Test-Path backend\node_modules) {
    Write-Host "✅ Backend зависимости установлены" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend зависимости не установлены (npm install)" -ForegroundColor Yellow
}

if (Test-Path frontend\node_modules) {
    Write-Host "✅ Frontend зависимости установлены" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend зависимости не установлены (npm install)" -ForegroundColor Yellow
}

# Проверка Docker
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker работает" -ForegroundColor Green
} else {
    Write-Host "⚠️  Docker не запущен" -ForegroundColor Yellow
}

Write-Host "`n📋 Следующие шаги:" -ForegroundColor Cyan
Write-Host "   1. Запусти PostgreSQL: docker-compose up -d postgres"
Write-Host "   2. Примени схему: docker exec -i city-delivery-postgres-1 psql -U admin -d city_delivery < backend/src/database/schema.sql"
Write-Host "   3. Проверь подключение: cd backend && npm run test:db"
Write-Host "   4. Заполни БД: cd backend && npm run seed"
Write-Host "   5. Запусти backend: cd backend && npm run dev"
Write-Host "   6. Запусти frontend: cd frontend && npm start"
```