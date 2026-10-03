export type Direction = 'above' | 'below';

export interface RateAlert {
  id: string;
  from: string;
  to: string;
  direction: Direction;
  target: number;
  createdAt: number;
  /** When the alert fired; null while it is still watching. */
  triggeredAt: number | null;
}

/** True when `rate` has reached the alert's target. */
export function isTriggered(alert: Pick<RateAlert, 'direction' | 'target'>, rate: number | null): boolean {
  if (rate === null || !Number.isFinite(rate)) return false;
  return alert.direction === 'above' ? rate >= alert.target : rate <= alert.target;
}

export type TargetProblem = 'notPositive' | 'notAbove' | 'notBelow';

/**
 * Returns why the target can't make a useful alert, e.g. an "above" target
 * that the rate has already passed, or null when it can.
 */
export function validateTarget(direction: Direction, target: number, current: number | null): TargetProblem | null {
  if (!Number.isFinite(target) || target <= 0) return 'notPositive';
  if (current === null) return null;
  if (direction === 'above' && target <= current) return 'notAbove';
  if (direction === 'below' && target >= current) return 'notBelow';
  return null;
}

/**
 * Parses a typed number with either "," or "." as the decimal separator. When both appear, the
 * last one is the decimal point ("1.234,5" and "1,234.5" are both 1234.5); a separator repeated
 * on its own groups thousands ("1.234.567"); a single one is the decimal point ("0,92").
 */
export function parseRateInput(text: string): number {
  const s = text.replace(/[\s\u00a0\u202f'’]/g, '');
  if (!/^[\d.,]*\d[\d.,]*$/.test(s)) return NaN;
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  let decimal: '.' | ',' | null = null;
  if (lastDot !== -1 && lastComma !== -1) {
    decimal = lastDot > lastComma ? '.' : ',';
  } else if (lastDot !== -1 || lastComma !== -1) {
    const sep = lastDot !== -1 ? '.' : ',';
    if (s.indexOf(sep) === s.lastIndexOf(sep)) decimal = sep;
  }
  const point = decimal ? s.lastIndexOf(decimal) : s.length;
  const whole = s.slice(0, point);
  const fraction = s.slice(point + 1);
  if (/[.,]/.test(fraction)) return NaN;
  if (/[.,]/.test(whole) && !/^\d{1,3}([.,]\d{3})+$/.test(whole)) return NaN;
  return parseFloat(`${whole.replace(/[.,]/g, '') || '0'}.${fraction || '0'}`);
}

/** A sensible starting target: 1% away from the current rate. */
export function suggestTarget(direction: Direction, current: number): number {
  return direction === 'above' ? current * 1.01 : current * 0.99;
}
