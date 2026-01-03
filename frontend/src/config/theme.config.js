/**
 * CITY DELIVERY - THEME CONFIGURATION
 * Централизованная конфигурация UI-кита
 * Версия: 1.0.0
 * Дата: 3 января 2026
 */

const theme = {
  // ===== ЦВЕТА =====
  colors: {
    // Бренд-цвета (Primary)
    primary: {
      50: '#F5F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      300: '#C4B5FD',
      400: '#A78BFA',
      500: '#8B5CF6',  // Основной
      600: '#7C3AED',  // Hover
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
      DEFAULT: '#8B5CF6',
    },

    // Акцентные цвета
    accent: {
      pink: {
        DEFAULT: '#EC4899',
        light: '#F472B6',
        dark: '#DB2777',
      },
      orange: {
        DEFAULT: '#F97316',
        light: '#FB923C',
        dark: '#EA580C',
      },
    },

    // Семантические цвета
    success: {
      DEFAULT: '#10B981',
      light: '#34D399',
      dark: '#059669',
      bg: '#D1FAE5',
    },
    error: {
      DEFAULT: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
      bg: '#FEE2E2',
    },
    warning: {
      DEFAULT: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
      bg: '#FEF3C7',
    },
    info: {
      DEFAULT: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
      bg: '#DBEAFE',
    },

    // Нейтральные цвета (Gray scale)
    gray: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },

    // Специальные цвета
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    current: 'currentColor',
  },

  // ===== ГРАДИЕНТЫ =====
  gradients: {
    primary: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F97316 100%)',
    secondary: 'linear-gradient(135deg, #F97316 0%, #EC4899 50%, #8B5CF6 100%)',
    radial: 'radial-gradient(circle at top left, #8B5CF6, #EC4899, #F97316)',
    shimmer: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
  },

  // ===== ТИПОГРАФИКА =====
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", Roboto, sans-serif',
      display: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"SF Mono", Monaco, Consolas, "Liberation Mono", monospace',
    },

    fontSize: {
      // Заголовки
      h1: ['48px', { lineHeight: '1.2', fontWeight: '700' }],
      h2: ['40px', { lineHeight: '1.25', fontWeight: '700' }],
      h3: ['32px', { lineHeight: '1.3', fontWeight: '600' }],
      h4: ['24px', { lineHeight: '1.4', fontWeight: '600' }],
      h5: ['20px', { lineHeight: '1.5', fontWeight: '600' }],
      h6: ['18px', { lineHeight: '1.5', fontWeight: '600' }],

      // Тело
      base: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
      lg: ['18px', { lineHeight: '1.5', fontWeight: '400' }],
      sm: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
      xs: ['12px', { lineHeight: '1.5', fontWeight: '400' }],
      xxs: ['10px', { lineHeight: '1.5', fontWeight: '400' }],
    },

    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },

    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },

    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // ===== SPACING (8px Grid) =====
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
    32: '128px',
    40: '160px',
    48: '192px',
    56: '224px',
    64: '256px',

    // Семантические
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  // ===== BORDER RADIUS =====
  borderRadius: {
    none: '0px',
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    full: '9999px',

    // Семантические
    button: '12px',
    card: '20px',
    modal: '24px',
    input: '12px',
    badge: '9999px',
  },

  // ===== SHADOWS =====
  shadows: {
    // Light theme
    light: {
      xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
      sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      primary: '0 4px 16px rgba(139, 92, 246, 0.3)',
      primaryLg: '0 8px 24px rgba(139, 92, 246, 0.4)',
      glow: '0 0 20px rgba(139, 92, 246, 0.4)',
    },
    
    // Dark theme
    dark: {
      xs: '0 1px 2px rgba(0, 0, 0, 0.5)',
      sm: '0 1px 3px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
      primary: '0 4px 16px rgba(167, 139, 250, 0.5)',
      primaryLg: '0 8px 24px rgba(167, 139, 250, 0.6)',
      glow: '0 0 30px rgba(167, 139, 250, 0.5)',
    },
  },

  // ===== GLASSMORPHISM =====
  glass: {
    light: {
      bg: 'rgba(255, 255, 255, 0.7)',
      bgStrong: 'rgba(255, 255, 255, 0.9)',
      border: 'rgba(255, 255, 255, 0.18)',
      blur: 'blur(10px)',
      blurStrong: 'blur(20px)',
    },
    dark: {
      bg: 'rgba(28, 28, 30, 0.7)',
      bgStrong: 'rgba(28, 28, 30, 0.9)',
      border: 'rgba(255, 255, 255, 0.1)',
      blur: 'blur(20px)',
      blurStrong: 'blur(40px)',
    },
  },

  // ===== АНИМАЦИИ =====
  animation: {
    // Timing functions
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      bounce: 'cubic-bezier(0.68, -0.25, 0.265, 1.25)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },

    // Duration
    duration: {
      instant: '0ms',
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '800ms',
    },

    // Delays
    delay: {
      none: '0ms',
      short: '100ms',
      medium: '200ms',
      long: '400ms',
    },
  },

  // ===== BREAKPOINTS =====
  breakpoints: {
    xs: '0px',
    sm: '480px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // ===== Z-INDEX =====
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    notification: 1080,
  },

  // ===== COMPONENT TOKENS =====
  components: {
    button: {
      height: {
        sm: '32px',
        md: '40px',
        lg: '48px',
      },
      padding: {
        sm: '8px 16px',
        md: '12px 24px',
        lg: '16px 32px',
      },
    },

    input: {
      height: '48px',
      padding: '12px 16px',
      borderWidth: '2px',
    },

    card: {
      padding: '16px',
      paddingLg: '24px',
    },
  },

  // ===== ACCESSIBILITY =====
  accessibility: {
    focusRing: '0 0 0 3px rgba(139, 92, 246, 0.5)',
    focusRingOffset: '2px',
    touchTarget: '44px',
    touchTargetRecommended: '48px',
  },
};

