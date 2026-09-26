import 'expo-router/entry';

import { Platform } from 'react-native';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from './src/widgets/task-handler';

// Android home-screen widgets render through a headless JS task.
if (Platform.OS === 'android') {
  registerWidgetTaskHandler(widgetTaskHandler);
}
