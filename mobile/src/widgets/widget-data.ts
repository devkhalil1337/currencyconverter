import { unitRate } from '@/lib/convert';
import { formatRate, formatTime } from '@/lib/format';
import { usePrefs } from '@/store/prefs';
import { usePro } from '@/store/pro';
import { useRates } from '@/store/rates';

import type { RatesWidgetProps } from './rates-widget';

/** Builds widget content from the persisted stores (works in the headless widget task too). */
export function ratesWidgetProps(): RatesWidgetProps {
  const { homeCurrency, currencies } = usePrefs.getState();
  const { rates, fetchedAt } = useRates.getState();
  const { isPro, devPro } = usePro.getState();
  const rows = currencies
    .filter((code) => code !== homeCurrency)
    .slice(0, 3)
    .map((code) => {
      const rate = unitRate(homeCurrency, code, rates);
      return { code, rate: rate !== null ? formatRate(rate) : '—' };
    });
  return {
    home: homeCurrency,
    rows,
    updated: fetchedAt ? formatTime(fetchedAt) : null,
    locked: !(isPro || (__DEV__ && devPro)),
  };
}

export async function rehydrateWidgetStores(): Promise<void> {
  await Promise.all([usePrefs.persist.rehydrate(), useRates.persist.rehydrate(), usePro.persist.rehydrate()]);
}
