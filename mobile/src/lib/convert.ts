export type Rates = Record<string, number>;

/** Converts `amount` between two currency codes using USD-based rates. */
export function convert(amount: number, from: string, to: string, rates: Rates | null): number | null {
  if (from === to) return amount;
  if (!rates) return null;
  const f = rates[from];
  const t = rates[to];
  if (!f || !t) return null;
  return amount * (t / f);
}

/** How many units of `to` one unit of `from` buys. */
export function unitRate(from: string, to: string, rates: Rates | null): number | null {
  return convert(1, from, to, rates);
}

export function withCardFee(value: number, feePercent: number): number {
  return value * (1 + feePercent / 100);
}

export type Key = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'del';

const MAX_DIGITS = 12;
const MAX_DECIMALS = 8;

/** Applies a keypad press to the typed amount string. */
export function pressKey(current: string, key: Key): string {
  if (key === 'del') {
    return current.length > 1 ? current.slice(0, -1) : '0';
  }
  if (key === '.') {
    return current.includes('.') ? current : current + '.';
  }
  if (current === '0') {
    return key;
  }
  const [intPart, fraction] = current.split('.');
  if (fraction !== undefined && fraction.length >= MAX_DECIMALS) return current;
  if (fraction === undefined && intPart.length >= MAX_DIGITS) return current;
  return current + key;
}

/** Rounds a converted value so it can become the new typed amount. */
export function toTypedAmount(value: number, code: string): string {
  const decimals = decimalsFor(value, code);
  const fixed = value.toFixed(decimals);
  return fixed.includes('.') ? fixed.replace(/\.?0+$/, '') || '0' : fixed;
}

const ZERO_DECIMAL = new Set(['jpy', 'krw', 'vnd', 'clp', 'isk', 'huf', 'idr', 'pyg', 'ugx', 'xaf', 'xof']);

export function decimalsFor(value: number, code: string): number {
  const abs = Math.abs(value);
  if (abs !== 0 && abs < 1) {
    // Keep ~3 significant digits for small values: 0.87, 0.00150, 0.0000123.
    return Math.min(8, Math.max(2, -Math.floor(Math.log10(abs)) + 2));
  }
  return ZERO_DECIMAL.has(code) ? 0 : 2;
}
