import { StyleSheet, Text, View } from 'react-native';

import { Font } from '@/constants/theme';
import { useBadgeTone } from '@/hooks/use-colors';

export function CurrencyBadge({ code, size = 38 }: { code: string; size?: number }) {
  const [bg, fg] = useBadgeTone(code);
  const label = code.toUpperCase();
  const fontSize = label.length > 3 ? size * 0.22 : size * 0.29;
  return (
    <View
      style={[styles.badge, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Text style={[styles.text, { color: fg, fontSize }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: Font.bold,
    letterSpacing: 0.3,
  },
});
