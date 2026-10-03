import * as BackgroundTask from 'expo-background-task';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { syncLocale } from '@/i18n';
import { checkAlerts } from '@/lib/check-alerts';
import { useAlerts } from '@/store/alerts';
import { usePrefs } from '@/store/prefs';
import { useRates } from '@/store/rates';

export const RATE_ALERTS_TASK = 'trippence-rate-alerts';

// Must run at module load (global scope) so the OS can wake the task
// even when no screen is mounted.
if (Platform.OS !== 'web') {
  TaskManager.defineTask(RATE_ALERTS_TASK, async () => {
    try {
      await Promise.all([
        useRates.persist.rehydrate(),
        useAlerts.persist.rehydrate(),
        usePrefs.persist.rehydrate(),
      ]);
      // Notifications go out in the saved language.
      syncLocale();
      await useRates.getState().refresh(true);
      await checkAlerts();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (err) {
      console.warn('Rate alert task failed', err);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

/** Registers the periodic check while there are alerts to watch, and removes it otherwise. */
export async function syncAlertTask(hasActiveAlerts: boolean): Promise<void> {
  // Background tasks need a development or store build; Expo Go only warns.
  if (Platform.OS === 'web' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
  const registered = await TaskManager.isTaskRegisteredAsync(RATE_ALERTS_TASK);
  if (hasActiveAlerts && !registered) {
    await BackgroundTask.registerTaskAsync(RATE_ALERTS_TASK, { minimumInterval: 15 });
  } else if (!hasActiveAlerts && registered) {
    await BackgroundTask.unregisterTaskAsync(RATE_ALERTS_TASK);
  }
}
