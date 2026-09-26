import { useAlerts } from '@/store/alerts';
import { useRates } from '@/store/rates';

import { isTriggered } from './alerts';
import { unitRate } from './convert';
import { formatRate } from './format';
import { showNotification } from './notifications';

/**
 * Fires a notification for every active alert whose target the cached rates
 * have reached, then marks those alerts as triggered. Returns how many fired.
 */
export async function checkAlerts(): Promise<number> {
  const { rates } = useRates.getState();
  const { alerts, markTriggered } = useAlerts.getState();
  if (!rates) return 0;

  const due = alerts
    .filter((a) => a.triggeredAt === null)
    .map((a) => ({ alert: a, rate: unitRate(a.from, a.to, rates) }))
    .filter(({ alert, rate }) => isTriggered(alert, rate));
  if (due.length === 0) return 0;

  markTriggered(
    due.map(({ alert }) => alert.id),
    Date.now()
  );
  await Promise.all(
    due.map(({ alert, rate }) => {
      const pair = `${alert.from.toUpperCase()}/${alert.to.toUpperCase()}`;
      const verb = alert.direction === 'above' ? 'rose above' : 'fell below';
      return showNotification(
        `${pair} ${verb} ${formatRate(alert.target)}`,
        `1 ${alert.from.toUpperCase()} = ${formatRate(rate ?? 0)} ${alert.to.toUpperCase()} now.`
      ).catch((err) => console.warn('Alert notification failed', err));
    })
  );
  return due.length;
}
