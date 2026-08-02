import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, HeaderRow, InlineError, Keypad, PinDots, Screen } from '@/components/ui';
import { error as errorHaptic, success, tick } from '@/lib/haptics';
import { PIN_LENGTH, verifyPin } from '@/lib/secure-pin';
import { useAuth } from '@/state/auth-context';
import { color, onNavy, space, type } from '@/theme';

/**
 * Screen 6 — PIN sign-in.
 *
 * Not a lesser path. Many handsets in this market have no usable sensor, and
 * on iOS the design gives the PIN equal prominence because Face ID failures are
 * routine. Verification runs the moment the sixth digit lands, so there is no
 * separate submit to hunt for.
 *
 * Five failures routes to `newdevice` — re-authorising over USSD is the only
 * way back, which is what makes the lockout mean anything.
 */
export default function PinlockScreen() {
  const [pinDigits, setPinDigits] = useState('');
  const [error, setError] = useState<string | null>(null);
  const checking = useRef(false);
  const router = useRouter();
  const auth = useAuth();

  const append = (digit: string) => {
    if (pinDigits.length >= PIN_LENGTH || checking.current) return;
    tick();
    setError(null);

    const next = pinDigits + digit;
    setPinDigits(next);
    if (next.length === PIN_LENGTH) void check(next);
  };

  const check = async (candidate: string) => {
    // The sixth digit can land twice before state settles; verifying twice
    // would burn two attempts against the lockout for one entry.
    checking.current = true;
    try {
      const result = await verifyPin(candidate);

      if (result.ok) {
        success();
        auth.setAuthed(true);
        router.replace('/(session)/loading');
        return;
      }

      errorHaptic();
      setPinDigits('');

      switch (result.reason) {
        case 'wrong':
          setError(
            result.attemptsLeft === 1
              ? 'Wrong PIN. One more try before you have to re-authorise this phone.'
              : `Wrong PIN. ${result.attemptsLeft} tries left.`,
          );
          break;
        case 'locked':
          router.replace('/(session)/newdevice');
          break;
        case 'not-set':
          setError('No PIN is set on this phone. Use your fingerprint or re-authorise.');
          break;
      }
    } catch {
      errorHaptic();
      setPinDigits('');
      setError('We could not check that PIN. Try again.');
    } finally {
      checking.current = false;
    }
  };

  return (
    <Screen surface="navy">
      <HeaderRow variant="back" onBack={() => router.back()} />

      <View style={styles.body}>
        <Text style={styles.heading}>Welcome back, {auth.name ?? 'there'}</Text>
        <Text style={styles.sub}>Enter your {PIN_LENGTH}-digit PIN</Text>
        <PinDots filled={pinDigits.length} onDark />
      </View>

      <View style={styles.pad}>
        <Keypad
          keyHeight={56}
          onDark
          onDigit={append}
          onBackspace={() => {
            tick();
            setError(null);
            setPinDigits((current) => current.slice(0, -1));
          }}
        />
      </View>

      <View>
        {error ? <InlineError message={error} onDark /> : null}
        <Button
          label="Use fingerprint instead"
          variant="tertiary"
          onDark
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', gap: space.md, paddingTop: space.xxl },
  heading: { ...type.h2, color: color.card, textAlign: 'center' },
  sub: { ...type.body, color: onNavy.label },
  pad: { flex: 1, justifyContent: 'flex-end', paddingBottom: space.lg },
});
