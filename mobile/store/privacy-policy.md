# Trippence Privacy Policy

_Effective: 28 September 2026_

The published version is `privacy-policy.html`; keep the two in step.

Trippence is a currency converter. It works without an account and does not collect personal
data. This policy explains what the app stores and which services it contacts.

## What stays on your device

Trippence saves the following **only on your device**. It is never uploaded to us:

- Your settings: home currency, the currencies in your list, card fee, and appearance.
- The last downloaded exchange rates, so the app works offline.
- Rate alerts you create (currency pair, direction and target rate).
- Trips you create and the expenses you log in them.

When you export a trip or rate history, the app creates a CSV file on your device and opens your
phone’s share sheet. The file goes only where you choose to send it.

Deleting the app removes all of this data.

## Services the app contacts

To download exchange rates and rate history, Trippence sends requests to these public services.
The requests contain only the currencies and dates needed and never contain personal information.
The home-screen widget uses the same services to keep its rates up to date.

| Service | Used for | Operator |
|---|---|---|
| `currency-api.pages.dev` | Latest and past daily rates | Cloudflare Pages, hosting the open-source [exchange-api](https://github.com/fawazahmed0/exchange-api) |
| `cdn.jsdelivr.net` | Backup source for the same rates | jsDelivr |
| `api.frankfurter.dev` | Rate history (European Central Bank data) | Frankfurter |

Like any website, these services receive your IP address when the app connects to them. See
their own privacy policies for how they handle server logs.

## Purchases

Every feature of Trippence is currently free, and the app has nothing to buy. In this version the
app does not contact any purchase service.

If a paid plan (“Trippence Pro”) is offered in a later version, it will be sold through Google Play
and the App Store. Payments are handled entirely by Google or Apple; Trippence never sees your card
details. To check whether you have Pro, the app would use
[RevenueCat](https://www.revenuecat.com/privacy), which receives an anonymous app user ID, your
purchase history for this app, and basic device information (such as OS version and country from
the store). This data would be used only to unlock Pro and restore purchases, never for
advertising.

## Notifications

Rate alert notifications are created **on your device** when a rate reaches your target. Trippence
does not use push notification servers and does not collect a push token. You can turn
notifications off at any time in your phone's settings.

To check alerts while the app is closed, Trippence asks the operating system to run a short
background task periodically. The task only downloads rates and compares them to your alerts.

## What Trippence does not do

- No account or sign-in.
- No advertising and no advertising identifiers.
- No analytics or tracking.
- No access to your location, contacts, camera, photos or files.
- No selling or sharing of data.

## Your choices

Because your data is stored only on your device, you control it directly: you can delete alerts,
expenses and trips inside the app, or remove everything by deleting the app. We hold no copy, so
there is nothing for us to export or erase on your behalf.

## Children

Trippence is not directed at children under 13 and does not knowingly collect any data from them.

## Changes

If this policy changes, for example when a paid plan or an optional feature is added, the updated version will be published here with a new effective date, and the app store
listings will be updated before the change ships.

## Contact

Questions about privacy: [CONTACT EMAIL]
