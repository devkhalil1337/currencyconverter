import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { CurrencyBadge } from '@/components/currency-badge';
import { ListGroup } from '@/components/list-group';
import { Screen } from '@/components/screen';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { unitRate } from '@/lib/convert';
import { formatRate } from '@/lib/format';
import { usePrefs } from '@/store/prefs';
import { currencyName, useRates } from '@/store/rates';

export default function RatesScreen() {
  const c = useColors();
  const { currencies, homeCurrency } = usePrefs();
  const { rates, names, date } = useRates();
  const others = currencies.filter((code) => code !== homeCurrency);

  return (
    <Screen title="Rates">
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="small" tone="muted">
          Mid-market rates for 1 {homeCurrency.toUpperCase()}
          {date ? ` · ${date}` : ''}
        </AppText>

        <ListGroup>
          {others.map((code) => {
            const rate = unitRate(homeCurrency, code, rates);
            return (
              <View key={code} style={styles.row}>
                <CurrencyBadge code={code} size={34} />
                <View style={styles.names}>
                  <AppText variant="bodyStrong">
                    {homeCurrency.toUpperCase()} / {code.toUpperCase()}
                  </AppText>
                  <AppText variant="small" tone="muted" numberOfLines={1}>
                    {currencyName(code, names)}
                  </AppText>
                </View>
                <AppText variant="number">{rate !== null ? formatRate(rate) : '—'}</AppText>
              </View>
            );
          })}
        </ListGroup>

        <View style={[styles.next, { backgroundColor: c.accentSoft }]}>
          <AppText variant="bodyStrong" style={{ color: c.accentOnSoft }}>
            Coming next
          </AppText>
          <AppText variant="small" style={{ color: c.accentOnSoft }}>
            Pair charts (1D–5Y), rate alerts with push notifications and rates on a past date.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 14,
  },
  names: {
    flex: 1,
    minWidth: 0,
  },
  next: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
});
