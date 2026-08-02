import { Redirect, Stack } from 'expo-router';

/**
 * Dev-only routes.
 *
 * Guarded on `__DEV__`, so the kitchen sink and the scenario seeder are
 * unreachable in a production build even though the files ship (PLAN §2).
 */
export default function DevLayout() {
  if (!__DEV__) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
