import { Pressable, StyleSheet, View } from 'react-native';

import { useBadgeTone, useColors } from '@/hooks/use-colors';
import { useT } from '@/i18n';
import { formatCurrency, formatTime } from '@/lib/format';
import type { Expense } from '@/lib/trips';

import { AppText } from './app-text';
import { Icon } from './icon';

interface ExpenseRowProps {
  expense: Expense;
  currency: string;
  homeCurrency: string;
  onLongPress?: () => void;
}

export function ExpenseRow({ expense, currency, homeCurrency, onLongPress }: ExpenseRowProps) {
  const c = useColors();
  const t = useT();
  const [bg, fg] = useBadgeTone(expense.category);
  const category = t(`expense.categories.${expense.category}`);
  const time = formatTime(expense.createdAt);
  return (
    <Pressable
      onLongPress={onLongPress}
      accessibilityHint={onLongPress ? t('expense.longPressToDelete') : undefined}
      accessibilityLabel={`${expense.title || category}, ${formatCurrency(expense.amount, currency)}`}
      style={({ pressed }) => [styles.row, pressed && onLongPress && { backgroundColor: c.subtle }]}>
      <View style={[styles.icon, { backgroundColor: bg }]}>
        <Icon name={expense.category} size={18} color={fg} />
      </View>
      <View style={styles.flex}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {expense.title || category}
        </AppText>
        <AppText variant="small" tone="muted">
          {time} · {t(`expense.methods.${expense.method}`)}
        </AppText>
      </View>
      <View style={styles.amounts}>
        <AppText variant="bodyStrong" style={styles.num}>
          {formatCurrency(expense.amount, currency)}
        </AppText>
        {expense.homeAmount !== null && (
          <AppText variant="small" tone="muted" style={styles.num}>
            {formatCurrency(expense.homeAmount, homeCurrency)}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 14,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  amounts: {
    alignItems: 'flex-end',
  },
  num: {
    fontVariant: ['tabular-nums'],
  },
});
