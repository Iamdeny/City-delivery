# start-dev.ps1
Write-Host "🚀 Запуск проекта..." -ForegroundColor Green

# Запуск PostgreSQL
Write-Host "📦 Запуск PostgreSQL..." -ForegroundColor Yellow
docker-compose up -d postgres
Start-Sleep -Seconds 5

# Запуск Backend
Write-Host "🔧 Запуск Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Запуск Frontend (опционально)
Write-Host "🎨 Запуск Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"

Write-Host "✅ Готово! Все сервисы запущены." -ForegroundColor Green