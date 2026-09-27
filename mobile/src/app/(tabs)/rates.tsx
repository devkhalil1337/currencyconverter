import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { CurrencyBadge } from '@/components/currency-badge';
import { Icon } from '@/components/icon';
import { LineChart } from '@/components/line-chart';
import { ListGroup } from '@/components/list-group';
import { RateAlerts } from '@/components/rate-alerts';
import { Screen } from '@/components/screen';
import { BottomTabInset, Font, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useHistory } from '@/hooks/use-history';
import { alertTargets } from '@/lib/chart-markers';
import { unitRate } from '@/lib/convert';
import { exportFileName, seriesCsv } from '@/lib/csv';
import { shareCsv } from '@/lib/export-file';
import { formatRate } from '@/lib/format';
import type { Point, Range } from '@/lib/history';
import { toIsoDate } from '@/lib/trips';
import { useAlerts } from '@/store/alerts';
import { usePrefs } from '@/store/prefs';
import { useIsPro } from '@/store/pro';
import { currencyName, useRates } from '@/store/rates';

const RANGES: Range[] = ['1W', '1M', '1Y', '5Y'];

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function RatesScreen() {
  const c = useColors();
  const { currencies, homeCurrency } = usePrefs();
  const { rates, names } = useRates();

  const others = currencies.filter((code) => code !== homeCurrency);
  const [from, setFrom] = useState(homeCurrency);
  const [picked, setPicked] = useState<string | null>(null);
  const to = picked && picked !== from ? picked : (currencies.find((code) => code !== from) ?? 'eur');

  const [range, setRange] = useState<Range>('1M');
  const [attempt, setAttempt] = useState(0);
  const [scrub, setScrub] = useState<Point | null>(null);
  const { loading, history, error } = useHistory(from, to, range, attempt);

  const live = unitRate(from, to, rates);
  const first = history?.points[0]?.value ?? null;
  const shown = scrub?.value ?? live;
  const change = shown !== null && first !== null ? shown - first : null;
  const changePct = change !== null && first ? (change / first) * 100 : null;
  const up = (change ?? 0) >= 0;

  const values = history?.points.map((p) => p.value) ?? [];
  const low = values.length ? Math.min(...values) : null;
  const high = values.length ? Math.max(...values) : null;

  const alerts = useAlerts((s) => s.alerts);
  const markers = alertTargets(alerts, from, to).map((value) => ({ value, label: `Alert · ${formatRate(value)}` }));
  const isPro = useIsPro();

  const swap = () => {
    setFrom(to);
    setPicked(from);
  };

  const exportHistory = async () => {
    if (!isPro) {
      router.push({ pathname: '/paywall', params: { reason: 'export' } });
      return;
    }
    if (!history) return;
    const pair = `${from.toUpperCase()}/${to.toUpperCase()}`;
    try {
      const result = await shareCsv(
        exportFileName([from, to, range], toIsoDate(new Date())),
        seriesCsv(history.points, from, to),
        `${pair} rates`
      );
      if (result === 'unavailable') Alert.alert('Sharing isn’t available on this device.');
    } catch {
      Alert.alert('Couldn’t export', 'Please try again.');
    }
  };

  const openPastRate = () => {
    if (!isPro) router.push({ pathname: '/paywall', params: { reason: 'history' } });
    else router.push({ pathname: '/past-rate', params: { from, to } });
  };

  return (
    <Screen title="Rates">
      <ScrollView contentContainerStyle={styles.content} scrollEnabled={scrub === null}>
        <View style={[styles.pair, { backgroundColor: c.card, borderColor: c.line }]}>
          <View style={styles.badges}>
            <CurrencyBadge code={from} size={36} />
            <View style={[styles.overlap, { borderColor: c.card }]}>
              <CurrencyBadge code={to} size={36} />
            </View>
          </View>
          <View style={styles.pairNames}>
            <AppText variant="bodyStrong">
              {from.toUpperCase()} / {to.toUpperCase()}
            </AppText>
            <AppText variant="small" tone="muted" numberOfLines={1}>
              {currencyName(from, names)} to {currencyName(to, names)}
            </AppText>
          </View>
          <Pressable
            onPress={swap}
            accessibilityRole="button"
            accessibilityLabel="Swap currencies"
            style={({ pressed }) => [styles.swap, { borderColor: c.line, backgroundColor: pressed ? c.subtle : c.bg }]}>
            <Icon name="convert" size={18} color={c.ink} />
          </Pressable>
        </View>

        <View style={styles.headline}>
          <AppText style={styles.rate} accessibilityLiveRegion="polite">
            {shown !== null ? formatRate(shown) : '—'}
          </AppText>
          <View style={styles.changeRow}>
            {change !== null && changePct !== null && (
              <AppText variant="bodyStrong" style={{ color: up ? c.accent : c.danger }}>
                {up ? '▲' : '▼'} {up ? '+' : ''}
                {changePct.toFixed(2)}%
              </AppText>
            )}
            <AppText variant="small" tone="muted">
              {scrub ? formatDate(scrub.date) : `over ${range} · mid-market`}
            </AppText>
          </View>
        </View>

        <View accessibilityRole="tablist" style={[styles.segment, { backgroundColor: c.subtle }]}>
          {RANGES.map((r) => {
            const selected = r === range;
            return (
              <Pressable
                key={r}
                onPress={() => setRange(r)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={[styles.segmentItem, selected && { backgroundColor: c.card }]}>
                <AppText variant="small" style={{ fontFamily: Font.semibold, color: selected ? c.ink : c.muted }}>
                  {r}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.chartBox}>
          {history ? (
            <LineChart
              points={history.points}
              color={c.accent}
              lineColor={c.bg}
              markers={markers}
              onScrub={setScrub}
            />
          ) : loading ? (
            <ActivityIndicator color={c.accent} />
          ) : (
            <View style={styles.chartError}>
              <AppText tone="muted" style={styles.center}>
                {error === 'Not enough history for this pair'
                  ? 'No history available for this pair and range.'
                  : 'Couldn’t load the chart.'}
              </AppText>
              <Pressable onPress={() => setAttempt((n) => n + 1)} accessibilityRole="button" hitSlop={8}>
                <AppText variant="bodyStrong" tone="accent">
                  Try again
                </AppText>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.stats}>
          <Stat label="Low" value={low !== null ? formatRate(low) : '—'} />
          <Stat label="High" value={high !== null ? formatRate(high) : '—'} />
          <Stat label="Now" value={live !== null ? formatRate(live) : '—'} />
        </View>
        {history && (
          <View style={styles.sourceRow}>
            <AppText variant="caption" tone="muted" style={styles.pairNames}>
              {history.source === 'ecb' ? 'History: European Central Bank (via Frankfurter)' : 'History: exchange-api daily snapshots'}
            </AppText>
            <Pressable
              onPress={exportHistory}
              accessibilityRole="button"
              accessibilityLabel="Export chart data as CSV"
              accessibilityHint={isPro ? undefined : 'Requires Trippence Pro'}
              hitSlop={6}
              style={({ pressed }) => [styles.export, { borderColor: c.line, opacity: pressed ? 0.7 : 1 }]}>
              <Icon name="share" size={14} color={c.ink} />
              <AppText variant="small" style={{ fontFamily: Font.semibold }}>
                Export
              </AppText>
              {!isPro && <ProPill />}
            </Pressable>
          </View>
        )}

        <ListGroup title={`Compare with 1 ${from.toUpperCase()}`}>
          {(from === homeCurrency ? others : currencies.filter((code) => code !== from)).map((code) => {
            const rate = unitRate(from, code, rates);
            const selected = code === to;
            return (
              <Pressable
                key={code}
                onPress={() => setPicked(code)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${from.toUpperCase()} to ${code.toUpperCase()}`}
                style={({ pressed }) => [styles.row, (pressed || selected) && { backgroundColor: c.subtle }]}>
                <CurrencyBadge code={code} size={34} />
                <View style={styles.pairNames}>
                  <AppText variant="bodyStrong">{code.toUpperCase()}</AppText>
                  <AppText variant="small" tone="muted" numberOfLines={1}>
                    {currencyName(code, names)}
                  </AppText>
                </View>
                <AppText variant="number">{rate !== null ? formatRate(rate) : '—'}</AppText>
              </Pressable>
            );
          })}
        </ListGroup>

        <RateAlerts
          from={from}
          to={to}
          live={live}
          onSelectPair={(f, t) => {
            setFrom(f);
            setPicked(t);
          }}
        />

        <Pressable
          onPress={openPastRate}
          accessibilityRole="button"
          accessibilityHint={isPro ? undefined : 'Requires Trippence Pro'}
          style={({ pressed }) => [
            styles.pair,
            { backgroundColor: pressed ? c.subtle : c.card, borderColor: c.line },
          ]}>
          <View style={[styles.featureIcon, { backgroundColor: c.accentSoft }]}>
            <Icon name="calendar" size={18} color={c.accentOnSoft} />
          </View>
          <View style={styles.pairNames}>
            <AppText variant="bodyStrong">Rate on a past date</AppText>
            <AppText variant="small" tone="muted">
              For invoices and expense reports
            </AppText>
          </View>
          {!isPro && <ProPill />}
          <Icon name="chevron" size={16} color={c.muted} />
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function ProPill() {
  const c = useColors();
  return (
    <View style={[styles.proPill, { backgroundColor: c.feature }]}>
      <AppText variant="caption" style={[styles.proText, { color: c.featureAccent }]}>
        PRO
      </AppText>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText variant="bodyStrong" style={styles.statValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  pair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  badges: {
    flexDirection: 'row',
  },
  overlap: {
    marginLeft: -6,
    borderWidth: 2,
    borderRadius: 20,
  },
  pairNames: {
    flex: 1,
    minWidth: 0,
  },
  swap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  rate: {
    fontFamily: Font.semibold,
    fontSize: 48,
    lineHeight: 54,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: Radius.md - 2,
  },
  segmentItem: {
    flex: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  chartBox: {
    height: 170,
    justifyContent: 'center',
  },
  chartError: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    fontVariant: ['tabular-nums'],
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  export: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  proText: {
    fontFamily: Font.bold,
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 14,
  },
});
