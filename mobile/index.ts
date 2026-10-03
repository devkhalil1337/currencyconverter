import 'expo-router/entry';
// Defines the background alert task at load time, before anything renders: headless launches
// (the OS waking the app to check alerts) never mount the layout that also imports it.
import './src/tasks/rate-alerts';

import { Platform } from 'react-native';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from './src/widgets/task-handler';

// Android home-screen widgets render through a headless JS task.
if (Platform.OS === 'android') {
  registerWidgetTaskHandler(widgetTaskHandler);
}
