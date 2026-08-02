import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import { Button, Screen } from '@/components/ui';
import { ENROL_CODE, openDialer } from '@/lib/ussd';
import { color, onNavy, radius, space, type } from '@/theme';

/**
 * Screen 3 — the escape hatch when SMS never lands.
 *
 * The dialler is **pre-filled, never dialled**. Placing a call on a prepaid
 * line without a press is not something a lender should do, so the button
 * opens the dialler and the borrower presses call.
 */
export default function UssdScreen() {
  const [code, setCode] = useState('— — — — — —');
  const [validMinutes, setValidMinutes] = useState(10);
  const [dialerUnavailable, setDialerUnavailable] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    api
      .ussdCode()
      .then((result) => {
        if (!active) return;
        setCode(result.code);
        setValidMinutes(result.validMinutes);
      })
      // The dialler instructions are still useful without a code, so keep the
      // screen up and say the code could not be fetched.
      .catch(() => {
        if (active) setCodeError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const dial = async () => {
    const opened = await openDialer(ENROL_CODE);
    // A tablet or simulator cannot dial. Say so rather than appearing to do
    // nothing — the code is on screen and can be dialled by hand.
    if (!opened) setDialerUnavailable(true);
  };

  return (
    <Screen surface="ink" scroll>
      <View style={styles.body}>
        <Text style={styles.heading}>Verify with {ENROL_CODE}</Text>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Migo — Set up app</Text>
          <Text style={styles.panelBody}>
            Dial {ENROL_CODE} from this SIM and choose Set up app. You&apos;ll see this code:
          </Text>
          <Text style={styles.code} accessibilityLabel={`Your code is ${code.split('').join(' ')}`}>
            {code}
          </Text>
          <Text style={styles.panelBody}>
            Valid for {validMinutes} minutes. Migo will never ask you to read this to an agent.
          </Text>
        </View>

        {codeError ? (
          <Text style={styles.note}>
            We could not fetch your code. Dial {ENROL_CODE} and it will be shown there.
          </Text>
        ) : null}

        {dialerUnavailable ? (
          <Text style={styles.note}>This device can&apos;t dial. Enter {ENROL_CODE} on your phone.</Text>
        ) : null}

        <Button label={`Open the dialler with ${ENROL_CODE}`} onPress={() => void dial()} />
        <Button
          label="Back to the app with this code"
          variant="outlined"
          onDark
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg, paddingTop: space.xxl },
  heading: { ...type.h1Small, color: color.card },
  panel: {
    backgroundColor: onNavy.keypad,
    borderRadius: radius.card,
    padding: space.xl,
    gap: space.md,
  },
  panelTitle: { ...type.bodyLarge, color: color.card, fontWeight: '700' },
  panelBody: { ...type.body, color: onNavy.caption, lineHeight: 22 },
  code: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: 40 * 0.18,
    color: color.amber,
    fontVariant: ['tabular-nums'],
  },
  note: { ...type.caption, color: color.errorOnNavy },
});
