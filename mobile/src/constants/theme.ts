import { Platform } from 'react-native';

/**
 * Trippence design tokens. Mirrors the mockups: warm off-white ground,
 * charcoal ink and a single teal accent (mint in dark mode).
 */
export const Palette = {
  light: {
    bg: '#F5F4EF',
    card: '#FFFFFF',
    ink: '#15171C',
    muted: '#5B6068',
    line: '#E3E1DA',
    subtle: '#ECEAE3',
    key: '#FFFFFF',
    accent: '#0F766E',
    accentSoft: '#D5EFEA',
    accentOnSoft: '#0B5A54',
    onAccent: '#FFFFFF',
    inverse: '#15171C',
    onInverse: '#FFFFFF',
    /** Dark hero surface (trip card) in both modes, with mint accents. */
    feature: '#15171C',
    onFeature: '#FFFFFF',
    featureAccent: '#5EEAD4',
    danger: '#B42318',
  },
  dark: {
    bg: '#0D0F12',
    card: '#171A1F',
    ink: '#F1F0EB',
    muted: '#9CA1A9',
    line: '#272B32',
    subtle: '#1D2026',
    key: '#16191E',
    accent: '#5EEAD4',
    accentSoft: '#123B37',
    accentOnSoft: '#99F6E4',
    onAccent: '#0D0F12',
    inverse: '#F1F0EB',
    onInverse: '#0D0F12',
    feature: '#16302D',
    onFeature: '#F1F0EB',
    featureAccent: '#5EEAD4',
    danger: '#F97066',
  },
} as const;

export type Colors = { [K in keyof typeof Palette.light]: string };

/** Badge tones per currency, picked by a stable hash of the code. */
export const BadgeTones = {
  light: [
    ['#DBE6F6', '#1E3A8A'],
    ['#E2E4FB', '#3730A3'],
    ['#F9E0E3', '#9F1239'],
    ['#F3E6D8', '#8A4B12'],
    ['#DAF0E6', '#065F46'],
    ['#EFE3F6', '#6B21A8'],
  ],
  dark: [
    ['#1C2A44', '#A9C1EE'],
    ['#25264A', '#BDC0F5'],
    ['#3F1C24', '#F4B3BF'],
    ['#3A2A1A', '#EDC9A1'],
    ['#15352A', '#9EE2C4'],
    ['#33203F', '#D9B8F0'],
  ],
} as const;

/** Font family names registered in the root layout via useFonts. */
export const Font = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/**
 * Space to leave below content so it clears the tab bar. iOS 26 and web float
 * the bar over content; Android's Material bar sits below it, so needs none.
 */
export const BottomTabInset = Platform.select({ ios: 50, android: 0, web: 96 }) ?? 0;
export const MaxContentWidth = 560;
