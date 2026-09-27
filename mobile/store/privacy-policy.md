# Trippence Privacy Policy

_Effective: 26 September 2026_

Trippence is a currency converter. It works without an account and does not collect personal
data. This policy explains what the app stores and which services it contacts.

## What stays on your device

Trippence saves the following **only on your device**. It is never uploaded to us:

- Your settings: home currency, the currencies in your list, card fee, and appearance.
- The last downloaded exchange rates, so the app works offline.
- Rate alerts you create (currency pair, direction and target rate).
- Trips you create and the expenses you log in them.

Deleting the app removes all of this data.

## Services the app contacts

To download exchange rates and rate history, Trippence sends requests to these public services.
The requests contain only the currencies needed and never contain personal information.

| Service | Used for | Operator |
|---|---|---|
| `currency-api.pages.dev` | Latest and past daily rates | Cloudflare Pages, hosting the open-source [exchange-api](https://github.com/fawazahmed0/exchange-api) |
| `cdn.jsdelivr.net` | Backup source for the same rates | jsDelivr |
| `api.frankfurter.dev` | Rate history (European Central Bank data) | Frankfurter |

Like any website, these services receive your IP address when the app connects to them. See
their own privacy policies for how they handle server logs.

## Purchases

Trippence Pro is sold through the App Store and Google Play. Payments are handled entirely by Apple
or Google; Trippence never sees your card details. To check whether you have Pro, the app uses
[RevenueCat](https://www.revenuecat.com/privacy), which receives an anonymous app user ID, your
purchase history for this app, and basic device information (such as OS version and country from
the store). This data is used only to unlock Pro and restore purchases, and is not used for
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
- No selling of data. Purchase data is shared only with RevenueCat, as described above.

## Children

Trippence is not directed at children under 13 and does not knowingly collect any data from them.

## Changes

If this policy changes, for example when optional features such as analytics are
added, the updated version will be published here with a new effective date, and the app store
listings will be updated before the change ships.

## Contact

Questions about privacy: [CONTACT EMAIL]
