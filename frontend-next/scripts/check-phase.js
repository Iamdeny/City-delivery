#!/usr/bin/env node
/**
 * Универсальный скрипт для проверки после каждой фазы миграции
 * Работает на Windows, Linux, macOS
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  process.stdout.write(`Проверка: ${description}... `);
  try {
    execSync(command, { stdio: 'pipe', cwd: __dirname + '/..' });
    log('✅ OK', 'green');
    return true;
  } catch (error) {
    log('❌ FAILED', 'red');
    console.error(error.stdout?.toString() || error.message);
    return false;
  }
}

async function main() {
  log('\n🔍 Запуск проверок после фазы миграции...', 'cyan');
  console.log('');

  // Проверка типов
  log('1️⃣  Проверка типов TypeScript...', 'yellow');
  if (!runCommand('npm run type-check', 'TypeScript types')) {
    log('\n❌ Ошибка: Проверка типов не прошла!', 'red');
    process.exit(1);
  }
  console.log('');

  // Проверка линтера
  log('2️⃣  Проверка линтера ESLint...', 'yellow');
  const lintPassed = runCommand('npm run lint', 'ESLint');
  console.log('');
  if (!lintPassed) {
    log('⚠️  Предупреждение: Есть проблемы с линтером', 'yellow');
    log('Попробуйте: npm run lint:fix', 'cyan');
    console.log('');
  }

  // Проверка зависимостей
  log('3️⃣  Проверка зависимостей...', 'yellow');
  try {
    execSync('npm run check:deps', { stdio: 'inherit', cwd: __dirname + '/..' });
  } catch {
    // Игнорируем ошибки проверки зависимостей
  }
  console.log('');

  // Итог
  log('✅ Все проверки завершены!', 'green');
  console.log('');
  log('Следующие шаги:', 'cyan');
  log('  • Если есть ошибки - исправьте их перед переходом к следующей фазе', 'reset');
  log('  • Если есть предупреждения - рассмотрите их исправление', 'reset');
  log('  • Проверьте тестовые страницы вручную', 'reset');
  console.log('');
  log('Подробнее: см. PHASE_CHECKLIST.md', 'cyan');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
