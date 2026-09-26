import { Pressable, StyleSheet, View } from 'react-native';

import { Font, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { formatCurrency } from '@/lib/format';
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
  const phase = tripPhase(trip, today);
  const length = tripLength(trip);
  const when =
    phase === 'active'
      ? `Day ${dayOfTrip(trip, today)} of ${length}`
      : phase === 'upcoming'
        ? `Starts in ${daysBetween(today, trip.startDate)} day${daysBetween(today, trip.startDate) === 1 ? '' : 's'}`
        : 'Finished';
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
          ≈ {formatCurrency(summary.spentHome, trip.homeCurrency)} at home
          {cardFee > 0 ? `, card payments incl. ${cardFee}% fee` : ''}
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
              {Math.round(used * 100)}% of {formatCurrency(trip.budget, trip.currency)}
            </AppText>
            <AppText variant="caption" style={{ color: c.onFeature, opacity: 0.7 }}>
              {summary.remaining !== null && summary.remaining < 0
                ? `${formatCurrency(-summary.remaining, trip.currency)} over`
                : summary.perDayLeft !== null
                  ? `${formatCurrency(summary.perDayLeft, trip.currency)}/day left`
                  : `${formatCurrency(summary.remaining ?? 0, trip.currency)} left`}
            </AppText>
          </View>
        </View>
      )}
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${trip.name} trip details`}>
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
