# Скрипт для проверки дубликатов React

Write-Host "Проверка версий React..." -ForegroundColor Cyan
npm list react react-dom

Write-Host "`nПоиск всех папок react в node_modules..." -ForegroundColor Cyan
$reactFolders = Get-ChildItem -Path "node_modules" -Filter "react" -Directory -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq "react" -and $_.Parent.Name -ne "react" }
if ($reactFolders) {
    Write-Host "Найдены дубликаты React:" -ForegroundColor Yellow
    $reactFolders | ForEach-Object { Write-Host "  $($_.FullName)" }
} else {
    Write-Host "Дубликатов не найдено" -ForegroundColor Green
}

Write-Host "`nПроверка package.json..." -ForegroundColor Cyan
$packageJson = Get-Content "package.json" | ConvertFrom-Json
Write-Host "React: $($packageJson.dependencies.react)"
Write-Host "React-DOM: $($packageJson.dependencies.'react-dom')"
