import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const subscribe = () => () => {};

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * The server snapshot is `false`, so the first render matches the static HTML ("light").
 */
export function useColorScheme() {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  const colorScheme = useRNColorScheme();
  return isClient ? colorScheme : 'light';
}
