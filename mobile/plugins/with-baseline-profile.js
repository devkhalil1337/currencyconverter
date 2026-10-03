const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

// Hot code on the startup path. Google Play compiles these ahead of time at install, so
// the first launches don't run React Native through the JIT (about 2 s on a low-end phone).
const PACKAGES = [
  'com/facebook/react',
  'com/facebook/hermes',
  'com/facebook/jni',
  'com/facebook/soloader',
  'com/facebook/yoga',
  'com/facebook/fbreact',
  'expo/modules',
  'com/swmansion/rnscreens',
  'com/horcrux/svg',
  'com/th3rdwave/safeareacontext',
  'com/reactnativecommunity/asyncstorage',
  'com/google/android/material/bottomnavigation',
  'com/google/android/material/navigation',
  'com/currency/io',
];

const PROFILE = PACKAGES.map((p) => `HSPL${p}/**->**(**)**\nL${p}/**;`).join('\n') + '\n';

module.exports = function withBaselineProfile(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const file = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', 'main', 'baseline-prof.txt');
      fs.writeFileSync(file, PROFILE);
      return cfg;
    },
  ]);
};
