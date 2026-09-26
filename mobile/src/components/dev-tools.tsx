import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { useState } from 'react';
import { Platform } from 'react-native';

import { checkAlerts } from '@/lib/check-alerts';
import { requestNotificationPermission, showNotification } from '@/lib/notifications';
import { useRates } from '@/store/rates';
import { RATE_ALERTS_TASK } from '@/tasks/rate-alerts';

import { ListGroup, ListRow } from './list-group';

/** Debug-only helpers for checking notifications and the background task on a device. */
export function DevTools() {
  const [status, setStatus] = useState('');

  const testNotification = async () => {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      setStatus(`Notifications: ${permission}`);
      return;
    }
    await showNotification('Fairrate test', 'Notifications are working.');
    setStatus('Test notification sent');
  };

  const runTask = async () => {
    if (Platform.OS === 'web') return;
    const registered = await TaskManager.isTaskRegisteredAsync(RATE_ALERTS_TASK);
    if (!registered) {
      setStatus('Task not registered (create an alert first)');
      return;
    }
    const ran = await BackgroundTask.triggerTaskWorkerForTestingAsync();
    setStatus(ran ? 'Background check ran' : 'Background check did not run');
  };

  const simulateMove = async (factor: number) => {
    const rates = useRates.getState().rates;
    if (!rates) return;
    const moved = Object.fromEntries(
      Object.entries(rates).map(([code, rate]) => [code, code === 'usd' ? rate : rate * factor])
    );
    const fired = await checkAlerts(moved);
    setStatus(`${fired} alert${fired === 1 ? '' : 's'} fired`);
  };

  return (
    <ListGroup title="Developer">
      <ListRow label="Send test notification" onPress={testNotification} />
      <ListRow label="Run background check now" onPress={runTask} />
      <ListRow label="Simulate rates +2%" onPress={() => simulateMove(1.02)} />
      <ListRow label="Simulate rates −2%" onPress={() => simulateMove(0.98)} />
      {status ? <ListRow label="Result" value={status} /> : null}
    </ListGroup>
  );
}
