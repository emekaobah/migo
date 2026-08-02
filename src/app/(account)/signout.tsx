import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, HeaderRow, InlineError, Screen } from '@/components/ui';
import { error as errorHaptic } from '@/lib/haptics';
import { clearPin } from '@/lib/secure-pin';
import { NEW_DEVICE_CODE } from '@/lib/ussd';
import { useAuth } from '@/state/auth-context';
import { useLoan } from '@/state/loan-context';
import { color, space, type } from '@/theme';

/**
 * Screen 17 — the destructive confirmation.
 *
 * Locking and signing out are deliberately separate: locking is routine,
 * signing out unbinds the device and costs a USSD round trip to undo. The card
 * states what does **not** change, because the fear this screen has to answer
 * is "will I lose my loan?" — and the answer is no.
 */
export default function SignoutScreen() {
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);
  const router = useRouter();
  const auth = useAuth();
  const loan = useLoan();

  const signOut = async () => {
    if (running.current) return;
    running.current = true;

    try {
      // Order matters. Clearing the PIN first and then failing to end the
      // session leaves the worst state available: still signed in, with no PIN
      // material — and "Stay signed in" is on this screen, so the borrower can
      // walk away from the error into a session whose PIN path is gone until
      // re-enrolment. Ending the session first fails safe: the session is over
      // and a retry clears the stale PIN material.
      await auth.signOut();
      await clearPin();
      loan.reset();
      router.replace('/(session)/newdevice');
    } catch {
      errorHaptic();
      setError('We could not sign you out. Try again.');
      running.current = false;
    }
  };

  return (
    <Screen surface="surface" scroll>
      <HeaderRow variant="back" onBack={() => router.back()} />

      <View style={styles.body}>
        <Text style={type.h1Small}>Sign out of this phone?</Text>
        <Text style={styles.blurb}>
          You&apos;ll be signed out on this phone. To use Migo here again, dial {NEW_DEVICE_CODE} to
          authorise it.
        </Text>

        <Card tone="tonal">
          <Text style={styles.cardTitle}>This does not change</Text>
          {['Your loan and what you owe', 'Your borrowing limit', 'Your repayment dates'].map(
            (line) => (
              <Text key={line} style={styles.cardLine}>
                • {line}
              </Text>
            ),
          )}
        </Card>

        {error ? <InlineError message={error} /> : null}

        <Button label="Sign out" variant="destructive" onPress={() => void signOut()} testID="sign-out" />
        <Button label="Stay signed in" variant="tertiary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg, paddingTop: space.lg, paddingBottom: space.xl },
  blurb: { ...type.body, color: color.textSecondary, lineHeight: 22 },
  cardTitle: { ...type.bodyLarge, fontWeight: '600', marginBottom: space.sm },
  cardLine: { ...type.body, color: color.textSecondary, lineHeight: 24 },
});
