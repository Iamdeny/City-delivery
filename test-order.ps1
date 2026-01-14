# Скрипт для создания тестового заказа
# Использование: .\test-order.ps1

$API_URL = "http://localhost:5000/api"

Write-Host "🛒 Тестирование создания заказа" -ForegroundColor Cyan
Write-Host ""

# 1. Проверка health
Write-Host "1️⃣  Проверка доступности API..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$API_URL/health" -Method GET -UseBasicParsing
    $healthJson = $health.Content | ConvertFrom-Json
    Write-Host "   ✅ API доступен: $($healthJson.status)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ API недоступен. Убедитесь, что backend запущен (npm run dev в папке backend)" -ForegroundColor Red
    exit 1
}

# 2. Авторизация
Write-Host ""
Write-Host "2️⃣  Авторизация тестового пользователя..." -ForegroundColor Yellow
$loginBody = @{
    email = "customer@test.com"
    password = "123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$API_URL/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $loginJson = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginJson.token) {
        $token = $loginJson.token
        Write-Host "   ✅ Авторизация успешна" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Не удалось получить токен" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Ошибка авторизации: $_" -ForegroundColor Red
    Write-Host "   💡 Убедитесь, что тестовые данные загружены (node backend/scripts/seed-data.js)" -ForegroundColor Yellow
    exit 1
}

# 3. Получение списка товаров
Write-Host ""
Write-Host "3️⃣  Получение списка товаров..." -ForegroundColor Yellow
try {
    $productsResponse = Invoke-WebRequest -Uri "$API_URL/products" -Method GET -UseBasicParsing
    $products = $productsResponse.Content | ConvertFrom-Json
    
    if ($products.Count -eq 0) {
        Write-Host "   ⚠️  Товары не найдены. Запустите seed-data.js" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "   ✅ Найдено товаров: $($products.Count)" -ForegroundColor Green
    Write-Host "   📦 Первые 3 товара:" -ForegroundColor Cyan
    $products | Select-Object -First 3 | ForEach-Object {
        Write-Host "      - $($_.name) (ID: $($_.id), Цена: $($_.price) ₽)" -ForegroundColor Gray
    }
    
    # Берем первые 2 товара для заказа
    $product1 = $products[0]
    $product2 = $products[1]
} catch {
    Write-Host "   ❌ Ошибка получения товаров: $_" -ForegroundColor Red
    exit 1
}

# 4. Создание заказа
Write-Host ""
Write-Host "4️⃣  Создание тестового заказа..." -ForegroundColor Yellow
$orderBody = @{
    items = @(
        @{
            productId = $product1.id
            quantity = 2
        },
        @{
            productId = $product2.id
            quantity = 1
        }
    )
    address = "ул. Тестовая, д. 1, кв. 10"
    phone = "+7 (999) 123-45-67"
    comment = "Тестовый заказ из PowerShell скрипта"
    latitude = 55.7558
    longitude = 37.6173
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $orderResponse = Invoke-WebRequest -Uri "$API_URL/orders" -Method POST -Body $orderBody -Headers $headers -UseBasicParsing
    $order = $orderResponse.Content | ConvertFrom-Json
    
    Write-Host "   ✅ Заказ успешно создан!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Детали заказа:" -ForegroundColor Cyan
    Write-Host "   ID заказа: $($order.order.id)" -ForegroundColor White
    Write-Host "   Статус: $($order.order.status)" -ForegroundColor White
    Write-Host "   Сумма: $($order.order.total) ₽" -ForegroundColor White
    Write-Host "   Адрес: $($order.order.address)" -ForegroundColor White
    Write-Host "   Телефон: $($order.order.phone)" -ForegroundColor White
    Write-Host ""
    Write-Host "🛍️  Товары в заказе:" -ForegroundColor Cyan
    $order.order.items | ForEach-Object {
        Write-Host "   - $($_.name) x$($_.quantity) = $($_.subtotal) ₽" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "✅ Тестовый заказ создан успешно!" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Ошибка создания заказа: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Ответ сервера: $responseBody" -ForegroundColor Yellow
    }
    exit 1
}
