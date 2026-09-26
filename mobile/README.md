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
- **Rates** (basic list) and **Trips** (placeholder). Charts, alerts and trips come next.

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

## Store identity

`app.json` keeps the existing Play Store package `com.currency.io` with `versionCode` 40000,
which is above the Cordova app's 30201, so this ships as an update to the current listing.
Sign it with the **same upload key** as the Cordova app, or reset the upload key in Play Console.
