# Скрипт для исправления frontend/.env
# Использование: .\fix-env.ps1

Write-Host "🔧 Исправление frontend/.env..." -ForegroundColor Cyan

$envPath = "frontend\.env"

if (-not (Test-Path $envPath)) {
    Write-Host "❌ Файл frontend/.env не найден!" -ForegroundColor Red
    Write-Host "Создайте его вручную или скопируйте из .env.example" -ForegroundColor Yellow
    exit 1
}

# Читаем текущий файл
$content = Get-Content $envPath -Raw

# Исправляем REACT_APP_API_URL
# Убираем http:// если есть, оставляем только https://
# Убираем слеш в конце
$content = $content -replace 'REACT_APP_API_URL=http://https://([^\s/]+)/?', 'REACT_APP_API_URL=https://$1'
$content = $content -replace 'REACT_APP_API_URL=https://([^\s/]+)/', 'REACT_APP_API_URL=https://$1'

# Сохраняем исправленный файл
$content | Set-Content $envPath -Encoding UTF8

Write-Host "✅ Файл frontend/.env исправлен!" -ForegroundColor Green
Write-Host "`nПроверьте содержимое:" -ForegroundColor Yellow
Get-Content $envPath | Select-String "REACT_APP_API_URL"

Write-Host "`n💡 Теперь перезапустите фронтенд:" -ForegroundColor Cyan
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
