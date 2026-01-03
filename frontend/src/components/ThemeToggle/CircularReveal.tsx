/**
 * Circular Reveal Effect для смены темы
 * Эффект "раскрывающегося круга" из точки клика (тренд 2026)
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { THEME_ANIMATION, triggerHaptic } from '../../config/animations';
import './CircularReveal.css';

interface CircularRevealProps {
  isTransitioning: boolean;
  isDark: boolean;
  clickPosition: { x: number; y: number } | null;
}

export const CircularReveal: React.FC<CircularRevealProps> = ({
  isTransitioning,
  isDark,
  clickPosition,
}) => {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      setShowOverlay(true);
      
      // Haptic feedback при старте анимации
      triggerHaptic('light');
      
      // Скрываем overlay после завершения spring анимации
      const timer = setTimeout(() => {
        setShowOverlay(false);
        // Haptic feedback при завершении
        triggerHaptic('medium');
      }, 800); // Увеличено для spring анимации

      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  // Позиция круга (центр клика или центр экрана)
  const position = clickPosition || { 
    x: window.innerWidth / 2, 
    y: window.innerHeight / 2 
  };

  return (
    <AnimatePresence>
      {showOverlay && (
        <div className="circular-reveal-container">
          {/* Основной круг с spring physics */}
          <motion.div
            className={`circular-reveal ${isDark ? 'circular-reveal--dark' : 'circular-reveal--light'}`}
            style={{
              left: position.x,
              top: position.y,
            }}
            initial={THEME_ANIMATION.circularReveal.initial}
            animate={THEME_ANIMATION.circularReveal.animate}
            exit={THEME_ANIMATION.circularReveal.exit}
            transition={THEME_ANIMATION.circularReveal.transition}
          />
          
          {/* Дополнительные волны для depth эффекта */}
          <motion.div
            className={`circular-reveal-wave ${isDark ? 'circular-reveal--dark' : 'circular-reveal--light'}`}
            style={{
              left: position.x,
              top: position.y,
            }}
            initial={{ scale: 0, opacity: 0.3 }}
            animate={{ scale: 45, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 80,
              damping: 20,
              delay: 0.05,
            }}
          />
          
          <motion.div
            className={`circular-reveal-wave ${isDark ? 'circular-reveal--dark' : 'circular-reveal--light'}`}
            style={{
              left: position.x,
              top: position.y,
            }}
            initial={{ scale: 0, opacity: 0.2 }}
            animate={{ scale: 40, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 60,
              damping: 25,
              delay: 0.1,
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

