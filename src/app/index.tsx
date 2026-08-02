import { StyleSheet, View } from 'react-native';

import { BOOT_BACKGROUND } from '@/theme';

/**
 * Boot route. Phase 2 replaces this with the boot router that decides
 * enrol | lock | newdevice from persisted auth state (PLAN §4).
 */
export default function Index() {
  return <View style={styles.screen} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BOOT_BACKGROUND,
  },
});
