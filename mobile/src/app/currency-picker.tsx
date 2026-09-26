import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { CurrencyBadge } from '@/components/currency-badge';
import { Icon } from '@/components/icon';
import { Font, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useColors } from '@/hooks/use-colors';
import { usePrefs } from '@/store/prefs';
import { currencyName, POPULAR, useRates } from '@/store/rates';

type Mode = 'add' | 'home';

export default function CurrencyPicker() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { mode = 'add' } = useLocalSearchParams<{ mode?: Mode }>();
  const [query, setQuery] = useState('');
  const { rates, names } = useRates();
  const { currencies, homeCurrency, addCurrency, setHomeCurrency } = usePrefs();

  const options = useMemo(() => {
    const codes = Object.keys(rates ?? {}).filter((code) => names[code]?.trim());
    const rank = (code: string) => {
      const i = POPULAR.indexOf(code);
      return i === -1 ? POPULAR.length : i;
    };
    const q = query.trim().toLowerCase();
    return codes
      .filter((code) => (mode === 'add' ? !currencies.includes(code) : true))
      .filter((code) => !q || code.includes(q) || names[code].toLowerCase().includes(q))
      .sort((a, b) => rank(a) - rank(b) || currencyName(a, names).localeCompare(currencyName(b, names)));
  }, [rates, names, query, mode, currencies]);

  const choose = (code: string) => {
    if (mode === 'home') setHomeCurrency(code);
    else addCurrency(code);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <AppText style={styles.title}>{mode === 'home' ? 'Home currency' : 'Add currency'}</AppText>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={[styles.close, { backgroundColor: c.card, borderColor: c.line }]}>
            <Icon name="close" size={18} color={c.ink} />
          </Pressable>
        </View>

        <View style={[styles.search, { backgroundColor: c.card, borderColor: c.line }]}>
          <Icon name="search" size={18} color={c.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or code"
            placeholderTextColor={c.muted}
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Search currencies"
            style={[styles.input, { color: c.ink }]}
          />
        </View>

        <FlatList
          data={options}
          keyExtractor={(code) => code}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.four }}
          ListEmptyComponent={
            <AppText tone="muted" style={styles.empty}>
              {rates ? 'No matching currencies' : 'Rates haven’t downloaded yet'}
            </AppText>
          }
          renderItem={({ item: code }) => {
            const selected = mode === 'home' && code === homeCurrency;
            return (
              <Pressable
                onPress={() => choose(code)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${code.toUpperCase()}, ${currencyName(code, names)}`}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.subtle }]}>
                <CurrencyBadge code={code} size={34} />
                <View style={styles.names}>
                  <AppText variant="bodyStrong">{code.toUpperCase()}</AppText>
                  <AppText variant="small" tone="muted" numberOfLines={1}>
                    {currencyName(code, names)}
                  </AppText>
                </View>
                {selected && <Icon name="check" size={20} color={c.accent} />}
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: Font.serif,
    fontSize: 30,
    lineHeight: 34,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: Font.regular,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.md,
  },
  names: {
    flex: 1,
    minWidth: 0,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
});
