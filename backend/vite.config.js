// backend/vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // Позволяет использовать expect, describe, it без импорта
    environment: 'node', // Указывает, что тесты запускаются в Node.js среде
    setupFiles: ['./test-setup.js'], // Опционально: файл для глобальной настройки тестов
    // Дополнительные настройки:
    include: ['**/*.test.js', '**/*.test.ts'], // Какие файлы считать тестами
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'], // Исключить директории
    coverage: {
      provider: 'v8', // Или 'istanbul'
      reporter: ['text', 'json', 'html'],
    },
  },
});
