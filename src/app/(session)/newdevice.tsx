import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import { Button, Card, HeaderRow, Screen } from '@/components/ui';
import { NEW_DEVICE_CODE, openDialer } from '@/lib/ussd';
import { useAuth } from '@/state/auth-context';
import { useNavOrigin } from '@/state/nav-origin';
import { color, space, type } from '@/theme';

/**
 * Screen 21 — authorising a handset Migo does not recognise.
 *
 * Reached after a sign-out, a PIN lockout, or enrolling on a new phone. USSD is
 * the only route back, which is the point: it proves possession of the SIM
 * rather than of a code someone could read out.
 */
export default function NewDeviceScreen() {
  const [code, setCode] = useState('— — — —');
  const [dialerUnavailable, setDialerUnavailable] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { openHelpFrom } = useNavOrigin();

  useEffect(() => {
    let active = true;
    api
      .ussdCode()
      .then((result) => {
        // Four digits here, not the six-digit enrolment code.
        if (active) setCode(result.code.replace(/\s/g, '').slice(0, 4).split('').join(' '));
      })
      // Leaving the placeholder up while step 2 says "confirm this code
      // appears" is worse than admitting it failed: the borrower cannot tell
      // whether the dashes are the code or a broken screen.
      .catch(() => {
        if (active) setCodeError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const dial = async () => {
    if (!(await openDialer(NEW_DEVICE_CODE))) setDialerUnavailable(true);
  };

  return (
    <Screen surface="surface" scroll>
      <HeaderRow
        variant="brand"
        onHelp={() => {
          openHelpFrom('/(session)/newdevice');
          router.push('/(support)/help');
        }}
      />

      <View style={styles.body}>
        <Text style={type.h1Small}>We don&apos;t recognise this phone</Text>

        <Card tone="navy">
          <Text style={styles.step}>1. Dial this from your Migo SIM</Text>
          <Text style={styles.dial}>{NEW_DEVICE_CODE}</Text>
          <View style={styles.divider} />
          <Text style={styles.step}>2. Confirm this code appears there</Text>
          <Text style={styles.code}>{code}</Text>
        </Card>

        <Card tone="white">
          <Text style={styles.warning}>
            Keep this to yourself — Migo staff will never ask you for this code, on a call or
            anywhere else.
          </Text>
        </Card>

        {codeError ? (
          <Text style={styles.note}>
            We could not fetch your code. Dial {NEW_DEVICE_CODE} — the code is shown there.
          </Text>
        ) : null}

        {dialerUnavailable ? (
          <Text style={styles.note}>This device can&apos;t dial. Enter {NEW_DEVICE_CODE} on your phone.</Text>
        ) : null}

        <Button label={`Open the dialler with ${NEW_DEVICE_CODE}`} variant="tonal" onPress={() => void dial()} />
        <Button
          label="I've authorised it"
          onPress={() => {
            auth.markDeviceBound();
            router.replace('/(session)/lock');
          }}
          testID="authorised"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg, paddingTop: space.lg, paddingBottom: space.xl },
  step: { ...type.caption, color: color.card, opacity: 0.66 },
  dial: { fontSize: 31, fontWeight: '700', color: color.card, marginTop: space.xs },
  divider: { height: 1, backgroundColor: color.card, opacity: 0.18, marginVertical: space.lg },
  code: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 34 * 0.16,
    color: color.amber,
    marginTop: space.xs,
    fontVariant: ['tabular-nums'],
  },
  warning: { ...type.body, color: color.textSecondary, lineHeight: 22 },
  note: { ...type.caption, color: color.danger },
});
