import { StyleSheet, View } from 'react-native';

/**
 * Boot route. Phase 2 replaces this with the boot router that decides
 * enrol | lock | newdevice from persisted auth state (PLAN §4).
 *
 * Colour is inline here on purpose: the token file is Phase 1's deliverable,
 * and a second source of truth for #010065 is exactly what it exists to prevent.
 */
export default function Index() {
  return <View style={styles.screen} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#010065',
  },
});
