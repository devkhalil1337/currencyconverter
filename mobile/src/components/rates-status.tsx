import { Pressable, StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { formatTime } from '@/lib/format';
import { useRates } from '@/store/rates';

import { AppText } from './app-text';

/** Small pill showing freshness of the cached rates; tap to refresh. */
export function RatesStatus() {
  const c = useColors();
  const { status, fetchedAt, date, refresh } = useRates();

  let dot = c.accent;
  let label = 'Loading rates…';
  if (status === 'loading') {
    label = 'Updating…';
    dot = c.muted;
  } else if (status === 'error' && fetchedAt) {
    label = `Offline · rates from ${date ?? formatTime(fetchedAt)}`;
    dot = c.danger;
  } else if (status === 'error') {
    label = 'Offline';
    dot = c.danger;
  } else if (fetchedAt) {
    label = `Updated ${formatTime(fetchedAt)}`;
  }

  return (
    <Pressable
      onPress={() => refresh(true)}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Refresh rates`}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: c.card, borderColor: c.line, opacity: pressed ? 0.7 : 1 },
      ]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <AppText variant="caption" tone="muted" style={styles.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexShrink: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    fontSize: 12,
  },
});
