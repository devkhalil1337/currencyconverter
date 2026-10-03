import { router } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Chip } from '@/components/chip';
import { CurrencyRow } from '@/components/currency-row';
import { Keypad } from '@/components/keypad';
import { LocaleBoundary } from '@/components/locale-boundary';
import { RatesStatus } from '@/components/rates-status';
import { Screen } from '@/components/screen';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useT } from '@/i18n';
import { convert, realCost as applyRealCost, toTypedAmount, unitRate } from '@/lib/convert';
import { formatMoney, formatNumber, formatRate, formatTyped } from '@/lib/format';
import { usePrefs } from '@/store/prefs';
import { currencyName, useRates } from '@/store/rates';

export default function ConvertRoute() {
  return (
    <LocaleBoundary>
      <ConvertScreen />
    </LocaleBoundary>
  );
}

function ConvertScreen() {
  const c = useColors();
  const t = useT();
  const { homeCurrency, currencies, base, amount, realCost, cardFee, press, setBase, toggleRealCost, removeCurrency } = usePrefs();
  const { rates, names, status, refresh } = useRates();

  const typedValue = parseFloat(amount) || 0;
  const fee = formatNumber(cardFee);

  const confirmRemove = (code: string) => {
    const message = t('convert.removeConfirm', { code: code.toUpperCase() });
    if (Platform.OS === 'web') {
      if (window.confirm(message)) removeCurrency(code);
      return;
    }
    Alert.alert(message, undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.remove'), style: 'destructive', onPress: () => removeCurrency(code) },
    ]);
  };

  return (
    <Screen title={t('tabs.convert')} right={<RatesStatus />}>
      <AppText variant="small" tone="muted" style={styles.subtitle}>
        {t('convert.subtitle')}
      </AppText>

      {!rates && status === 'error' ? (
        <View style={styles.empty}>
          <AppText variant="bodyStrong">{t('convert.loadFailedTitle')}</AppText>
          <AppText tone="muted" style={styles.emptyText}>
            {t('convert.loadFailedBody')}
          </AppText>
          <Pressable
            onPress={() => refresh(true)}
            accessibilityRole="button"
            style={[styles.retry, { backgroundColor: c.accent }]}>
            <AppText variant="bodyStrong" tone="onAccent">
              {t('common.tryAgain')}
            </AppText>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {currencies.map((code) => {
            const isBase = code === base;
            const raw = convert(typedValue, base, code, rates);
            const cost =
              raw !== null && realCost ? applyRealCost(raw, base, code, homeCurrency, cardFee) : null;
            const shown = cost ? cost.value : raw;
            const feeShown = cost !== null && cost.kind !== 'none';
            const unit = unitRate(base, code, rates);
            let sub = t('convert.amount');
            if (!isBase) {
              sub = feeShown
                ? cost.kind === 'incl'
                  ? t('convert.feeIncluded', { fee })
                  : t('convert.feeDeducted', { fee })
                : unit !== null
                  ? `1 ${base.toUpperCase()} = ${formatRate(unit)}`
                  : t('convert.noRate');
            }
            return (
              <CurrencyRow
                key={code}
                code={code}
                name={currencyName(code, names)}
                isBase={isBase}
                value={isBase ? formatTyped(amount) : shown !== null ? formatMoney(shown, code) : '—'}
                sub={sub}
                subAccent={isBase || feeShown}
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
          label={t('convert.realCostChip', { fee })}
          active={realCost}
          onPress={toggleRealCost}
          accessibilityHint={t('convert.realCostHint')}
        />
        <Chip icon="plus" label={t('convert.addCurrency')} onPress={() => router.push('/currency-picker?mode=add')} />
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
