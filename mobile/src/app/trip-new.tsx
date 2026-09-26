import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Chip } from '@/components/chip';
import { Icon } from '@/components/icon';
import { SheetHeader } from '@/components/sheet-header';
import { Font, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { parseRateInput } from '@/lib/alerts';
import { addDays, formatDateRange, toIsoDate } from '@/lib/trips';
import { usePrefs } from '@/store/prefs';
import { currencyName, useRates } from '@/store/rates';
import { useTripDraft } from '@/store/trip-draft';
import { useTrips } from '@/store/trips';

export default function NewTrip() {
  const c = useColors();
  const { currencies, homeCurrency } = usePrefs();
  const names = useRates((s) => s.names);
  const addTrip = useTrips((s) => s.addTrip);
  const { currency: picked, setCurrency: setPicked } = useTripDraft();

  const suggestions = currencies.filter((code) => code !== homeCurrency);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState(suggestions[0] ?? 'eur');
  const [startOffset, setStartOffset] = useState(0);
  const [days, setDays] = useState(7);
  const [budgetText, setBudgetText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // A currency chosen in the picker arrives through the draft store.
  useFocusEffect(
    useCallback(() => {
      if (picked) {
        setCurrency(picked);
        setPicked(null);
      }
    }, [picked, setPicked])
  );

  const today = toIsoDate(new Date());
  const startDate = addDays(today, startOffset);
  const endDate = addDays(startDate, days - 1);
  const chips = suggestions.includes(currency) ? suggestions : [currency, ...suggestions];

  const create = () => {
    const budget = budgetText.trim() ? parseRateInput(budgetText) : null;
    if (budget !== null && (!Number.isFinite(budget) || budget <= 0)) {
      setError('Budget must be a number greater than 0, or left empty.');
      return;
    }
    const id = addTrip({
      name: name.trim() || currencyName(currency, names),
      currency,
      homeCurrency,
      startDate,
      endDate,
      budget,
    });
    router.replace({ pathname: '/trip/[id]', params: { id: id } });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <SheetHeader title="New trip" />

        <View style={styles.field}>
          <AppText variant="label" tone="muted">
            Where to?
          </AppText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Lisbon"
            placeholderTextColor={c.muted}
            accessibilityLabel="Trip name"
            style={[styles.input, { color: c.ink, borderColor: c.line, backgroundColor: c.card }]}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="label" tone="muted">
            Local currency
          </AppText>
          <View style={styles.chips}>
            {chips.map((code) => (
              <Chip
                key={code}
                toggle
                icon={code === currency ? 'check' : undefined}
                label={code.toUpperCase()}
                active={code === currency}
                onPress={() => setCurrency(code)}
              />
            ))}
            <Chip icon="search" label="Other" onPress={() => router.push('/currency-picker?mode=trip')} />
          </View>
        </View>

        <View style={styles.field}>
          <AppText variant="label" tone="muted">
            Dates
          </AppText>
          <View style={styles.chips}>
            {[
              { offset: 0, label: 'Starts today' },
              { offset: 1, label: 'Tomorrow' },
              { offset: 7, label: 'In a week' },
            ].map((o) => (
              <Chip
                key={o.offset}
                toggle
                label={o.label}
                active={startOffset === o.offset}
                onPress={() => setStartOffset(o.offset)}
              />
            ))}
          </View>
          <View style={[styles.stepperRow, { backgroundColor: c.card, borderColor: c.line }]}>
            <AppText style={styles.flex}>
              {days} day{days === 1 ? '' : 's'}
            </AppText>
            <Step icon="minus" label="Fewer days" onPress={() => setDays((d) => Math.max(1, d - 1))} />
            <Step icon="plus" label="More days" onPress={() => setDays((d) => Math.min(90, d + 1))} />
          </View>
          <AppText variant="small" tone="muted">
            {formatDateRange({ startDate, endDate })}
          </AppText>
        </View>

        <View style={styles.field}>
          <AppText variant="label" tone="muted">
            Budget in {currency.toUpperCase()} (optional)
          </AppText>
          <TextInput
            value={budgetText}
            onChangeText={(t) => {
              setBudgetText(t);
              setError(null);
            }}
            keyboardType="decimal-pad"
            placeholder="e.g. 1200"
            placeholderTextColor={c.muted}
            accessibilityLabel="Budget"
            style={[
              styles.input,
              { color: c.ink, borderColor: error ? c.danger : c.line, backgroundColor: c.card },
            ]}
          />
          {error && (
            <AppText variant="small" tone="danger">
              {error}
            </AppText>
          )}
        </View>

        <Pressable
          onPress={create}
          accessibilityRole="button"
          style={({ pressed }) => [styles.cta, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}>
          <AppText variant="bodyStrong" tone="onAccent" style={styles.ctaText}>
            Create trip
          </AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Step({ icon, label, onPress }: { icon: 'plus' | 'minus'; label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.step, { borderColor: c.line, backgroundColor: pressed ? c.subtle : c.bg }]}>
      <Icon name={icon} size={16} color={c.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.four,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    fontFamily: Font.regular,
    fontSize: 16,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  flex: {
    flex: 1,
  },
  step: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    minHeight: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 17,
  },
});
