import { syncLocale, t } from '@/i18n';
import { unitRate } from '@/lib/convert';
import { formatRate, formatTime } from '@/lib/format';
import {
  buildIosWidgetSnapshot,
  widgetCodes,
  type IosWidgetSnapshot,
  type WidgetSource,
} from '@/lib/widget-snapshot';
import { usePrefs } from '@/store/prefs';
import { isProNow, usePro } from '@/store/pro';
import { useRates } from '@/store/rates';

import type { RatesWidgetProps } from './rates-widget';

/** What every widget shows, read from the persisted stores (works in the headless widget task too). */
function widgetSource(): WidgetSource {
  const { homeCurrency, currencies } = usePrefs.getState();
  const { rates, names, fetchedAt } = useRates.getState();
  return {
    home: homeCurrency,
    codes: widgetCodes(homeCurrency, currencies),
    rates,
    names,
    fetchedAt,
    locked: !isProNow(),
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
    status: fetchedAt ? t('widget.updated', { time: formatTime(fetchedAt) }) : t('widget.openToLoad'),
    locked,
    lockedTitle: t('widget.lockedTitle'),
    lockedCta: t('widget.lockedCta'),
  };
}

/** The snapshot the iOS widgets read from the App Group. */
export function iosWidgetSnapshot(): IosWidgetSnapshot {
  return buildIosWidgetSnapshot(widgetSource());
}

export async function rehydrateWidgetStores(): Promise<void> {
  await Promise.all([usePrefs.persist.rehydrate(), useRates.persist.rehydrate(), usePro.persist.rehydrate()]);
  // The headless task has no screen to trigger it, so pick up the saved language here.
  syncLocale();
}
