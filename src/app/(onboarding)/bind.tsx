import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import { Button, HeaderRow, InlineError, Keypad, PinDots, Screen } from '@/components/ui';
import { BiometricCard } from '@/features/enrolment/biometric-card';
import { authenticate, capability } from '@/lib/biometrics';
import { error as errorHaptic, success, tick } from '@/lib/haptics';
import { PIN_LENGTH, setPin } from '@/lib/secure-pin';
import { useAuth } from '@/state/auth-context';
import { usePlatform } from '@/state/use-platform';
import { space, type } from '@/theme';

/**
 * Takes the noun rather than reading it at module scope: the wording is
 * platform-dependent and the demo overlay can switch platform at runtime.
 */
const unavailableCopy = (reason: 'no-hardware' | 'not-enrolled', noun: string) =>
  reason === 'no-hardware'
    ? 'This phone has no fingerprint or face sensor.'
    : `You haven't set up ${noun} on this phone yet.`;

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
  // Named to match its setter: `setPin` is the imported secure-pin function.
  const [pinDigits, setPinDigits] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Synchronous guard. `busy` state cannot protect the first double-tap,
  // because the second press lands before React has re-rendered — and Button
  // has no `disabled` prop by design, so nothing else stops it.
  const running = useRef(false);
  const router = useRouter();
  const auth = useAuth();
  const { biometric } = usePlatform();

  useEffect(() => {
    let active = true;
    capability()
      .then((cap) => {
        if (!active || cap.available) return;
        setUnavailable(unavailableCopy(cap.reason, biometric.noun));
      })
      // A failed capability probe must not take the screen down. Treat it the
      // same as no sensor: the PIN path is complete on its own.
      .catch(() => {
        if (active) setUnavailable('Biometric check failed on this phone.');
      });
    return () => {
      active = false;
    };
  }, [biometric.noun]);

  const enrolBiometric = async () => {
    // `authenticate` never throws — it resolves false on any failure, because
    // every caller has the PIN path to fall back to.
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
    if (pinDigits.length >= PIN_LENGTH) return;
    tick();
    setError(null);
    setPinDigits((current) => current + digit);
  };

  const finish = async () => {
    // Both writes below are non-idempotent, so a double-tap must not start a
    // second run.
    if (running.current) return;

    if (pinDigits.length < PIN_LENGTH) {
      errorHaptic();
      setError(`Your PIN needs all ${PIN_LENGTH} digits.`);
      return;
    }

    running.current = true;
    setBusy(true);
    try {
      await setPin(pinDigits);
      const { name } = await api.bindDevice('device-public-key');

      auth.markEnrolled(phone ?? '', name);
      auth.markDeviceBound();
      auth.markPinSet();
      if (bioEnrolled) auth.markBioEnrolled();
      auth.setAuthed(true);

      success();
      // The PIN buffer never outlives this screen.
      setPinDigits('');
      router.replace('/(session)/loading');
    } catch {
      // Say so. Silently returning the button to its resting state would leave
      // the borrower believing they had finished setting up when they had not.
      errorHaptic();
      setError('We could not finish setting up. Check your connection and try again.');
      running.current = false;
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
          <PinDots filled={pinDigits.length} />
        </View>

        <Keypad
          keyHeight={54}
          onDigit={append}
          onBackspace={() => {
            tick();
            // Clear the error too, matching `append` and `enrol` — otherwise a
            // stale "needs all 6 digits" sits under a PIN being corrected.
            setError(null);
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
