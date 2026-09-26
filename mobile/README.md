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
- **Settings**: home currency, card fee, appearance (system/light/dark), refresh rates.
- **Onboarding**: home currency (detected from the region) and travel currencies on first launch.
- **Rates**: pair chart (1W, 1M, 1Y, 5Y) with scrubbing, low/high, and a compare list. History comes from ECB via
  Frankfurter for ~30 major currencies, and from exchange-api daily snapshots for the rest.
- **Rate alerts**: "rises above / falls below" targets per pair, checked on every rates refresh and by a
  background task (~15 min), with a local notification when reached. Notifications and background
  checks need a development or store build; in Expo Go alerts only show as Reached in the list.
- **Trips**: placeholder.

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
