import { unitRate } from '@/lib/convert';
import { formatRate, formatTime } from '@/lib/format';
import {
  buildIosWidgetSnapshot,
  widgetCodes,
  type IosWidgetSnapshot,
  type WidgetSource,
} from '@/lib/widget-snapshot';
import { usePrefs } from '@/store/prefs';
import { TEST_TOOLS, usePro } from '@/store/pro';
import { useRates } from '@/store/rates';

import type { RatesWidgetProps } from './rates-widget';

/** What every widget shows, read from the persisted stores (works in the headless widget task too). */
function widgetSource(): WidgetSource {
  const { homeCurrency, currencies } = usePrefs.getState();
  const { rates, names, fetchedAt } = useRates.getState();
  const { isPro, devPro } = usePro.getState();
  return {
    home: homeCurrency,
    codes: widgetCodes(homeCurrency, currencies),
    rates,
    names,
    fetchedAt,
    locked: !(isPro || (TEST_TOOLS && devPro)),
  };
}

/** Builds Android widget content from the persisted stores. */
export function ratesWidgetProps(): RatesWidgetProps {
  const { home, codes, rates, fetchedAt, locked } = widgetSource();
  const rows = codes.map((code) => {
    const rate = unitRate(home, code, rates);
    return { code, rate: rate !== null ? formatRate(rate) : '—' };
  });
  return {
    home,
    rows,
    updated: fetchedAt ? formatTime(fetchedAt) : null,
    locked,
  };
}

/** The snapshot the iOS widgets read from the App Group. */
export function iosWidgetSnapshot(): IosWidgetSnapshot {
  return buildIosWidgetSnapshot(widgetSource());
}

export async function rehydrateWidgetStores(): Promise<void> {
  await Promise.all([usePrefs.persist.rehydrate(), useRates.persist.rehydrate(), usePro.persist.rehydrate()]);
}
