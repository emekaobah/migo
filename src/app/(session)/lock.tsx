import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, HeaderRow, Screen } from '@/components/ui';
import { BiometricTarget } from '@/features/session/biometric-target';
import { authenticate, capability } from '@/lib/biometrics';
import { phone as formatPhone } from '@/lib/format';
import { success } from '@/lib/haptics';
import { useAuth } from '@/state/auth-context';
import { useNavOrigin } from '@/state/nav-origin';
import { biometric, color, duration, onNavy, space, type } from '@/theme';

/**
 * Screen 5 — the returning path, and the thesis of the whole product.
 *
 * No SMS anywhere on this screen. A borrower who enrolled once signs in with a
 * touch, which is the failure this app exists to remove: codes that never
 * arrive, and agents reading them aloud down the phone.
 */
export default function LockScreen() {
  const [recognised, setRecognised] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  // The target stays pressable while `authenticate` awaits, so without this a
  // second press starts a second prompt and a second timer.
  const signingIn = useRef(false);
  const beat = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const auth = useAuth();
  const { openHelpFrom } = useNavOrigin();

  useEffect(() => {
    let active = true;
    capability()
      .then((cap) => {
        if (active && !cap.available) setUnavailable(true);
      })
      .catch(() => {
        // Probe failed: fall back to the PIN path rather than offering a
        // target that cannot work.
        if (active) setUnavailable(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Leaving during the 700ms beat — "Use PIN instead" is one tap away — must
  // not fire a replace that lands on top of wherever the borrower went.
  useEffect(() => () => {
    if (beat.current) clearTimeout(beat.current);
  }, []);

  const signIn = async () => {
    if (signingIn.current) return;
    signingIn.current = true;

    const ok = await authenticate(`Sign in to Migo with your ${biometric.noun}`);
    if (!ok) {
      signingIn.current = false;
      return;
    }

    // The beat before moving. Without it the screen changes under the finger
    // and the borrower cannot tell whether it worked.
    success();
    setRecognised(true);
    auth.setAuthed(true);
    beat.current = setTimeout(() => router.replace('/(session)/loading'), duration.biometric);
  };

  return (
    <Screen surface="navy">
      <HeaderRow
        variant="brand"
        onHelp={() => {
          openHelpFrom('/(session)/lock');
          router.push('/(support)/help');
        }}
      />

      <View style={styles.body}>
        <Text style={styles.greeting}>Welcome back</Text>
        <Text style={styles.name}>{auth.name ?? 'there'}</Text>

        <BiometricTarget onPress={() => void signIn()} recognised={recognised} unavailable={unavailable} />

        {auth.phone ? <Text style={styles.account}>{formatPhone(auth.phone)}</Text> : null}
      </View>

      <Button
        label="Use PIN instead"
        variant="outlined"
        onDark
        onPress={() => router.push('/(session)/pinlock')}
        testID="use-pin"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  greeting: { ...type.body, color: onNavy.label },
  name: { fontSize: 36, fontWeight: '700', color: color.card, letterSpacing: -0.9 },
  account: { ...type.caption, color: onNavy.caption, fontVariant: ['tabular-nums'] },
});
