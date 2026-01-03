/**
 * Переключатель темы (Light / Dark / Auto)
 * Spring physics анимации (2026 тренды)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { THEME_ANIMATION, triggerHaptic } from '../../config/animations';
import './ThemeToggle.css';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, isDark, setClickPosition } = useTheme();
  const [isPulsing, setIsPulsing] = useState(false);

  // Обработчик клика с сохранением позиции
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    // Сохраняем позицию клика для circular reveal
    setClickPosition({ x, y });
    
    // Запускаем пульсацию иконки
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 400);
    
    // Haptic feedback
    triggerHaptic('light');
    
    // Переключаем тему
    toggleTheme();
  };

  // Иконки для разных тем
  const getIcon = () => {
    switch (theme) {
      case 'light':
        return (
          <motion.svg 
            key="light"
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none"
            initial={THEME_ANIMATION.icon.rotate.initial}
            animate={isPulsing ? {
              rotate: 0,
              scale: [1, THEME_ANIMATION.icon.pulse.scale],
            } : THEME_ANIMATION.icon.rotate.animate}
            exit={THEME_ANIMATION.icon.rotate.exit}
            transition={isPulsing ? THEME_ANIMATION.icon.pulse.transition : THEME_ANIMATION.icon.rotate.transition}
          >
            <circle cx="12" cy="12" r="5" fill="currentColor" />
            <motion.path
              d="M12 1v3m0 16v3M4.22 4.22l2.12 2.12m11.32 11.32l2.12 2.12M1 12h3m16 0h3M4.22 19.78l2.12-2.12m11.32-11.32l2.12-2.12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            />
          </motion.svg>
        );
      case 'dark':
        return (
          <motion.svg 
            key="dark"
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none"
            initial={THEME_ANIMATION.icon.rotate.initial}
            animate={isPulsing ? {
              rotate: 0,
              scale: [1, THEME_ANIMATION.icon.pulse.scale],
            } : THEME_ANIMATION.icon.rotate.animate}
            exit={THEME_ANIMATION.icon.rotate.exit}
            transition={isPulsing ? THEME_ANIMATION.icon.pulse.transition : THEME_ANIMATION.icon.rotate.transition}
          >
            <motion.path
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
              fill="currentColor"
              animate={{ rotate: [0, -12, 0] }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: [0.4, 0, 0.2, 1] 
              }}
            />
          </motion.svg>
        );
      case 'auto':
        return (
          <motion.svg 
            key="auto"
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none"
            initial={THEME_ANIMATION.icon.rotate.initial}
            animate={isPulsing ? {
              rotate: 0,
              scale: [1, THEME_ANIMATION.icon.pulse.scale],
            } : THEME_ANIMATION.icon.rotate.animate}
            exit={THEME_ANIMATION.icon.rotate.exit}
            transition={isPulsing ? THEME_ANIMATION.icon.pulse.transition : THEME_ANIMATION.icon.rotate.transition}
          >
            <motion.path
              d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
              fill="currentColor"
              opacity="0.5"
              animate={{ opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
            />
            <circle cx="12" cy="12" r="5" fill="currentColor" />
          </motion.svg>
        );
      default:
        return null;
    }
  };

  // Текст для разных тем
  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Светлая';
      case 'dark':
        return 'Темная';
      case 'auto':
        return 'Авто';
      default:
        return '';
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`theme-toggle ${isDark ? 'theme-toggle--dark' : ''}`}
      aria-label={`Переключить тему (текущая: ${getLabel()})`}
      whileHover={THEME_ANIMATION.button.hover}
      whileTap={THEME_ANIMATION.button.tap}
    >
      <div className="theme-toggle__icon">
        <AnimatePresence mode="wait">
          {getIcon()}
        </AnimatePresence>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.span
          key={theme}
          className="theme-toggle__label"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          {getLabel()}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
};

export default ThemeToggle;
