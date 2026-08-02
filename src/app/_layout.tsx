import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Root layout. Providers (Auth, Loan, NavOrigin, Demo) land in Phase 2 —
 * Phase 0 only needs the app to boot on a navy surface.
 *
 * The app is light-only and every screen paints its own surface, so headers are
 * off globally and enabled per-route where the design calls for one.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#010065' },
        }}
      />
    </SafeAreaProvider>
  );
}
