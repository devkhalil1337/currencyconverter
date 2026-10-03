// Pulled in only as optional peers of expo-router / expo-modules-core; the app never uses
// them, and linking their native code costs startup time on low-end phones.
const unused = ['react-native-reanimated', 'react-native-worklets', 'react-native-gesture-handler'];

module.exports = {
  dependencies: Object.fromEntries(unused.map((name) => [name, { platforms: { android: null, ios: null } }])),
};
