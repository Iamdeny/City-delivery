import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Проверка валидности URL изображения для использования с next/image
 * Поддерживает абсолютные URL (http/https) и относительные пути (/path/to/image)
 * @param url - URL для проверки
 * @returns true если URL валиден для next/image, false в противном случае
 */
export function isValidImageUrl(url: string | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('data:')) return false;
  
  try {
    // Абсолютные URL (http://, https://)
    new URL(url);
    return true;
  } catch {
    // Относительные пути (/path/to/image.jpg)
    return url.startsWith('/');
  }
}
