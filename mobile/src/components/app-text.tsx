import { StyleSheet, Text, type TextProps } from 'react-native';

import { Font } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

type Variant = 'title' | 'body' | 'bodyStrong' | 'small' | 'caption' | 'label' | 'number' | 'numberLarge';

export type AppTextProps = TextProps & {
  variant?: Variant;
  tone?: 'ink' | 'muted' | 'accent' | 'onAccent' | 'danger';
};

export function AppText({ variant = 'body', tone = 'ink', style, ...rest }: AppTextProps) {
  const c = useColors();
  const color = {
    ink: c.ink,
    muted: c.muted,
    accent: c.accent,
    onAccent: c.onAccent,
    danger: c.danger,
  }[tone];
  return <Text style={[styles[variant], { color }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Font.serif,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  body: {
    fontFamily: Font.regular,
    fontSize: 15,
    lineHeight: 20,
  },
  bodyStrong: {
    fontFamily: Font.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  small: {
    fontFamily: Font.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: Font.medium,
    fontSize: 11,
    lineHeight: 14,
  },
  label: {
    fontFamily: Font.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  number: {
    fontFamily: Font.semibold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  numberLarge: {
    fontFamily: Font.semibold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
});
