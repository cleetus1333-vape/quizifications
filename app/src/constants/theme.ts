export const colors = {
  background: '#0a0a0b',
  backgroundGradientStart: '#0a0a0b',
  backgroundGradientEnd: '#111112',
  
  card: '#141416',
  cardElevated: '#1a1a1e',
  cardHighlight: '#222226',
  
  border: '#2a2a2e',
  borderLight: '#3a3a40',
  
  text: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  
  primary: '#c8ff00',
  primaryLight: '#d4ff33',
  primaryDark: '#a8d900',
  primaryGlow: 'rgba(200, 255, 0, 0.15)',
  
  accent: '#c8ff00',
  accentLight: '#d4ff33',
  accentGlow: 'rgba(200, 255, 0, 0.12)',
  
  success: '#10b981',
  successGlow: 'rgba(16, 185, 129, 0.15)',
  
  error: '#ef4444',
  errorGlow: 'rgba(239, 68, 68, 0.15)',
  
  warning: '#f59e0b',
  warningGlow: 'rgba(245, 158, 11, 0.15)',
  
  gold: '#fbbf24',
  goldGlow: 'rgba(251, 191, 36, 0.2)',
};

export const gradients = {
  primary: ['#c8ff00', '#a8d900'],
  accent: ['#c8ff00', '#9fcc00'],
  success: ['#10b981', '#059669'],
  gold: ['#fbbf24', '#f59e0b'],
  dark: ['#1a1a1e', '#0a0a0b'],
  card: ['#1a1a1e', '#141416'],
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  }),
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const borderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  hero: 48,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};
