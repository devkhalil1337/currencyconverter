/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  displayName: 'Trippence',
  bundleIdentifier: '.widget',
  // containerBackground(for: .widget) needs iOS 17.
  deploymentTarget: '17.0',
  entitlements: {
    // The widget reads the snapshot the app saves to this App Group (src/widgets/ios-widget.ts).
    'com.apple.security.application-groups': config.ios?.entitlements?.['com.apple.security.application-groups'] ?? [
      'group.com.currency.io',
    ],
  },
});
