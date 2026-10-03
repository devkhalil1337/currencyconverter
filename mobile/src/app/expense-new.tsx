import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Chip } from '@/components/chip';
import { Keypad } from '@/components/keypad';
import { SheetHeader } from '@/components/sheet-header';
import { Font, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useT } from '@/i18n';
import { convert, pressKey, withCardFee, type Key } from '@/lib/convert';
import { formatCurrency, formatNumber, formatTyped } from '@/lib/format';
import { CATEGORIES, type Category, type PaymentMethod } from '@/lib/trips';
import { usePrefs } from '@/store/prefs';
import { useRates } from '@/store/rates';
import { useTrips } from '@/store/trips';

export default function NewExpense() {
  const c = useColors();
  const t = useT();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const trip = useTrips((s) => s.trips.find((t) => t.id === tripId));
  const addExpense = useTrips((s) => s.addExpense);
  const rates = useRates((s) => s.rates);
  const cardFee = usePrefs((s) => s.cardFee);

  const [amount, setAmount] = useState('0');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [method, setMethod] = useState<PaymentMethod>('card');

  if (!trip) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
        <View style={styles.inner}>
          <SheetHeader title={t('expense.title')} />
          <AppText tone="muted">{t('trip.missing')}</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const value = parseFloat(amount) || 0;
  const converted = convert(value, trip.currency, trip.homeCurrency, rates);
  const home = converted === null ? null : method === 'card' ? withCardFee(converted, cardFee) : converted;
  const homeLine =
    home === null
      ? t('expense.noRate')
      : method === 'card' && cardFee > 0
        ? t('expense.approxWithFee', { amount: formatCurrency(home, trip.homeCurrency), fee: formatNumber(cardFee) })
        : t('expense.approx', { amount: formatCurrency(home, trip.homeCurrency) });

  const save = () => {
    if (value <= 0) return;
    addExpense({ tripId: trip.id, title: title.trim(), category, method, amount: value, homeAmount: home });
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <View style={styles.inner}>
        <SheetHeader title={t('expense.titleWithTrip', { trip: trip.name })} />

        <View style={styles.amountBox}>
          <AppText style={styles.amount} numberOfLines={1} adjustsFontSizeToFit accessibilityLiveRegion="polite">
            {formatTyped(amount)} <AppText style={[styles.code, { color: c.muted }]}>{trip.currency.toUpperCase()}</AppText>
          </AppText>
          <AppText variant="small" tone="muted">
            {homeLine}
          </AppText>
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('expense.whatPlaceholder')}
          placeholderTextColor={c.muted}
          accessibilityLabel={t('expense.whatLabel')}
          style={[styles.input, { color: c.ink, borderColor: c.line, backgroundColor: c.card }]}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroller}
          contentContainerStyle={styles.chips}>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              toggle
              icon={cat}
              label={t(`expense.categories.${cat}`)}
              active={category === cat}
              onPress={() => setCategory(cat)}
            />
          ))}
        </ScrollView>

        <View accessibilityRole="radiogroup" style={[styles.segment, { backgroundColor: c.subtle }]}>
          {(['card', 'cash'] as const).map((m) => {
            const selected = m === method;
            return (
              <Pressable
                key={m}
                onPress={() => setMethod(m)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                style={[styles.segmentItem, selected && { backgroundColor: c.card }]}>
                <AppText variant="small" style={{ fontFamily: Font.semibold, color: selected ? c.ink : c.muted }}>
                  {t(`expense.methods.${m}`)}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.spacer} />
        <View style={styles.keypad}>
          <Keypad onPress={(k: Key) => setAmount((a) => pressKey(a, k))} />
        </View>

        <Pressable
          onPress={save}
          disabled={value <= 0}
          accessibilityRole="button"
          accessibilityState={{ disabled: value <= 0 }}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: value > 0 ? c.accent : c.subtle, opacity: pressed ? 0.85 : 1 },
          ]}>
          <AppText variant="bodyStrong" tone={value > 0 ? 'onAccent' : 'muted'} style={styles.ctaText}>
            {t('expense.save')}
          </AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  amountBox: {
    gap: 2,
  },
  amount: {
    fontFamily: Font.semibold,
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  code: {
    fontFamily: Font.medium,
    fontSize: 22,
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    fontFamily: Font.regular,
    fontSize: 16,
  },
  chipScroller: {
    flexGrow: 0,
  },
  chips: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  segment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: Radius.sm + 2,
  },
  segmentItem: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  spacer: {
    flex: 1,
  },
  keypad: {
    marginHorizontal: -Spacing.three,
  },
  cta: {
    minHeight: 54,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 17,
  },
});
