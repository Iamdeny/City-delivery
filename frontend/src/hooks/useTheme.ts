/**
 * Hook для управления темной/светлой темой
 * OLED-optimized темная тема для экономии батареи
 */

import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'city-delivery-theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme;
    return saved || 'auto';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // Определяем реальную тему (с учетом 'auto')
    const getResolvedTheme = (): 'light' | 'dark' => {
      if (theme === 'auto') {
        // Проверяем системную тему
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
        
        // Проверяем время суток (темная тема с 22:00 до 07:00)
        const hour = new Date().getHours();
        if (hour >= 22 || hour < 7) {
          return 'dark';
        }
        
        return 'light';
      }
      
      return theme;
    };

    const resolved = getResolvedTheme();
    const previousTheme = resolvedTheme;

    // Запускаем анимацию перехода, если тема изменилась
    if (previousTheme !== resolved) {
      setIsTransitioning(true);
      
      // Добавляем небольшую задержку перед сменой темы для плавности
      setTimeout(() => {
        setResolvedTheme(resolved);
        document.documentElement.setAttribute('data-theme', resolved);
      }, 150);

      // Завершаем анимацию и сбрасываем clickPosition
      setTimeout(() => {
        setIsTransitioning(false);
        setClickPosition(null); // ✅ Сбрасываем позицию клика
      }, 800); // Увеличено для spring анимации
    } else {
      setResolvedTheme(resolved);
      document.documentElement.setAttribute('data-theme', resolved);
    }
    
    // Сохраняем выбор пользователя
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, resolvedTheme]); // ✅ Добавлена зависимость resolvedTheme

  // Слушаем изменения системной темы
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const resolved = mediaQuery.matches ? 'dark' : 'light';
      setResolvedTheme(resolved);
      document.documentElement.setAttribute('data-theme', resolved);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'auto';
      return 'light';
    });
  };

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
    isTransitioning,
    clickPosition,
    setClickPosition,
  };
}

