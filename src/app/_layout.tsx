import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/state/auth-context';
import { LoanProvider } from '@/state/loan-context';
import { NavOriginProvider } from '@/state/nav-origin';
import { BOOT_BACKGROUND } from '@/theme';

/**
 * Root layout: providers, then the navigator.
 *
 * The app is light-only and each screen paints its own surface, so headers are
 * off globally and enabled per-route.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LoanProvider>
          <NavOriginProvider>
            {/* Boot default only — each Screen sets its own from its surface. */}
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: BOOT_BACKGROUND },
              }}
            />
          </NavOriginProvider>
        </LoanProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
