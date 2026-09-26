import { Platform } from 'react-native';
import Purchases, {
  INTRO_ELIGIBILITY_STATUS,
  LOG_LEVEL,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';

import { freeTrial, type Period } from './trial';

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

/**
 * Free trials by package identifier, only where this user would get one. Google Play already
 * leaves out offers the user can't redeem. iOS has to be asked, and anything but a clear "eligible"
 * counts as no, so the paywall never promises a trial the App Store won't give.
 */
export async function loadTrials(packages: PurchasesPackage[]): Promise<Record<string, Period>> {
  const found = packages.flatMap((pkg) => {
    const trial = freeTrial(pkg.product);
    return trial ? [{ pkg, trial }] : [];
  });
  if (found.length === 0) return {};
  if (Platform.OS !== 'ios') return Object.fromEntries(found.map(({ pkg, trial }) => [pkg.identifier, trial]));
  try {
    const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility(
      found.map(({ pkg }) => pkg.product.identifier)
    );
    const eligible = found.filter(
      ({ pkg }) =>
        eligibility[pkg.product.identifier]?.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE
    );
    return Object.fromEntries(eligible.map(({ pkg, trial }) => [pkg.identifier, trial]));
  } catch (err) {
    console.warn('Could not check trial eligibility', err);
    return {};
  }
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
