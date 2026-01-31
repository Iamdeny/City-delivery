#!/bin/bash
# Скрипт для проверки после каждой фазы миграции

set -e  # Остановить при ошибке

echo "🔍 Запуск проверок после фазы миграции..."
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для проверки команды
check_command() {
    local command=$1
    local description=$2
    
    echo -n "Проверка: $description... "
    if $command > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        $command
        return 1
    fi
}

# Проверка типов
echo "1️⃣  Проверка типов TypeScript..."
if check_command "npm run type-check" "TypeScript types"; then
    echo ""
else
    echo -e "${RED}Ошибка: Проверка типов не прошла!${NC}"
    exit 1
fi

# Проверка линтера
echo "2️⃣  Проверка линтера ESLint..."
if check_command "npm run lint" "ESLint"; then
    echo ""
else
    echo -e "${YELLOW}Предупреждение: Есть проблемы с линтером${NC}"
    echo "Попробуйте: npm run lint:fix"
    echo ""
fi

# Проверка зависимостей
echo "3️⃣  Проверка зависимостей..."
npm run check:deps || true
echo ""

# Итог
echo -e "${GREEN}✅ Все проверки завершены!${NC}"
echo ""
echo "Следующие шаги:"
echo "  • Если есть ошибки - исправьте их перед переходом к следующей фазе"
echo "  • Если есть предупреждения - рассмотрите их исправление"
echo "  • Проверьте тестовые страницы вручную"
echo ""
echo "Подробнее: см. PHASE_CHECKLIST.md"
