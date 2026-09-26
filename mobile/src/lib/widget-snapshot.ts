import { unitRate, type Rates } from './convert';

/** How many currencies the widgets list against the home currency. */
export const WIDGET_ROWS = 3;

/** The Convert list in order, without the home currency. */
export function widgetCodes(home: string, currencies: string[]): string[] {
  return currencies.filter((code) => code !== home).slice(0, WIDGET_ROWS);
}

export interface WidgetSource {
  home: string;
  codes: string[];
  rates: Rates | null;
  names: Record<string, string>;
  fetchedAt: number | null;
  locked: boolean;
}

/** JSON the iOS widget extension reads from the App Group (decoded in targets/widget/RatesProvider.swift). */
export interface IosWidgetSnapshot {
  v: 1;
  home: string;
  /** `rate` is 1 home = rate code; null until rates have loaded. */
  rows: { code: string; name: string; rate: number | null }[];
  /** USD-based rates for home and rows, as fetched. */
  usdRates: Record<string, number>;
  /** When the app last fetched rates, in ms. */
  updatedAt: number | null;
  locked: boolean;
}

function usable(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function buildIosWidgetSnapshot({ home, codes, rates, names, fetchedAt, locked }: WidgetSource): IosWidgetSnapshot {
  const usdRates: Record<string, number> = {};
  for (const code of [home, ...codes]) {
    const usd = rates?.[code];
    if (usable(usd)) usdRates[code] = usd;
  }
  return {
    v: 1,
    home,
    rows: codes.map((code) => {
      const rate = unitRate(home, code, rates);
      return { code, name: names[code]?.trim() ?? '', rate: usable(rate) ? rate : null };
    }),
    usdRates,
    updatedAt: fetchedAt,
    locked,
  };
}
