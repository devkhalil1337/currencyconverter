import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Font, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { useT } from '@/i18n';
import type { Key } from '@/lib/convert';
import { numberSeparators } from '@/lib/format';

import { AppText } from './app-text';
import { Icon } from './icon';

const ROWS: Key[][] = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['.', '0', 'del'],
];

export function Keypad({ onPress }: { onPress: (key: Key) => void }) {
  const c = useColors();
  const t = useT();
  // The key always types "."; it only shows the locale's decimal separator.
  const decimal = numberSeparators().decimal;

  const handle = (key: Key) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress(key);
  };

  return (
    <View style={styles.grid}>
      {ROWS.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((key) => (
            <Pressable
              key={key}
              onPress={() => handle(key)}
              accessibilityRole="button"
              accessibilityLabel={key === 'del' ? t('keypad.delete') : key === '.' ? t('keypad.decimal') : key}
              style={({ pressed }) => [
                styles.key,
                {
                  backgroundColor: pressed ? c.subtle : c.key,
                  borderColor: c.line,
                },
              ]}>
              {key === 'del' ? (
                <Icon name="backspace" size={24} color={c.ink} strokeWidth={1.8} />
              ) : (
                <AppText style={styles.keyLabel}>{key === '.' ? decimal : key}</AppText>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  key: {
    flex: 1,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: {
    fontFamily: Font.medium,
    fontSize: 24,
    lineHeight: 30,
  },
});
