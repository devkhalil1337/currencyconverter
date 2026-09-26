import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

import { AppText } from './app-text';

interface ScreenProps {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  contentStyle?: ViewStyle;
}

/** Page shell: safe-area top, serif title row, centered max-width column. */
export function Screen({ title, right, children, contentStyle }: ScreenProps) {
  const c = useColors();
  return (
    <View style={[styles.outer, { backgroundColor: c.bg }]}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <View style={styles.header}>
          <AppText variant="title" accessibilityRole="header">
            {title}
          </AppText>
          {right}
        </View>
        <View style={[styles.content, contentStyle]}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
  },
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  content: {
    flex: 1,
  },
});
