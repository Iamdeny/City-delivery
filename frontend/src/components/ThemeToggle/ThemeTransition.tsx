/**
 * iOS-style Theme Transition Overlay
 * Плавный переход между темами с эффектом затемнения/осветления
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ThemeTransition.css';

interface ThemeTransitionProps {
  isTransitioning: boolean;
  isDark: boolean;
}

const ThemeTransition: React.FC<ThemeTransitionProps> = ({
  isTransitioning,
  isDark,
}) => {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      setShowOverlay(true);
      
      // Скрываем overlay через 600ms (время анимации)
      const timer = setTimeout(() => {
        setShowOverlay(false);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          className="theme-transition-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {/* Радиальный градиент для плавного перехода */}
          <motion.div
            className={`theme-transition-gradient ${isDark ? 'theme-transition-gradient--dark' : 'theme-transition-gradient--light'}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 3, opacity: 1 }}
            exit={{ scale: 5, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ThemeTransition;

