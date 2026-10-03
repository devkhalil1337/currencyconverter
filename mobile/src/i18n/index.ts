import { getCalendars, getLocales } from 'expo-localization';
import { I18n, type Pluralizer } from 'i18n-js';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { usePrefs } from '@/store/prefs';

import { en } from './en';
import { isSupported, type LanguageCode, type LanguagePref } from './languages';
import { de } from './locales/de';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { it } from './locales/it';
import { nl } from './locales/nl';
import { pt } from './locales/pt';

export { nativeName, SUPPORTED, type LanguageCode, type LanguagePref } from './languages';

type Widen<T> = { -readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

/** The shape every locale file must match: same keys as `en`, every leaf a string. */
export type Messages = Widen<typeof en>;

type PluralForms = { readonly one: string; readonly other: string };
type IsPlural<T> = T extends PluralForms
  ? [Exclude<keyof T, keyof PluralForms>] extends [never]
    ? true
    : false
  : false;

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : IsPlural<T[K]> extends true
      ? `${P}${K}`
      : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

type PluralLeaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? never
    : IsPlural<T[K]> extends true
      ? `${P}${K}`
      : PluralLeaves<T[K], `${P}${K}.`>;
}[keyof T & string];

/** A dotted path to a string (or plural set) in `en`, e.g. "tabs.convert". */
export type TranslationKey = Leaves<typeof en>;
export type PluralKey = PluralLeaves<typeof en>;

type Values = Record<string, string | number>;
type Args<K extends TranslationKey> = K extends PluralKey ? [values: Values & { count: number }] : [values?: Values];

const translations: Record<LanguageCode, Messages> = { en, es, de, fr, it, nl, pt };

const i18n = new I18n(translations, { defaultLocale: 'en', locale: 'en', enableFallback: true });

// French and Portuguese use the singular for 0 too.
const zeroIsOne: Pluralizer = (_i18n, count) => (Math.abs(count) < 2 ? ['one'] : ['other']);
i18n.pluralization.register('fr', zeroIsOne);
i18n.pluralization.register('pt', zeroIsOne);

/** Translates `key` in the current language. Safe outside React (tasks, widgets, notifications). */
export function t<K extends TranslationKey>(key: K, ...[values]: Args<K>): string {
  return i18n.t(key, values);
}

function deviceLocales() {
  try {
    return getLocales();
  } catch {
    return [];
  }
}

/** The first device language the app supports, else English. */
export function systemLanguage(): LanguageCode {
  for (const l of deviceLocales()) {
    if (isSupported(l.languageCode)) return l.languageCode;
  }
  return 'en';
}

function resolveLanguage(pref: LanguagePref): LanguageCode {
  return pref === 'system' ? systemLanguage() : pref;
}

// The language plus the region of the first device locale in that language (de-AT), else the bare language.
function localeFor(language: LanguageCode): string {
  const region = deviceLocales().find((l) => l.languageCode === language)?.regionCode;
  if (!region) return language;
  const tag = `${language}-${region}`;
  try {
    new Intl.NumberFormat(tag);
    return tag;
  } catch {
    return language;
  }
}

function deviceUses24HourClock(): boolean | null {
  try {
    return getCalendars()[0]?.uses24hourClock ?? null;
  } catch {
    return null;
  }
}

let language: LanguageCode = 'en';
let locale = 'en';
let clock24: boolean | null = null;
let boundT: typeof t = t.bind(null);
const listeners = new Set<() => void>();

/** The language in use right now. */
export function currentLanguage(): LanguageCode {
  return language;
}

/** BCP-47 tag for Intl number and date formatting, e.g. "de-AT". */
export function appLocale(): string {
  return locale;
}

/** The device's 12/24-hour setting, or null when unknown (web). */
export function uses24HourClock(): boolean | null {
  return clock24;
}

/** Re-reads the language preference and the device locales; re-renders useT() users on a change. */
export function syncLocale(): void {
  const nextLanguage = resolveLanguage(usePrefs.getState().language);
  const nextLocale = localeFor(nextLanguage);
  const nextClock = deviceUses24HourClock();
  if (nextLanguage === language && nextLocale === locale && nextClock === clock24) return;
  language = nextLanguage;
  locale = nextLocale;
  clock24 = nextClock;
  i18n.locale = nextLanguage;
  // A new function identity, so memoized components see the change.
  boundT = t.bind(null);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** `t` for components; re-renders them when the language changes. */
export function useT(): typeof t {
  return useSyncExternalStore(subscribe, () => boundT, () => boundT);
}

/** Changes whenever the language or formatting locale does; use as a React key to rebuild a subtree. */
export function useLocaleKey(): string {
  return useSyncExternalStore(
    subscribe,
    () => `${language}:${locale}`,
    () => `${language}:${locale}`
  );
}

syncLocale();
// Hydration and setLanguage both arrive through the store.
usePrefs.subscribe((state, prev) => {
  if (state.language !== prev.language) syncLocale();
});
usePrefs.persist.onFinishHydration(() => syncLocale());
// The device language or region may have changed while the app was in the background.
AppState.addEventListener('change', (state) => {
  if (state === 'active') syncLocale();
});
