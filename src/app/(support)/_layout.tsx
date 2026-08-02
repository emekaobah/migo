import { Stack } from 'expo-router';

/**
 * Support is deliberately **not** auth-guarded. A borrower stuck at the code
 * step must be able to reach help and chat without signing in — that is the
 * whole point of the signed-out chat script.
 */
export default function SupportLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
