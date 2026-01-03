/**
 * Централизованная конфигурация анимаций (2026 тренды)
 * Spring physics для естественных переходов
 */

// Spring Physics конфигурация
export const SPRING_CONFIGS = {
  // Мягкий, упругий эффект для основных переходов
  gentle: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 15,
    mass: 0.5,
  },
  
  // Быстрый, отзывчивый для UI элементов
  snappy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
    mass: 0.3,
  },
  
  // Плавный для больших переходов
  smooth: {
    type: 'spring' as const,
    stiffness: 80,
    damping: 20,
    mass: 1,
  },
  
  // Упругий для микровзаимодействий
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 10,
    mass: 0.2,
  },
} as const;

// Easing functions (iOS-style)
export const EASINGS = {
  ios: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number],
  smooth: [0.4, 0, 0.2, 1] as [number, number, number, number],
  enter: [0, 0, 0.2, 1] as [number, number, number, number],
  exit: [0.4, 0, 1, 1] as [number, number, number, number],
} as const;

// Длительности (для non-spring анимаций)
export const DURATIONS = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
} as const;

// Конфигурация для темы
export const THEME_ANIMATION = {
  // Circular reveal из точки клика
  circularReveal: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 50, opacity: 1 },
    exit: { scale: 60, opacity: 0 },
    transition: {
      ...SPRING_CONFIGS.gentle,
      opacity: { duration: DURATIONS.normal },
    },
  },
  
  // Анимация иконки
  icon: {
    rotate: {
      initial: { rotate: -180, scale: 0 },
      animate: { rotate: 0, scale: 1 },
      exit: { rotate: 180, scale: 0 },
      transition: SPRING_CONFIGS.bouncy,
    },
    pulse: {
      scale: 1.15, // Spring поддерживает только 2 keyframes (from → to)
      transition: {
        ...SPRING_CONFIGS.bouncy,
        // Bounce эффект: scale: 1 → 1.15 → 1 (автоматически с spring)
      },
    },
  },
  
  // Анимация кнопки
  button: {
    hover: { scale: 1.08, transition: SPRING_CONFIGS.snappy },
    tap: { scale: 0.92, transition: SPRING_CONFIGS.bouncy },
  },
} as const;

// Инерционный скролл
export const SCROLL_PHYSICS = {
  drag: {
    drag: true,
    dragConstraints: { top: 0, bottom: 0, left: 0, right: 0 },
    dragElastic: 0.1,
    dragTransition: { bounceStiffness: 300, bounceDamping: 20 },
  },
  inertia: {
    type: 'inertia' as const,
    velocity: 50,
    power: 0.8,
    timeConstant: 750,
  },
} as const;

// Haptic Feedback
export const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [15],
      heavy: [20],
    };
    navigator.vibrate(patterns[style]);
  }
  
  // Web Vibration API
  if (window.navigator && (window.navigator as any).vibrate) {
    const intensity = {
      light: 10,
      medium: 15,
      heavy: 20,
    };
    (window.navigator as any).vibrate(intensity[style]);
  }
};

// GPU оптимизация
export const GPU_OPTIMIZED = {
  transform: {
    willChange: 'transform',
    WebkitTransform: 'translateZ(0)',
    transform: 'translateZ(0)',
    WebkitBackfaceVisibility: 'hidden',
    backfaceVisibility: 'hidden',
  },
  opacity: {
    willChange: 'opacity',
  },
} as const;

// Экспорт типов
export type SpringConfig = typeof SPRING_CONFIGS[keyof typeof SPRING_CONFIGS];
export type EasingConfig = typeof EASINGS[keyof typeof EASINGS];

