import { Pressable, StyleSheet, View } from 'react-native';

import { Font, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useT } from '@/i18n';
import { formatCurrency, formatNumber } from '@/lib/format';
import { dayOfTrip, daysBetween, formatDateRange, tripLength, tripPhase, type Trip, type TripSummary } from '@/lib/trips';

import { AppText } from './app-text';

interface TripCardProps {
  trip: Trip;
  summary: TripSummary;
  today: string;
  cardFee: number;
  onPress?: () => void;
}

export function TripCard({ trip, summary, today, cardFee, onPress }: TripCardProps) {
  const c = useColors();
  const t = useT();
  const phase = tripPhase(trip, today);
  const length = tripLength(trip);
  const when =
    phase === 'active'
      ? t('tripCard.dayOf', { day: dayOfTrip(trip, today), count: length })
      : phase === 'upcoming'
        ? t('tripCard.startsIn', { count: daysBetween(today, trip.startDate) })
        : t('tripCard.finished');
  const used = summary.budgetUsed;
  const over = used !== null && used > 1;

  const body = (
    <View style={[styles.card, { backgroundColor: c.feature }]}>
      <View style={styles.top}>
        <View style={styles.flex}>
          <AppText style={[styles.name, { color: c.onFeature }]} numberOfLines={1}>
            {trip.name}
          </AppText>
          <AppText variant="small" style={{ color: c.onFeature, opacity: 0.65 }}>
            {formatDateRange(trip)} · {when}
          </AppText>
        </View>
        <View style={[styles.pill, { backgroundColor: c.accentSoft }]}>
          <AppText variant="caption" style={{ color: c.accentOnSoft, fontFamily: Font.semibold }}>
            {trip.currency.toUpperCase()} → {trip.homeCurrency.toUpperCase()}
          </AppText>
        </View>
      </View>

      <View>
        <AppText style={[styles.spent, { color: c.onFeature }]}>{formatCurrency(summary.spent, trip.currency)}</AppText>
        <AppText variant="small" style={{ color: c.onFeature, opacity: 0.65 }}>
          {cardFee > 0
            ? t('tripCard.atHomeWithFee', {
                amount: formatCurrency(summary.spentHome, trip.homeCurrency),
                fee: formatNumber(cardFee),
              })
            : t('tripCard.atHome', { amount: formatCurrency(summary.spentHome, trip.homeCurrency) })}
        </AppText>
      </View>

      {used !== null && trip.budget !== null && (
        <View style={styles.budget}>
          <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
            <View
              style={[
                styles.fill,
                { width: `${Math.min(100, used * 100)}%`, backgroundColor: over ? c.danger : c.featureAccent },
              ]}
            />
          </View>
          <View style={styles.budgetRow}>
            <AppText variant="caption" style={{ color: c.onFeature, opacity: 0.7 }}>
              {t('tripCard.budgetUsed', {
                percent: formatNumber(Math.round(used * 100)),
                budget: formatCurrency(trip.budget, trip.currency),
              })}
            </AppText>
            <AppText variant="caption" style={{ color: c.onFeature, opacity: 0.7 }}>
              {summary.remaining !== null && summary.remaining < 0
                ? t('tripCard.over', { amount: formatCurrency(-summary.remaining, trip.currency) })
                : summary.perDayLeft !== null
                  ? t('tripCard.perDayLeft', { amount: formatCurrency(summary.perDayLeft, trip.currency) })
                  : t('tripCard.left', { amount: formatCurrency(summary.remaining ?? 0, trip.currency) })}
            </AppText>
          </View>
        </View>
      )}
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={t('tripCard.details', { name: trip.name })}>
      {({ pressed }) => <View style={{ opacity: pressed ? 0.9 : 1 }}>{body}</View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    padding: 18,
    borderRadius: Radius.xl,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: Font.serif,
    fontSize: 32,
    lineHeight: 36,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  spent: {
    fontFamily: Font.semibold,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  budget: {
    gap: 6,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
