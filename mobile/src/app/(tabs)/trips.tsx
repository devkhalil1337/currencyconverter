import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Font, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';

export default function TripsScreen() {
  const c = useColors();
  return (
    <Screen title="Trips">
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: c.inverse }]}>
          <Icon name="suitcase" size={28} color={c.accent} />
          <AppText style={[styles.cardTitle, { color: c.onInverse }]}>Track a trip’s spending</AppText>
          <AppText variant="small" style={{ color: c.onInverse, opacity: 0.75 }}>
            Set a budget, log expenses in the local currency and see the total at home — card fees included.
            Receipt scanning comes with Fairrate Pro.
          </AppText>
          <View style={[styles.badge, { backgroundColor: c.accentSoft }]}>
            <AppText variant="caption" style={{ color: c.accentOnSoft, fontFamily: Font.bold }}>
              COMING SOON
            </AppText>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.three,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.xl,
  },
  cardTitle: {
    fontFamily: Font.serif,
    fontSize: 30,
    lineHeight: 34,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
});