// ===== THEME PRESETS =====
export const lightTheme = {
  ...theme,
  mode: 'light',
  colors: {
    ...theme.colors,
    background: {
      primary: '#FFFFFF',
      secondary: '#FAFAFA',
      tertiary: '#F5F5F5',
      elevated: '#FFFFFF',
      glass: 'rgba(255, 255, 255, 0.7)',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
      tertiary: '#94A3B8',
      disabled: '#CBD5E1',
      inverse: '#FFFFFF',
      onPrimary: '#FFFFFF',
    },
    border: {
      primary: '#E2E8F0',
      secondary: '#F1F5F9',
      focus: '#8B5CF6',
    },
  },
  shadows: theme.shadows.light,
  glass: theme.glass.light,
};

export const darkTheme = {
  ...theme,
  mode: 'dark',
  colors: {
    ...theme.colors,
    primary: {
      ...theme.colors.primary,
      DEFAULT: '#A78BFA', // Светлее для темной темы
    },
    background: {
      primary: '#000000',    // Pure black для OLED
      secondary: '#0A0A0A',
      tertiary: '#1C1C1E',
      elevated: '#2C2C2E',
      glass: 'rgba(28, 28, 30, 0.7)',
      overlay: 'rgba(0, 0, 0, 0.8)',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A0A0A0',
      tertiary: '#8E8E93',
      disabled: '#4A4A4A',
      inverse: '#000000',
      onPrimary: '#FFFFFF',
    },
    border: {
      primary: '#2C2C2E',
      secondary: '#3C3C3E',
      focus: '#A78BFA',
    },
  },
  shadows: theme.shadows.dark,
  glass: theme.glass.dark,
};

// ===== EXPORTS =====
export default theme;
export { theme, lightTheme, darkTheme };

// ===== UTILITY FUNCTIONS =====
export const getTheme = (mode = 'light') => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

export const getCSSVariable = (path, theme = lightTheme) => {
  const keys = path.split('.');
  let value = theme;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) return null;
  }
  
  return value;
};

// Пример использования:
// getCSSVariable('colors.primary.500', lightTheme) => '#8B5CF6'
// getCSSVariable('spacing.md', darkTheme) => '16px'

