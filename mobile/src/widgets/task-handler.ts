import { Platform } from 'react-native';
import { requestPinWidget, requestWidgetUpdate, type WidgetTaskHandler } from 'react-native-android-widget';

import { useRates } from '@/store/rates';

import { RATES_WIDGET, ratesWidget } from './rates-widget';
import { ratesWidgetProps, rehydrateWidgetStores } from './widget-data';

/** Runs headless when the launcher adds, resizes or periodically updates a widget. */
export const widgetTaskHandler: WidgetTaskHandler = async ({ widgetInfo, widgetAction, renderWidget }) => {
  if (widgetInfo.widgetName !== RATES_WIDGET) return;
  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      await rehydrateWidgetStores();
      // Periodic updates double as a cheap refresh; refresh() skips if rates are fresh.
      if (widgetAction === 'WIDGET_UPDATE') await useRates.getState().refresh();
      renderWidget(ratesWidget(ratesWidgetProps()));
      break;
    default:
      break;
  }
};

/** Re-renders any placed widgets after in-app changes (rates, list, Pro). */
export function updateRatesWidget(): void {
  if (Platform.OS !== 'android') return;
  requestWidgetUpdate({
    widgetName: RATES_WIDGET,
    renderWidget: () => ratesWidget(ratesWidgetProps()),
  }).catch((err) => console.warn('Widget update failed', err));
}

/** Asks the launcher to place the widget; returns false if the launcher can't pin widgets. */
export async function pinRatesWidget(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    return await requestPinWidget({ widgetName: RATES_WIDGET });
  } catch (err) {
    console.warn('Pinning the widget failed', err);
    return false;
  }
}
