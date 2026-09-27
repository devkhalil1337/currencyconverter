import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { pressKey, type Key } from '@/lib/convert';

import { persistStorage } from './storage';

export type Appearance = 'system' | 'light' | 'dark';

const MAX_CURRENCIES = 12;

interface PrefsState {
  homeCurrency: string;
  /** Currencies shown on the Convert screen, in order. */
  currencies: string[];
  base: string;
  /** The amount exactly as typed on the keypad, e.g. "45." */
  amount: string;
  realCost: boolean;
  cardFee: number;
  appearance: Appearance;
  onboarded: boolean;

  press: (key: Key) => void;
  completeOnboarding: (currencies: string[]) => void;
  setBase: (code: string, amount: string) => void;
  toggleRealCost: () => void;
  setCardFee: (fee: number) => void;
  setAppearance: (appearance: Appearance) => void;
  setHomeCurrency: (code: string) => void;
  addCurrency: (code: string) => void;
  removeCurrency: (code: string) => void;
}

function detectHomeCurrency(): string {
  const code = getLocales()[0]?.currencyCode;
  return code ? code.toLowerCase() : 'usd';
}

function defaultCurrencies(home: string): string[] {
  return Array.from(new Set([home, 'usd', 'eur', 'gbp', 'jpy'])).slice(0, 5);
}

const home = detectHomeCurrency();

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      homeCurrency: home,
      currencies: defaultCurrencies(home),
      base: home,
      amount: '100',
      realCost: false,
      cardFee: 3,
      appearance: 'system',
      onboarded: false,

      press: (key) => set((s) => ({ amount: pressKey(s.amount, key) })),
      completeOnboarding: (picked) =>
        set((s) => {
          const list = Array.from(new Set([s.homeCurrency, ...picked])).slice(0, MAX_CURRENCIES);
          return {
            onboarded: true,
            currencies: list.length >= 2 ? list : defaultCurrencies(s.homeCurrency),
            base: s.homeCurrency,
            amount: '100',
          };
        }),
      setBase: (code, amount) => set({ base: code, amount }),
      toggleRealCost: () => set((s) => ({ realCost: !s.realCost })),
      setCardFee: (fee) => set({ cardFee: Math.min(10, Math.max(0, Math.round(fee * 10) / 10)) }),
      setAppearance: (appearance) => set({ appearance }),
      setHomeCurrency: (code) =>
        set((s) => ({
          homeCurrency: code,
          currencies: s.currencies.includes(code)
            ? s.currencies
            : [code, ...s.currencies].slice(0, MAX_CURRENCIES),
        })),
      addCurrency: (code) =>
        set((s) =>
          s.currencies.includes(code)
            ? s
            : { currencies: [...s.currencies, code].slice(0, MAX_CURRENCIES) }
        ),
      removeCurrency: (code) =>
        set((s) => {
          if (s.currencies.length <= 2) return s;
          const currencies = s.currencies.filter((c) => c !== code);
          return {
            currencies,
            base: s.base === code ? currencies[0] : s.base,
          };
        }),
    }),
    {
      name: 'trippence-prefs',
      storage: persistStorage,
      version: 1,
    }
  )
);
