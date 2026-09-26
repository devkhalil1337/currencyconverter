import { Platform } from 'react-native';

import { iosWidgetSnapshot } from './widget-data';

type AppleTargets = typeof import('@bacons/apple-targets');

// Must match app.json's App Group and the key targets/widget/RatesProvider.swift reads.
const APP_GROUP = 'group.com.currency.io';
const SNAPSHOT_KEY = 'widgetSnapshot';

let cached: { pkg: AppleTargets; storage: InstanceType<AppleTargets['ExtensionStorage']> } | null | undefined;
let lastWritten: string | null = null;

function load() {
  if (cached === undefined) {
    try {
      // Required lazily: the package reads the `expo` native global as soon as
      // it is imported, which static web rendering doesn't have.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pkg = require('@bacons/apple-targets') as AppleTargets;
      cached = { pkg, storage: new pkg.ExtensionStorage(APP_GROUP) };
    } catch (err) {
      console.warn('iOS widget storage is unavailable', err);
      cached = null;
    }
  }
  return cached;
}

/** Saves the widget snapshot to the App Group and asks WidgetKit to redraw. No-op off iOS. */
export function updateIosWidget(): void {
  if (Platform.OS !== 'ios') return;
  const ext = load();
  if (!ext) return;
  const json = JSON.stringify(iosWidgetSnapshot());
  if (json === lastWritten) return;
  try {
    // In Expo Go the native module is missing and the package falls back to no-ops.
    ext.storage.set(SNAPSHOT_KEY, json);
    ext.pkg.ExtensionStorage.reloadWidget();
    lastWritten = json;
  } catch (err) {
    console.warn('iOS widget update failed', err);
  }
}
