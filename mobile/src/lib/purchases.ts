import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';

/** RevenueCat entitlement that unlocks Pro. Create it with this identifier in the dashboard. */
export const PRO_ENTITLEMENT = 'pro';

/**
 * Public SDK keys come from env vars so none are hard-coded:
 * - EXPO_PUBLIC_REVENUECAT_TEST_KEY: RevenueCat Test Store, used in development builds only
 *   (the SDK refuses a Test Store key in release builds).
 * - EXPO_PUBLIC_REVENUECAT_APPLE_KEY / EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY: store keys for releases.
 */
function apiKey(): string | null {
  const test = process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY;
  if (__DEV__ && test) return test;
  if (Platform.OS === 'ios') return process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY ?? null;
  if (Platform.OS === 'android') return process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY ?? null;
  return null;
}

let configured = false;

/** True once the SDK has a key; without one the paywall explains purchases aren't set up. */
export function purchasesAvailable(): boolean {
  return configured;
}

export function hasPro(info: CustomerInfo): boolean {
  return info.entitlements.active[PRO_ENTITLEMENT] !== undefined;
}

/** Configures RevenueCat once and reports entitlement changes. */
export function configurePurchases(onChange: (isPro: boolean) => void): void {
  if (configured || Platform.OS === 'web') return;
  const key = apiKey();
  if (!key) return;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: key });
  configured = true;
  Purchases.addCustomerInfoUpdateListener((info) => onChange(hasPro(info)));
  Purchases.getCustomerInfo()
    .then((info) => onChange(hasPro(info)))
    .catch((err) => console.warn('Could not load purchases', err));
}

const ORDER = [PACKAGE_TYPE.ANNUAL, PACKAGE_TYPE.MONTHLY, PACKAGE_TYPE.LIFETIME];

/** Packages of the current offering, yearly first. */
export async function loadPackages(): Promise<PurchasesPackage[]> {
  if (!configured) return [];
  const offerings = await Purchases.getOfferings();
  const packages = offerings.current?.availablePackages ?? [];
  const rank = (p: PurchasesPackage) => {
    const i = ORDER.indexOf(p.packageType);
    return i === -1 ? ORDER.length : i;
  };
  return [...packages].sort((a, b) => rank(a) - rank(b));
}

export type PurchaseResult = 'purchased' | 'cancelled' | 'failed';

export async function buy(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return hasPro(customerInfo) ? 'purchased' : 'failed';
  } catch (err) {
    if ((err as { code?: string }).code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return 'cancelled';
    console.warn('Purchase failed', err);
    return 'failed';
  }
}

/** Restores earlier purchases; resolves to whether Pro is active afterwards. */
export async function restore(): Promise<boolean> {
  if (!configured) return false;
  const info = await Purchases.restorePurchases();
  return hasPro(info);
}
