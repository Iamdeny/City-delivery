import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      // Глобальные формы и тени в стиле Самоката
      borderRadius: {
        lg: 'var(--samokat-radius-lg)', // ~16px
        xl: 'var(--samokat-radius-xl)', // ~18px
        '2xl': 'var(--samokat-radius-2xl)', // ~20px
        '3xl': 'var(--samokat-radius-3xl)', // ~24px
        full: '9999px',
      },
      boxShadow: {
        sm: 'var(--samokat-shadow-sm)',
        DEFAULT: 'var(--samokat-shadow-md)',
        md: 'var(--samokat-shadow-md)',
        lg: 'var(--samokat-shadow-lg)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'cart-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-scale': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        fadeIn: 'fadeIn 0.3s ease',
        slideUp: 'slideUp 0.3s ease-in-out',
        scaleIn: 'scaleIn 0.3s ease',
        'cart-pulse': 'cart-pulse 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'fade-scale': 'fade-scale 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
};
export default config;
