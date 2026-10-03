import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useT } from '@/i18n';

import { AppText } from './app-text';
import { CurrencyBadge } from './currency-badge';

interface CurrencyRowProps {
  code: string;
  name: string;
  value: string;
  sub: string;
  isBase: boolean;
  subAccent?: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

export function CurrencyRow({ code, name, value, sub, isBase, subAccent, onPress, onLongPress }: CurrencyRowProps) {
  const c = useColors();
  const t = useT();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isBase }}
      accessibilityLabel={`${code.toUpperCase()}, ${name}, ${value}`}
      accessibilityHint={isBase ? t('convert.baseHint') : t('convert.otherHint')}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: isBase ? c.card : pressed ? c.subtle : 'transparent',
          borderColor: isBase ? c.accent : 'transparent',
        },
      ]}>
      <CurrencyBadge code={code} />
      <View style={styles.names}>
        <AppText variant="bodyStrong">{code.toUpperCase()}</AppText>
        <AppText variant="small" tone="muted" numberOfLines={1}>
          {name}
        </AppText>
      </View>
      <View style={styles.values}>
        <View style={styles.valueLine}>
          <AppText variant={isBase ? 'numberLarge' : 'number'} numberOfLines={1} adjustsFontSizeToFit>
            {value}
          </AppText>
          {isBase && <View style={[styles.caret, { backgroundColor: c.accent }]} />}
        </View>
        <AppText variant="caption" tone={subAccent ? 'accent' : 'muted'} numberOfLines={1}>
          {sub}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 62,
    paddingHorizontal: 14,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  names: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  values: {
    alignItems: 'flex-end',
    maxWidth: '55%',
    gap: 1,
  },
  valueLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one - 1,
  },
  caret: {
    width: 2,
    height: 22,
    borderRadius: 1,
  },
});
