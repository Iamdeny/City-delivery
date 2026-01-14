/**
 * Утилиты для работы с маской телефона
 * Формат: +7 (999) 123-45-67
 */

/**
 * Нормализация телефона (убираем все кроме цифр)
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Форматирование телефона в маску +7 (999) 123-45-67
 */
export function formatPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  
  if (normalized.length === 0) {
    return '';
  }

  // Если начинается с 8, заменяем на 7
  let digits = normalized.startsWith('8') ? '7' + normalized.slice(1) : normalized;
  
  // Если не начинается с 7, добавляем
  if (!digits.startsWith('7') && digits.length > 0) {
    digits = '7' + digits;
  }

  // Ограничиваем до 11 цифр
  digits = digits.slice(0, 11);

  // Форматируем
  if (digits.length <= 1) {
    return digits ? `+${digits}` : '';
  } else if (digits.length <= 4) {
    return `+${digits.slice(0, 1)} (${digits.slice(1)}`;
  } else if (digits.length <= 7) {
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  } else if (digits.length <= 9) {
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  } else {
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
}

/**
 * Валидация телефона
 */
export function validatePhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return normalized.length === 11 && normalized.startsWith('7');
}

/**
 * Обработчик изменения телефона с автоматическим форматированием
 */
export function handlePhoneChange(value: string, setValue: (value: string) => void): void {
  // Убираем все кроме цифр и + для обработки
  const digits = value.replace(/[^\d+]/g, '');
  
  // Если начинается с +, оставляем, иначе добавляем
  let processed = digits;
  if (!processed.startsWith('+') && !processed.startsWith('7') && !processed.startsWith('8')) {
    // Если пользователь начал вводить, добавляем +7
    if (processed.length > 0) {
      processed = '7' + processed;
    }
  } else if (processed.startsWith('8')) {
    // Заменяем 8 на 7
    processed = '7' + processed.slice(1);
  }

  // Форматируем
  const formatted = formatPhone(processed);
  setValue(formatted);
}
