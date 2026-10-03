import { Pressable, StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useT } from '@/i18n';
import { formatTime } from '@/lib/format';
import { useRates } from '@/store/rates';

import { AppText } from './app-text';

/** Small pill showing freshness of the cached rates; tap to refresh. */
export function RatesStatus() {
  const c = useColors();
  const t = useT();
  const { status, fetchedAt, date, refresh } = useRates();

  let dot = c.accent;
  let label = t('ratesStatus.loading');
  if (status === 'loading') {
    label = t('common.updating');
    dot = c.muted;
  } else if (status === 'error' && fetchedAt) {
    label = t('ratesStatus.offlineFrom', { date: date ?? formatTime(fetchedAt) });
    dot = c.danger;
  } else if (status === 'error') {
    label = t('ratesStatus.offline');
    dot = c.danger;
  } else if (fetchedAt) {
    label = t('ratesStatus.updated', { time: formatTime(fetchedAt) });
  }

  return (
    <Pressable
      onPress={() => refresh(true)}
      accessibilityRole="button"
      accessibilityLabel={t('ratesStatus.refresh', { status: label })}
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
