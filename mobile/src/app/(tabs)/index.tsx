import { router } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Chip } from '@/components/chip';
import { CurrencyRow } from '@/components/currency-row';
import { Keypad } from '@/components/keypad';
import { RatesStatus } from '@/components/rates-status';
import { Screen } from '@/components/screen';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { convert, toTypedAmount, unitRate, withCardFee } from '@/lib/convert';
import { formatMoney, formatRate, formatTyped } from '@/lib/format';
import { usePrefs } from '@/store/prefs';
import { currencyName, useRates } from '@/store/rates';

export default function ConvertScreen() {
  const c = useColors();
  const { currencies, base, amount, realCost, cardFee, press, setBase, toggleRealCost, removeCurrency } = usePrefs();
  const { rates, names, status, refresh } = useRates();

  const typedValue = parseFloat(amount) || 0;

  const confirmRemove = (code: string) => {
    const message = `Remove ${code.toUpperCase()} from your list?`;
    if (Platform.OS === 'web') {
      if (window.confirm(message)) removeCurrency(code);
      return;
    }
    Alert.alert(message, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeCurrency(code) },
    ]);
  };

  return (
    <Screen title="Convert" right={<RatesStatus />}>
      <AppText variant="small" tone="muted" style={styles.subtitle}>
        Tap a currency to make it the base · long press to remove
      </AppText>

      {!rates && status === 'error' ? (
        <View style={styles.empty}>
          <AppText variant="bodyStrong">Couldn’t load rates</AppText>
          <AppText tone="muted" style={styles.emptyText}>
            Connect to the internet once and Fairrate will keep working offline after that.
          </AppText>
          <Pressable
            onPress={() => refresh(true)}
            accessibilityRole="button"
            style={[styles.retry, { backgroundColor: c.accent }]}>
            <AppText variant="bodyStrong" tone="onAccent">
              Try again
            </AppText>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {currencies.map((code) => {
            const isBase = code === base;
            const raw = convert(typedValue, base, code, rates);
            const shown = raw !== null && realCost && !isBase ? withCardFee(raw, cardFee) : raw;
            const unit = unitRate(base, code, rates);
            let sub = 'Amount';
            if (!isBase) {
              sub = realCost
                ? `incl. ${cardFee}% card fee`
                : unit !== null
                  ? `1 ${base.toUpperCase()} = ${formatRate(unit)}`
                  : 'No rate';
            }
            return (
              <CurrencyRow
                key={code}
                code={code}
                name={currencyName(code, names)}
                isBase={isBase}
                value={isBase ? formatTyped(amount) : shown !== null ? formatMoney(shown, code) : '—'}
                sub={sub}
                subAccent={isBase || realCost}
                onPress={() => {
                  if (!isBase && raw !== null) setBase(code, toTypedAmount(raw, code));
                }}
                onLongPress={() => confirmRemove(code)}
              />
            );
          })}
        </ScrollView>
      )}

      <View style={styles.chips}>
        <Chip
          toggle
          icon="card"
          label={`Real cost · ${cardFee}% card fee`}
          active={realCost}
          onPress={toggleRealCost}
          accessibilityHint="Adds your card fee to converted amounts"
        />
        <Chip icon="plus" label="Add currency" onPress={() => router.push('/currency-picker?mode=add')} />
      </View>

      <Keypad onPress={press} />
      <View style={{ height: BottomTabInset + Spacing.two }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingBottom: Spacing.two,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 6,
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingBottom: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
  emptyText: {
    textAlign: 'center',
  },
  retry: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: Radius.lg,
  },
});
