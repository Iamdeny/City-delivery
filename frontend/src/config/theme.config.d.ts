/**
 * TypeScript definitions for theme configuration
 */

export interface ColorScale {
  50?: string;
  100?: string;
  200?: string;
  300?: string;
  400?: string;
  500?: string;
  600?: string;
  700?: string;
  800?: string;
  900?: string;
  DEFAULT: string;
  light?: string;
  dark?: string;
  bg?: string;
}

export interface Theme {
  mode?: 'light' | 'dark';
  
  colors: {
    primary: ColorScale;
    accent: {
      pink: ColorScale;
      orange: ColorScale;
    };
    success: ColorScale;
    error: ColorScale;
    warning: ColorScale;
    info: ColorScale;
    gray: ColorScale;
    white: string;
    black: string;
    transparent: string;
    current: string;
    background?: {
      primary: string;
      secondary: string;
      tertiary: string;
      elevated: string;
      glass: string;
      overlay: string;
    };
    text?: {
      primary: string;
      secondary: string;
      tertiary: string;
      disabled: string;
      inverse: string;
      onPrimary: string;
    };
    border?: {
      primary: string;
      secondary: string;
      focus: string;
    };
  };

  gradients: {
    primary: string;
    secondary: string;
    radial: string;
    shimmer: string;
  };

  typography: {
    fontFamily: {
      primary: string;
      display: string;
      mono: string;
    };
    fontSize: Record<string, [string, { lineHeight: string; fontWeight: string }]>;
    fontWeight: Record<string, number>;
    lineHeight: Record<string, number>;
    letterSpacing: Record<string, string>;
  };

  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  
  shadows: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    primary: string;
    primaryLg: string;
    glow: string;
  };

  glass: {
    bg: string;
    bgStrong: string;
    border: string;
    blur: string;
    blurStrong: string;
  };

  animation: {
    easing: Record<string, string>;
    duration: Record<string, string>;
    delay: Record<string, string>;
  };

  breakpoints: Record<string, string>;
  zIndex: Record<string, number>;

  components: {
    button: {
      height: Record<string, string>;
      padding: Record<string, string>;
    };
    input: {
      height: string;
      padding: string;
      borderWidth: string;
    };
    card: {
      padding: string;
      paddingLg: string;
    };
  };

  accessibility: {
    focusRing: string;
    focusRingOffset: string;
    touchTarget: string;
    touchTargetRecommended: string;
  };
}

export const theme: Theme;
export const lightTheme: Theme;
export const darkTheme: Theme;

export function getTheme(mode?: 'light' | 'dark'): Theme;
export function getCSSVariable(path: string, theme?: Theme): string | null;

export default theme;

