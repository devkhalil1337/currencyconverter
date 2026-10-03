/**
 * Free-trial and billing periods for the paywall. The product types are structural subsets
 * of react-native-purchases' PurchasesStoreProduct, so this file stays free of native imports.
 */

export type PeriodUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export interface Period {
  unit: PeriodUnit;
  count: number;
}

interface PricingPhaseLike {
  billingPeriod: { unit: string; value: number };
  billingCycleCount: number | null;
  price: { amountMicros: number; formatted: string };
}

export interface TrialProduct {
  /** App Store intro offer; a price of 0 means a free trial. */
  introPrice: { price: number; periodUnit: string; periodNumberOfUnits: number; cycles: number } | null;
  /** Google Play: the option RevenueCat buys, already limited to offers this user can get. */
  defaultOption: {
    freePhase: PricingPhaseLike | null;
    fullPricePhase: PricingPhaseLike | null;
    pricingPhases: PricingPhaseLike[];
  } | null;
}

const UNITS: readonly string[] = ['DAY', 'WEEK', 'MONTH', 'YEAR'];

function toPeriod(unit: string, count: number): Period | null {
  if (!UNITS.includes(unit) || !Number.isFinite(count) || count <= 0) return null;
  return { unit: unit as PeriodUnit, count };
}

/** The free trial the store would start for this product, or null if there is none. */
export function freeTrial(product: TrialProduct): Period | null {
  const option = product.defaultOption;
  if (option) {
    const phase = option.freePhase ?? option.pricingPhases.find((p) => p.price.amountMicros === 0) ?? null;
    if (!phase) return null;
    const cycles = Math.max(1, phase.billingCycleCount ?? 1);
    return toPeriod(phase.billingPeriod.unit, phase.billingPeriod.value * cycles);
  }
  const intro = product.introPrice;
  if (!intro || intro.price !== 0) return null;
  return toPeriod(intro.periodUnit, intro.periodNumberOfUnits * Math.max(1, intro.cycles));
}

/**
 * The recurring price after any trial. On Google Play priceString follows the default option,
 * which can be a trial offer, so the price comes from that option's last (full-price) phase.
 */
export function fullPrice(product: TrialProduct & { priceString: string }): string {
  return product.defaultOption?.fullPricePhase?.price.formatted ?? product.priceString;
}

/** 7 days, 1 month: stores offer trials in weeks, but people think of them in days. */
export function trialSpan(trial: Period): { unit: 'day' | 'month' | 'year'; count: number } {
  switch (trial.unit) {
    case 'DAY':
      return { unit: 'day', count: trial.count };
    case 'WEEK':
      return { unit: 'day', count: trial.count * 7 };
    case 'MONTH':
      return { unit: 'month', count: trial.count };
    case 'YEAR':
      return { unit: 'year', count: trial.count };
  }
}

/** Parses an ISO 8601 subscription period such as "P1Y" or "P3M". */
export function parsePeriod(iso: string | null | undefined): Period | null {
  const match = iso ? /^P(\d+)([DWMY])$/.exec(iso) : null;
  if (!match) return null;
  const unit = ({ D: 'DAY', W: 'WEEK', M: 'MONTH', Y: 'YEAR' } as const)[match[2] as 'D' | 'W' | 'M' | 'Y'];
  const count = Number(match[1]);
  if (unit === 'MONTH' && count === 12) return { unit: 'YEAR', count: 1 };
  if (unit === 'DAY' && count === 7) return { unit: 'WEEK', count: 1 };
  return toPeriod(unit, count);
}

const PACKAGE_PERIODS: Record<string, Period> = {
  ANNUAL: { unit: 'YEAR', count: 1 },
  SIX_MONTH: { unit: 'MONTH', count: 6 },
  THREE_MONTH: { unit: 'MONTH', count: 3 },
  TWO_MONTH: { unit: 'MONTH', count: 2 },
  MONTHLY: { unit: 'MONTH', count: 1 },
  WEEKLY: { unit: 'WEEK', count: 1 },
};

/** Billing period of a package, from the store when it reports one, else from the package type. */
export function billingPeriod(packageType: string, subscriptionPeriod: string | null): Period | null {
  return parsePeriod(subscriptionPeriod) ?? PACKAGE_PERIODS[packageType] ?? null;
}
