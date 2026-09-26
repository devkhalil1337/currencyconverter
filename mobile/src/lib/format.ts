import { decimalsFor } from './convert';

const formatters = new Map<number, Intl.NumberFormat>();

function formatter(decimals: number) {
  let f = formatters.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formatters.set(decimals, f);
  }
  return f;
}

export function formatMoney(value: number, code: string): string {
  return formatter(decimalsFor(value, code)).format(value);
}

export function formatRate(value: number): string {
  if (value >= 100) return formatter(2).format(value);
  if (value >= 1) return formatter(4).format(value);
  if (value <= 0) return formatter(4).format(value);
  return formatter(Math.min(8, -Math.floor(Math.log10(value)) + 4)).format(value);
}

/** Formats what the user is typing, keeping a trailing "." or zeros. */
export function formatTyped(typed: string): string {
  const [intPart, fraction] = typed.split('.');
  const grouped = formatter(0).format(parseInt(intPart || '0', 10));
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const currencyFormatters = new Map<string, Intl.NumberFormat | null>();

/** "€842.60" when the code is a known ISO currency, else "842.60 BTC". */
export function formatCurrency(value: number, code: string): string {
  const upper = code.toUpperCase();
  if (!currencyFormatters.has(upper)) {
    let f: Intl.NumberFormat | null = null;
    if (/^[A-Z]{3}$/.test(upper)) {
      try {
        f = new Intl.NumberFormat('en-US', { style: 'currency', currency: upper, currencyDisplay: 'narrowSymbol' });
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
