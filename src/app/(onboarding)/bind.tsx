import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import { BORROWER } from '@/api/mock/fixtures';
import { Button, HeaderRow, InlineError, Keypad, PinDots, Screen } from '@/components/ui';
import { BiometricCard } from '@/features/enrolment/biometric-card';
import { authenticate, capability } from '@/lib/biometrics';
import { error as errorHaptic, success, tick } from '@/lib/haptics';
import { PIN_LENGTH, setPin } from '@/lib/secure-pin';
import { useAuth } from '@/state/auth-context';
import { biometric, space, type } from '@/theme';

const UNAVAILABLE: Record<string, string> = {
  'no-hardware': 'This phone has no fingerprint or face sensor.',
  'not-enrolled': `You haven't set up ${biometric.noun} on this phone yet.`,
};

/**
 * Screen 4 — device binding. Step 2 of 2.
 *
 * Both halves are **real**: `authenticate` runs the platform prompt, and the
 * PIN is stored as a salted hash in SecureStore, never in React state and
 * never transmitted. Those are the parts of this proposal worth proving on
 * hardware — everything server-side is honestly mocked.
 */
export default function BindScreen() {
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const [bioEnrolled, setBioEnrolled] = useState(false);
  const [unavailable, setUnavailable] = useState<string | undefined>();
  const [pin, setPinDigits] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    let active = true;
    void capability().then((cap) => {
      if (!active || cap.available) return;
      setUnavailable(UNAVAILABLE[cap.reason]);
    });
    return () => {
      active = false;
    };
  }, []);

  const enrolBiometric = async () => {
    const ok = await authenticate(`Confirm your ${biometric.noun} to sign in to Migo`);
    if (ok) {
      success();
      setBioEnrolled(true);
      setError(null);
    } else {
      // Not an error state — the PIN is a complete alternative, not a fallback.
      setError(null);
    }
  };

  const append = (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    tick();
    setError(null);
    setPinDigits((current) => current + digit);
  };

  const finish = async () => {
    if (pin.length < PIN_LENGTH) {
      errorHaptic();
      setError(`Your PIN needs all ${PIN_LENGTH} digits.`);
      return;
    }

    setBusy(true);
    try {
      await setPin(pin);
      await api.bindDevice('device-public-key');

      auth.markEnrolled(phone ?? BORROWER.phone, BORROWER.name);
      auth.markDeviceBound();
      auth.markPinSet();
      if (bioEnrolled) auth.markBioEnrolled();
      auth.setAuthed(true);

      success();
      // The PIN buffer never outlives this screen.
      setPinDigits('');
      router.replace('/(session)/loading');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen surface="surface" scroll>
      <HeaderRow variant="step" step="Step 2 of 2" onHelp={() => router.push('/(support)/help')} />

      <View style={styles.body}>
        <Text style={type.h1Small}>Choose how you&apos;ll sign in</Text>

        <BiometricCard
          enrolled={bioEnrolled}
          unavailableReason={unavailable}
          onPress={() => void enrolBiometric()}
        />

        <View style={styles.pinBlock}>
          <Text style={type.bodyLarge}>Set a 6-digit backup PIN</Text>
          <Text style={styles.hint}>Kept on this phone only. Never sent to Migo.</Text>
          <PinDots filled={pin.length} />
        </View>

        <Keypad
          keyHeight={54}
          onDigit={append}
          onBackspace={() => {
            tick();
            setPinDigits((current) => current.slice(0, -1));
          }}
        />

        {error ? <InlineError message={error} /> : null}
        <Button
          label={busy ? 'Setting up…' : 'Finish setup'}
          onPress={() => void finish()}
          testID="finish"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg, paddingTop: space.lg, paddingBottom: space.xl },
  pinBlock: { gap: space.md, alignItems: 'center' },
  hint: { ...type.caption, textAlign: 'center' },
});
