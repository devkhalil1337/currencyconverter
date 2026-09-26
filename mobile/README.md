# Fairrate (Expo)

The rewrite of the Crypto Currency Converter Cordova app as **Fairrate**, a fast,
offline-first currency app for travelers and remote workers. Built with Expo SDK 57,
Expo Router and TypeScript for iOS, Android and web.

## Run it

```bash
npm install
npm start          # scan the QR code with Expo Go on your phone
npm run web        # open in the browser
```

Checks before committing:

```bash
npx expo lint
npm run typecheck
```

## What's in v1 so far

- **Convert**: currency list plus keypad, tap a row to make it the base, long press to remove,
  and **Real cost** mode (adds your card fee).
- **Offline rates**: last good rates are cached and used when the network is down.
- **Currency picker**: search 300+ currencies, add to the list, change the home currency.
- **Settings**: home currency, card fee, rate type (mid-market or with card fee, the same switch as
  the Convert tab's Real cost chip), appearance (system/light/dark), refresh rates, widgets.
- **Onboarding**: home currency (detected from the region) and travel currencies on first launch.
- **Rates**: pair chart (1W, 1M, 1Y, 5Y) with scrubbing, low/high, and a compare list. History comes from ECB via
  Frankfurter for ~30 major currencies, and from exchange-api daily snapshots for the rest.
- **Rate alerts**: "rises above / falls below" targets per pair, checked on every rates refresh and by a
  background task (~15 min), with a local notification when reached. Notifications and background
  checks need a development or store build; in Expo Go alerts only show as Reached in the list.
- **Trips**: trips with a local currency, dates and budget; expenses by category and card/cash,
  with the home cost fixed at entry (card fee included); budget left per day.
- **Pro** (RevenueCat): paywall with free-trial copy when the store offers a trial, restore,
  Settings card. Pro unlocks widgets, rates on any past date, CSV export,
  and unlimited alerts and trips. Free plan: 2 active alerts and 1 trip.
- **Widgets** (Pro): Android home-screen "Rates" widget, where free users see an unlock prompt;
  iOS home and lock-screen widgets (iOS 17+).

## Layout

```
src/
  app/                 routes (Expo Router)
    _layout.tsx        root stack: fonts, theme, rates refresh
    (tabs)/            Convert, Rates, Trips, Settings
    currency-picker.tsx  form sheet
  components/          UI building blocks (keypad, rows, chips, tabs)
  constants/theme.ts   design tokens from the mockups
  lib/                 pure logic: conversion, formatting, rates API
  store/               zustand stores persisted to AsyncStorage
```

Rates come from the free [fawazahmed0/exchange-api](https://github.com/fawazahmed0/exchange-api)
(Cloudflare host, jsDelivr fallback).

## Purchases (RevenueCat)

Create a RevenueCat project with an entitlement named `pro` and a current offering with annual,
monthly and lifetime packages. Then set the public SDK keys, for example in `.env.local`:

```bash
EXPO_PUBLIC_REVENUECAT_TEST_KEY=test_...        # Test Store, used in debug builds only
EXPO_PUBLIC_REVENUECAT_APPLE_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=goog_...
EXPO_PUBLIC_PRIVACY_URL=https://your-site/privacy
```

Without keys the paywall says purchases aren't set up. In debug builds, Settings › Developer ›
Pretend Pro unlocks Pro features for testing.

The paywall uses these reasons (`/paywall?reason=...`) for its first line: `alerts`, `trips`,
`history`, `export`, `scan`, `widgets`.

### Free trial setup

The paywall advertises a trial only when the store returns one, so there is nothing to switch on
in the app:

- **App Store Connect**: open the annual subscription › Subscription Prices › Introductory Offers,
  and add a **Free** offer for **1 week** in all territories.
- **Google Play Console**: on the annual subscription's base plan, add an offer for new customers
  with a **Free trial** phase of **7 days**, then activate it.
- **RevenueCat** picks both up automatically. No dashboard change is needed.

What the user sees: the yearly plan reads "7-day free trial · $1.25/mo", the button reads "Start
7-day free trial" and the fine print "Then $14.99/year. Cancel anytime." The length comes from
the store, so a 2-week trial shows as "14-day". On iOS the app also asks the App Store whether this
user is eligible and hides the trial unless the answer is a clear yes. Google Play only returns
offers the user can still redeem. Without a trial the button says "Subscribe" or "Buy lifetime".
Test with an App Store sandbox account or a Play license tester. The RevenueCat Test Store key used
in debug builds may not return intro offers.

## iOS widgets

Home and lock-screen widgets are a widget extension that `@bacons/apple-targets` generates from
`targets/widget` during prebuild, so they need a development or store build (not Expo Go) and
**iOS 17 or later**.

The app and the widget share data through the App Group `group.com.currency.io`. In the Apple
Developer portal (Certificates, Identifiers & Profiles › Identifiers) enable that App Group for
both `com.currency.io` and the widget's bundle ID `com.currency.io.widget`. EAS credentials can do
this for you: run an iOS build with `npx eas-cli@latest build --platform ios` and let it sync
capabilities and create the provisioning profiles for both targets.

Settings › Widgets shows free users the paywall and tells Pro users how to add a widget. The app
itself still supports iOS 16.4, so on iOS 16 the Widgets row and the paywall's widget line are
hidden.

## Testing on an iPhone

**Without an Apple Developer account:** install **Expo Go** from the App Store, run
`npx expo start --tunnel` and scan the QR code with the iPhone camera. The UI, charts and alert
notifications all work in Expo Go on iOS; background checks do not.

**With an Apple Developer account** (EAS builds in the cloud, no Mac needed):

```bash
npx eas-cli@latest login
npx eas-cli@latest device:create                                   # register the iPhone once
npx eas-cli@latest build --profile development --platform ios      # install via the link/QR
npx eas-cli@latest build --profile production --platform ios --auto-submit   # TestFlight
```

## Android builds on this Windows machine

The Android SDK and Gradle cache live under a user folder with a space in its name, which breaks
NDK linking. Use the junctions in `D:\sdk-links`:

```bash
ANDROID_HOME=D:/sdk-links/android-sdk GRADLE_USER_HOME=D:/sdk-links/gradle npx expo run:android
```

With the phone on USB, run `adb reverse tcp:8081 tcp:8081` so it can reach Metro.

## Store material

`store/listing.md` has the store texts and privacy answers; `store/privacy-policy.md` is the policy
to publish (fill in the contact email first).

## Store identity

`app.json` keeps the existing Play Store package `com.currency.io` with `versionCode` 40000,
which is above the Cordova app's 30201, so this ships as an update to the current listing.
Sign it with the **same upload key** as the Cordova app, or reset the upload key in Play Console.
