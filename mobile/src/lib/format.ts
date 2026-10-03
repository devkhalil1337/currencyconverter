import { appLocale, uses24HourClock } from '@/i18n';

import { decimalsFor } from './convert';

const formatters = new Map<string, Intl.NumberFormat>();
const currencyFormatters = new Map<string, Intl.NumberFormat | null>();
let separators: { decimal: string; group: string } | null = null;
let cachedLocale = '';

/** Formatters are cached per locale; a language change starts a fresh cache. */
function locale(): string {
  const current = appLocale();
  if (current !== cachedLocale) {
    formatters.clear();
    currencyFormatters.clear();
    separators = null;
    cachedLocale = current;
  }
  return current;
}

function formatter(decimals: number, grouping = true) {
  const tag = locale();
  const key = `${decimals}:${grouping}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(tag, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      // Left unset, grouping follows the locale (Spanish skips it for 4-digit numbers).
      ...(grouping ? {} : { useGrouping: false }),
    });
    formatters.set(key, f);
  }
  return f;
}

/** The locale's decimal and grouping separators, read off a sample number. */
export function numberSeparators(): { decimal: string; group: string } {
  locale();
  if (!separators) {
    const sample = formatter(1).format(1234567.5);
    const match = /1(\D*)234\D*567(\D+)5/.exec(sample);
    separators = { group: match?.[1] ?? ',', decimal: match?.[2] ?? '.' };
  }
  return separators;
}

export function formatMoney(value: number, code: string): string {
  return formatter(decimalsFor(value, code)).format(value);
}

function rateDecimals(value: number): number {
  if (value >= 1 || value <= 0) return value >= 100 ? 2 : 4;
  return Math.min(8, -Math.floor(Math.log10(value)) + 4);
}

export function formatRate(value: number): string {
  return formatter(rateDecimals(value)).format(value);
}

/** A rate as an editable value: same decimals as formatRate, no grouping. */
export function formatRateInput(value: number): string {
  return formatter(rateDecimals(value), false).format(value);
}

/** A plain number such as a card fee, e.g. 2.5 → "2,5" in German. */
export function formatNumber(value: number, decimals?: number): string {
  if (decimals !== undefined) return formatter(decimals).format(value);
  const tag = locale();
  const key = 'plain';
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(tag, { maximumFractionDigits: 8 });
    formatters.set(key, f);
  }
  return f.format(value);
}

/**
 * Formats what the user is typing, keeping a trailing "." or zeros. The typed amount
 * always uses "." internally; only the display uses the locale's separators.
 */
export function formatTyped(typed: string): string {
  const [intPart, fraction] = typed.split('.');
  const grouped = formatter(0).format(parseInt(intPart || '0', 10));
  return fraction === undefined ? grouped : `${grouped}${numberSeparators().decimal}${fraction}`;
}

export function formatTime(timestamp: number): string {
  const clock24 = uses24HourClock();
  return new Date(timestamp).toLocaleTimeString(appLocale(), {
    hour: '2-digit',
    minute: '2-digit',
    ...(clock24 === null ? {} : { hour12: !clock24 }),
  });
}

/** "€842.60" when the code is a known ISO currency, else "842.60 BTC". */
export function formatCurrency(value: number, code: string): string {
  const tag = locale();
  const upper = code.toUpperCase();
  if (!currencyFormatters.has(upper)) {
    let f: Intl.NumberFormat | null = null;
    if (/^[A-Z]{3}$/.test(upper)) {
      try {
        f = new Intl.NumberFormat(tag, { style: 'currency', currency: upper, currencyDisplay: 'narrowSymbol' });
      } catch {
        f = null;
      }
    }
    currencyFormatters.set(upper, f);
  }
  const f = currencyFormatters.get(upper);
  // Currency style rounds to 2 decimals, which hides small crypto amounts.
  if (!f || decimalsFor(value, code) > 2) return `${formatMoney(value, code)} ${upper}`;
  return f.format(value);
}
