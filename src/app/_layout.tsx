import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DemoOverlay } from '@/components/dev/demo-overlay';
import { AuthProvider } from '@/state/auth-context';
import { DemoProvider } from '@/state/demo-context';
import { LoanProvider } from '@/state/loan-context';
import { NavOriginProvider } from '@/state/nav-origin';
import { BOOT_BACKGROUND } from '@/theme';

/**
 * Root layout: providers, then the navigator.
 *
 * Order matters only in that Demo sits outermost — the overlay reads it and
 * renders above every screen. The app is light-only and each screen paints its
 * own surface, so headers are off globally and enabled per-route.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DemoProvider>
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
              <DemoOverlay />
            </NavOriginProvider>
          </LoanProvider>
        </AuthProvider>
      </DemoProvider>
    </SafeAreaProvider>
  );
}
