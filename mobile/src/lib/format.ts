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
