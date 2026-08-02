import { Stack } from 'expo-router';

/** Sign-in and device authorisation. Reachable while signed out. */
export default function SessionLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
