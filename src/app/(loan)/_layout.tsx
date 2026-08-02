import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/state/auth-context';

/**
 * The loan flow, auth-guarded.
 *
 * Redirects to the lock screen when not signed in. The guard lives on the
 * layout rather than on each screen so a new route added to this group is
 * protected by default rather than by remembering.
 */
export default function LoanLayout() {
  const { authed, hydrated } = useAuth();

  // Nothing renders until the durable slice has been read — routing on the
  // pre-hydration default would bounce a signed-in borrower to the lock screen.
  if (!hydrated) return null;
  if (!authed) return <Redirect href="/(session)/lock" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
