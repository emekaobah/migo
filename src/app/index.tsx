import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { bootRedirect } from '@/features/session/boot-redirect';
import { useAuth } from '@/state/auth-context';
import { BOOT_BACKGROUND } from '@/theme';

/**
 * Boot router.
 *
 * Holds the navy surface until the durable slice has been read, then routes
 * with the pure function in `features/session/boot-redirect.ts`. Deciding
 * before hydration would send a returning borrower back to enrolment — and
 * being asked for an SMS code is the exact failure this product removes.
 */
export default function Index() {
  const { hydrated, enrolled, deviceBound } = useAuth();

  if (!hydrated) return <View style={styles.screen} />;

  return <Redirect href={bootRedirect({ enrolled, deviceBound })} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BOOT_BACKGROUND,
  },
});
