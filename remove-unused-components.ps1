# Скрипт для удаления неиспользуемых компонентов
# Использование: .\remove-unused-components.ps1 [-Phase 1|2|3] [-DryRun]

param(
    [ValidateSet(1, 2, 3, "all")]
    [string]$Phase = "all",
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "`n🧹 Удаление неиспользуемых компонентов" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "`n⚠️  РЕЖИМ ПРОВЕРКИ (Dry Run) - файлы не будут удалены" -ForegroundColor Yellow
}

# Фаза 1: Безопасное удаление (высокий приоритет)
$phase1 = @(
    @{Path = "frontend\src\components\Header\Header.tsx"; Type = "Файл"},
    @{Path = "frontend\src\components\Header\Header.css"; Type = "Файл"},
    @{Path = "frontend\src\components\Product\ProductCard.tsx"; Type = "Файл"},
    @{Path = "frontend\src\components\Product\ProductCard.css"; Type = "Файл"}
)

# Фаза 2: Проверка и удаление (средний приоритет)
$phase2 = @(
    @{Path = "frontend\src\components\Hero\HeroSection.tsx"; Type = "Файл"},
    @{Path = "frontend\src\components\Hero\HeroSection.css"; Type = "Файл"},
    @{Path = "frontend\src\components\ThemeToggle"; Type = "Папка"},
    @{Path = "frontend\src\components\Skeleton\HeaderSkeleton.tsx"; Type = "Файл"}
)

# Фаза 3: Опциональное удаление (низкий приоритет)
$phase3 = @(
    @{Path = "frontend\src\components\CartSyncNotification.tsx"; Type = "Файл"}
)

function Remove-ItemSafe {
    param(
        [string]$Path,
        [string]$Type,
        [bool]$DryRun
    )
    
    if (-not (Test-Path $Path)) {
        Write-Host "   ⚠️  Не найден: $Path" -ForegroundColor Yellow
        return $false
    }
    
    if ($DryRun) {
        Write-Host "   🔍 [DRY RUN] Будет удален: $Path" -ForegroundColor Gray
        return $true
    }
    
    try {
        if ($Type -eq "Папка") {
            Remove-Item -Path $Path -Recurse -Force
            Write-Host "   ✅ Удалена папка: $Path" -ForegroundColor Green
        } else {
            Remove-Item -Path $Path -Force
            Write-Host "   ✅ Удален файл: $Path" -ForegroundColor Green
        }
        return $true
    } catch {
        Write-Host "   ❌ Ошибка при удалении $Path : $_" -ForegroundColor Red
        return $false
    }
}

function Process-Phase {
    param(
        [array]$Items,
        [string]$PhaseName,
        [string]$Description,
        [bool]$DryRun
    )
    
    Write-Host "`n📦 $PhaseName" -ForegroundColor Cyan
    Write-Host "   $Description" -ForegroundColor Gray
    
    $removed = 0
    $skipped = 0
    
    foreach ($item in $Items) {
        if (Remove-ItemSafe -Path $item.Path -Type $item.Type -DryRun $DryRun) {
            $removed++
        } else {
            $skipped++
        }
    }
    
    Write-Host "   📊 Удалено: $removed, Пропущено: $skipped" -ForegroundColor White
    return @{Removed = $removed; Skipped = $skipped}
}

# Обработка фаз
$totalRemoved = 0
$totalSkipped = 0

if ($Phase -eq "1" -or $Phase -eq "all") {
    $result = Process-Phase -Items $phase1 -PhaseName "Фаза 1: Безопасное удаление" `
        -Description "Удаление полностью замененных компонентов (Header, ProductCard)" `
        -DryRun $DryRun
    $totalRemoved += $result.Removed
    $totalSkipped += $result.Skipped
}

if ($Phase -eq "2" -or $Phase -eq "all") {
    $result = Process-Phase -Items $phase2 -PhaseName "Фаза 2: Проверка и удаление" `
        -Description "Удаление неиспользуемых компонентов (HeroSection, ThemeToggle, HeaderSkeleton)" `
        -DryRun $DryRun
    $totalRemoved += $result.Removed
    $totalSkipped += $result.Skipped
}

if ($Phase -eq "3" -or $Phase -eq "all") {
    $result = Process-Phase -Items $phase3 -PhaseName "Фаза 3: Опциональное удаление" `
        -Description "Удаление вспомогательных компонентов (CartSyncNotification)" `
        -DryRun $DryRun
    $totalRemoved += $result.Removed
    $totalSkipped += $result.Skipped
}

# Итоги
Write-Host "`n📊 Итоги:" -ForegroundColor Cyan
Write-Host "   ✅ Удалено: $totalRemoved" -ForegroundColor Green
Write-Host "   ⚠️  Пропущено: $totalSkipped" -ForegroundColor Yellow

if (-not $DryRun) {
    Write-Host "`n✅ Очистка завершена!" -ForegroundColor Green
    Write-Host "`n💡 Рекомендации:" -ForegroundColor Cyan
    Write-Host "   1. Проверьте компиляцию: cd frontend && npm run build" -ForegroundColor White
    Write-Host "   2. Проверьте работу приложения: npm start" -ForegroundColor White
    Write-Host "   3. Создайте коммит: git add . && git commit -m 'Remove unused components'" -ForegroundColor White
} else {
    Write-Host "`n💡 Для реального удаления запустите без параметра -DryRun" -ForegroundColor Yellow
}

Write-Host "`n"
