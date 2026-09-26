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

/**
 * Returns an error message when the target can't make a useful alert,
 * e.g. an "above" target that the rate has already passed.
 */
export function validateTarget(direction: Direction, target: number, current: number | null): string | null {
  if (!Number.isFinite(target) || target <= 0) return 'Enter a rate greater than 0.';
  if (current === null) return null;
  if (direction === 'above' && target <= current) return 'Pick a rate above the current one.';
  if (direction === 'below' && target >= current) return 'Pick a rate below the current one.';
  return null;
}

/** Parses user input that may use a comma as the decimal separator. */
export function parseRateInput(text: string): number {
  return parseFloat(text.replace(/\s/g, '').replace(',', '.'));
}

/** A sensible starting target: 1% away from the current rate. */
export function suggestTarget(direction: Direction, current: number): number {
  return direction === 'above' ? current * 1.01 : current * 0.99;
}
