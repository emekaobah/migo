import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, HeaderRow, InlineError, Keypad, Screen } from '@/components/ui';
import { PhoneEntry } from '@/features/enrolment/phone-entry';
import { error as errorHaptic, tick } from '@/lib/haptics';
import { useNavOrigin } from '@/state/nav-origin';
import { color, onNavy, space, type } from '@/theme';

const REQUIRED_DIGITS = 10;

/**
 * Screen 1 — the only place a phone number is typed.
 *
 * **Continue is always enabled.** Pressing it with an incomplete number shows
 * an inline error saying what is wrong. A disabled button would leave the
 * borrower tapping a dead control with nothing to read — the handoff bans them
 * outright and `Button` has no `disabled` prop to reach for.
 */
export default function EnrolScreen() {
  const [digits, setDigits] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { openHelpFrom } = useNavOrigin();

  const append = (digit: string) => {
    if (digits.length >= REQUIRED_DIGITS) return;
    tick();
    setError(null);
    setDigits((current) => current + digit);
  };

  const backspace = () => {
    tick();
    setError(null);
    setDigits((current) => current.slice(0, -1));
  };

  const submit = () => {
    if (digits.length < REQUIRED_DIGITS) {
      errorHaptic();
      setError(`Your number needs all ${REQUIRED_DIGITS} digits after +234.`);
      return;
    }
    router.push({ pathname: '/(onboarding)/otp', params: { phone: digits } });
  };

  return (
    <Screen surface="navy">
      <HeaderRow
        variant="brand"
        onHelp={() => {
          openHelpFrom('/(onboarding)/enrol');
          router.push('/(support)/help');
        }}
      />

      <View style={styles.body}>
        <Text style={styles.heading}>Sign in or create your Migo account</Text>
        <PhoneEntry value={digits} />
      </View>

      <View style={styles.pad}>
        <Keypad keyHeight={56} onDark onDigit={append} onBackspace={backspace} />
      </View>

      <View>
        {error ? <InlineError message={error} onDark /> : null}
        <Button label="Continue" onPress={submit} testID="continue" />
        <Text style={styles.caption}>We&apos;ll text one code to confirm it&apos;s you.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg, paddingTop: space.xl },
  heading: { ...type.h1, color: color.card },
  pad: { flex: 1, justifyContent: 'flex-end', paddingBottom: space.xl },
  caption: {
    ...type.caption,
    color: onNavy.caption,
    textAlign: 'center',
    marginTop: space.md,
  },
});
