import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { t } from '@/i18n';

type NotificationsModule = typeof import('expo-notifications');

const CHANNEL_ID = 'rate-alerts';

// Expo Go on Android throws as soon as expo-notifications is imported, so the
// module is only loaded where it can work (development and store builds).
export const notificationsSupported =
  Platform.OS !== 'web' &&
  !(Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient);

let cached: NotificationsModule | null | undefined;

function load(): NotificationsModule | null {
  if (cached === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = notificationsSupported ? (require('expo-notifications') as NotificationsModule) : null;
  }
  return cached;
}

let channelReady: Promise<void> | null = null;

function ensureChannel(n: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return Promise.resolve();
  channelReady ??= n
    .setNotificationChannelAsync(CHANNEL_ID, {
      name: t('notifications.channelName'),
      description: t('notifications.channelDescription'),
      importance: n.AndroidImportance.HIGH,
    })
    .then(() => undefined);
  return channelReady;
}

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

/** Asks once; on Android 13+ the OS prompt needs a channel to exist first. */
export async function requestNotificationPermission(): Promise<PermissionState> {
  const n = load();
  if (!n) return 'unsupported';
  await ensureChannel(n);
  const current = await n.getPermissionsAsync();
  if (current.status === 'granted' || !current.canAskAgain) return current.status;
  const { status } = await n.requestPermissionsAsync();
  return status;
}

export async function showNotification(title: string, body: string): Promise<void> {
  const n = load();
  if (!n) return;
  await ensureChannel(n);
  await n.scheduleNotificationAsync({
    content: { title, body },
    // An immediate trigger that names the channel; `null` would use Expo's fallback channel.
    trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
  });
}

/** Show alerts as banners even while the app is open. */
export function configureForegroundNotifications() {
  load()?.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
