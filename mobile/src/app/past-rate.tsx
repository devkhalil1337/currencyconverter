import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { CurrencyBadge } from '@/components/currency-badge';
import { Icon } from '@/components/icon';
import { SheetHeader } from '@/components/sheet-header';
import { Font, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/use-colors';
import { appLocale, useT, type TranslationKey } from '@/i18n';
import { parseRateInput } from '@/lib/alerts';
import { formatCurrency, formatRate } from '@/lib/format';
import {
  dateNote,
  fetchRateOn,
  minDateFor,
  pastRateErrorKind,
  type DateNote,
  type PastRate,
  type PastRateErrorKind,
} from '@/lib/past-rate';
import { addDays, toIsoDate } from '@/lib/trips';
import { usePrefs } from '@/store/prefs';
import { useIsPro } from '@/store/pro';
import { currencyName, useRates } from '@/store/rates';

const RATE_FROM: Record<DateNote, TranslationKey> = {
  exact: 'pastRate.rateFrom.exact',
  'previous-business-day': 'pastRate.rateFrom.previousBusinessDay',
  'latest-published': 'pastRate.rateFrom.latestPublished',
  'earlier-snapshot': 'pastRate.rateFrom.earlierSnapshot',
};

function localDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDay(iso: string, weekday: 'short' | 'long' | null = 'short'): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(appLocale(), {
    ...(weekday ? { weekday } : {}),
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function codeParam(value: string | undefined): string | null {
  const code = value?.toLowerCase();
  return code && /^[a-z0-9]{2,10}$/.test(code) ? code : null;
}

type Lookup = { key: string; rate: PastRate | null; error: PastRateErrorKind | null };

export default function PastRateScreen() {
  const isPro = useIsPro();
  // The Rates tab gates this already; a deep link to /past-rate would skip it.
  if (!isPro) return <Redirect href={{ pathname: '/paywall', params: { reason: 'history' } }} />;
  return <PastRateView />;
}

function PastRateView() {
  const c = useColors();
  const t = useT();
  const isDark = useIsDark();
  const params = useLocalSearchParams<{ from?: string; to?: string }>();
  const homeCurrency = usePrefs((s) => s.homeCurrency);
  const names = useRates((s) => s.names);

  const [from, setFrom] = useState(() => codeParam(params.from) ?? homeCurrency);
  const [to, setTo] = useState(() => codeParam(params.to) ?? (from === 'eur' ? 'usd' : 'eur'));
  const today = toIsoDate(new Date());
  const minDate = minDateFor(from, to);
  const [picked, setPicked] = useState(() => addDays(today, -1));
  const date = picked < minDate ? minDate : picked > today ? today : picked;
  const [webText, setWebText] = useState(date);
  const [amountText, setAmountText] = useState('');
  const [attempt, setAttempt] = useState(0);

  const key = `${from}:${to}:${date}#${attempt}`;
  const [lookup, setLookup] = useState<Lookup | null>(null);
  useEffect(() => {
    let active = true;
    fetchRateOn(from, to, date).then(
      (rate) => active && setLookup({ key, rate, error: null }),
      (err: unknown) => active && setLookup({ key, rate: null, error: pastRateErrorKind(err) })
    );
    return () => {
      active = false;
    };
  }, [from, to, date, key]);
  // A result for an older request means the current one is still loading.
  const current = lookup?.key === key ? lookup : null;
  const result = current?.rate ?? null;

  const parsed = parseRateInput(amountText);
  const amount = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();
  const rateLine = result ? `1 ${fromCode} = ${formatRate(result.rate)} ${toCode}` : '';
  const amountLine =
    result && amount !== null ? `${formatCurrency(amount, from)} = ${formatCurrency(amount * result.rate, to)}` : null;
  const rateFrom = result
    ? t(RATE_FROM[dateNote(date, result.date, result.source, today)], { date: formatDay(result.date) })
    : '';
  const source = result?.source === 'ecb' ? t('pastRate.sourceEcb') : t('pastRate.sourceDaily');

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const pickDate = (d: Date) => {
    setPicked(toIsoDate(d));
    setWebText(toIsoDate(d));
  };

  const openAndroidPicker = () =>
    DateTimePickerAndroid.open({
      value: localDate(date),
      mode: 'date',
      minimumDate: localDate(minDate),
      maximumDate: localDate(today),
      onValueChange: (_event, d) => pickDate(d),
    });

  const share = () => {
    if (!result) return;
    const day = formatDay(result.date);
    const message = amountLine
      ? t('pastRate.shareMessageAmount', { amount: amountLine, rate: rateLine, date: day, source })
      : t('pastRate.shareMessage', { rate: rateLine, date: day, source });
    Share.share({ message }).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        // Lets the result below the amount field scroll above the iOS keyboard.
        automaticallyAdjustKeyboardInsets>
        <SheetHeader title={t('pastRate.title')} />

        <View style={[styles.card, styles.row, { backgroundColor: c.card, borderColor: c.line }]}>
          <View style={styles.badges}>
            <CurrencyBadge code={from} size={36} />
            <View style={[styles.overlap, { borderColor: c.card }]}>
              <CurrencyBadge code={to} size={36} />
            </View>
          </View>
          <View style={styles.flex}>
            <AppText variant="bodyStrong">
              {fromCode} / {toCode}
            </AppText>
            <AppText variant="small" tone="muted" numberOfLines={1}>
              {t('common.fromTo', { from: currencyName(from, names), to: currencyName(to, names) })}
            </AppText>
          </View>
          <Pressable
            onPress={swap}
            accessibilityRole="button"
            accessibilityLabel={t('common.swapCurrencies')}
            style={({ pressed }) => [styles.round, { borderColor: c.line, backgroundColor: pressed ? c.subtle : c.bg }]}>
            <Icon name="convert" size={18} color={c.ink} />
          </Pressable>
        </View>

        <View style={styles.field}>
          <AppText variant="label" tone="muted">
            {t('pastRate.date')}
          </AppText>
          {Platform.OS === 'ios' ? (
            <View style={[styles.card, styles.row, { backgroundColor: c.card, borderColor: c.line }]}>
              <Icon name="calendar" size={20} color={c.muted} />
              <AppText style={styles.flex} numberOfLines={1}>
                {localDate(date).toLocaleDateString(appLocale(), { weekday: 'long' })}
              </AppText>
              <DateTimePicker
                value={localDate(date)}
                mode="date"
                display="compact"
                minimumDate={localDate(minDate)}
                maximumDate={localDate(today)}
                onValueChange={(_event, d) => pickDate(d)}
                locale={appLocale()}
                accentColor={c.accent}
                themeVariant={isDark ? 'dark' : 'light'}
              />
            </View>
          ) : Platform.OS === 'android' ? (
            <Pressable
              onPress={openAndroidPicker}
              accessibilityRole="button"
              accessibilityLabel={t('pastRate.dateLabel', { date: formatDay(date, 'long') })}
              accessibilityHint={t('pastRate.opensCalendar')}
              style={({ pressed }) => [
                styles.card,
                styles.row,
                { backgroundColor: pressed ? c.subtle : c.card, borderColor: c.line },
              ]}>
              <Icon name="calendar" size={20} color={c.muted} />
              <AppText variant="bodyStrong" style={styles.flex}>
                {formatDay(date)}
              </AppText>
              <Icon name="chevron" size={16} color={c.muted} />
            </Pressable>
          ) : (
            <View style={[styles.card, styles.row, { backgroundColor: c.card, borderColor: c.line }]}>
              <Icon name="calendar" size={20} color={c.muted} />
              <TextInput
                value={webText}
                onChangeText={(t) => {
                  setWebText(t);
                  // Accept only real dates; Date would roll 2025-02-30 over to March.
                  if (/^\d{4}-\d{2}-\d{2}$/.test(t) && toIsoDate(localDate(t)) === t) setPicked(t);
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={c.muted}
                accessibilityLabel={t('pastRate.dateInputLabel')}
                style={[styles.flex, styles.dateInput, { color: c.ink }]}
              />
            </View>
          )}
          <AppText variant="caption" tone="muted">
            {t('pastRate.goesBackTo', { date: formatDay(minDate, null) })}
          </AppText>
        </View>

        <View style={styles.field}>
          <AppText variant="label" tone="muted">
            {t('pastRate.amountOptional')}
          </AppText>
          <View style={[styles.amountBox, { backgroundColor: c.card, borderColor: c.line }]}>
            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="decimal-pad"
              placeholder="1"
              placeholderTextColor={c.muted}
              accessibilityLabel={t('pastRate.amountIn', { code: fromCode })}
              style={[styles.amountInput, { color: c.ink }]}
            />
            <AppText variant="bodyStrong" tone="muted">
              {fromCode}
            </AppText>
          </View>
        </View>

        <View style={[styles.card, styles.result, { backgroundColor: c.card, borderColor: c.line }]}>
          {result ? (
            <>
              <AppText style={styles.rate} adjustsFontSizeToFit numberOfLines={1} accessibilityLiveRegion="polite">
                {rateLine}
              </AppText>
              {amountLine && <AppText variant="numberLarge">{amountLine}</AppText>}
              <View style={styles.caption}>
                <AppText variant="small" tone="muted">
                  {rateFrom}
                </AppText>
                <AppText variant="small" tone="muted">
                  {source}
                </AppText>
              </View>
              <Pressable
                onPress={share}
                accessibilityRole="button"
                style={({ pressed }) => [styles.share, { borderColor: c.line, opacity: pressed ? 0.7 : 1 }]}>
                <Icon name="share" size={18} color={c.ink} />
                <AppText variant="bodyStrong">{t('pastRate.share')}</AppText>
              </Pressable>
            </>
          ) : current?.error ? (
            <View style={styles.center}>
              <AppText tone="muted" style={styles.centerText}>
                {current.error === 'no-data' ? t('pastRate.noData') : t('pastRate.loadFailed')}
              </AppText>
              {current.error === 'network' && (
                <Pressable onPress={() => setAttempt((n) => n + 1)} accessibilityRole="button" hitSlop={8}>
                  <AppText variant="bodyStrong" tone="accent">
                    {t('common.tryAgain')}
                  </AppText>
                </Pressable>
              )}
            </View>
          ) : (
            <ActivityIndicator color={c.accent} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    gap: Spacing.three,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  badges: {
    flexDirection: 'row',
  },
  overlap: {
    marginLeft: -6,
    borderWidth: 2,
    borderRadius: 20,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    gap: Spacing.two,
  },
  dateInput: {
    height: 44,
    fontFamily: Font.semibold,
    fontSize: 16,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  amountInput: {
    flex: 1,
    height: '100%',
    fontFamily: Font.semibold,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
  },
  result: {
    gap: Spacing.two,
    minHeight: 180,
    padding: Spacing.three,
    justifyContent: 'center',
  },
  rate: {
    fontFamily: Font.semibold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  caption: {
    gap: 2,
  },
  share: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: Spacing.two,
    minHeight: 44,
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  centerText: {
    textAlign: 'center',
  },
});
