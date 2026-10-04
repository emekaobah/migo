import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import { Button, CodeBoxes, HeaderRow, InlineError, Keypad, Screen } from '@/components/ui';
import { countdown } from '@/lib/format';
import { error as errorHaptic, success, tick } from '@/lib/haptics';
import { color, radius, space, type } from '@/theme';

const CODE_LENGTH = 6;

type Params = {
  bankId: string;
  number: string;
  maskedPhone: string;
  resendIn: string;
};

/**
 * Screen 9b — the code that proves a payout account belongs to the borrower.
 *
 * It goes to the phone registered to the account's BVN, which need not be the
 * phone in hand — a borrower who changed SIM still receives it on the old
 * number — so the screen names where it went, and nothing listens for it. The
 * sign-in OTP auto-fills from SMS; this one cannot assume the SMS lands here.
 *
 * On success the borrower goes back to `banks` with the new account selected,
 * whichever way they reached it (from `offers` or from `account`).
 */
export default function AccountCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState(params.maskedPhone);
  const [resendIn, setResendIn] = useState(Number(params.resendIn) || 60);
  const checking = useRef(false);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function confirm(candidate: string) {
    if (checking.current) return;
    checking.current = true;
    try {
      const result = await api.confirmAccount(params.bankId, params.number, candidate);
      if (result.ok) {
        success();
        router.dismissTo({ pathname: '/(loan)/banks', params: { added: result.account.id } });
        return;
      }
      errorHaptic();
      setError('That code is not right. Check it and try again.');
    } catch {
      // A rejected request is not a wrong code; saying it is sends the borrower
      // looking for a mistake they did not make.
      errorHaptic();
      setError('We could not check that code. Try again.');
    } finally {
      checking.current = false;
    }
    setCode('');
  }

  async function resend() {
    setError(null);
    try {
      const sent = await api.requestAccountCode(params.bankId, params.number);
      if (sent.ok) {
        setMaskedPhone(sent.maskedPhone);
        setResendIn(sent.resendIn);
      }
    } catch {
      setError('We could not send a new code. Check your connection and try again.');
    }
  }

  const append = (digit: string) => {
    if (code.length >= CODE_LENGTH) return;
    tick();
    setError(null);
    const next = code + digit;
    setCode(next);
    if (next.length === CODE_LENGTH) void confirm(next);
  };

  const backspace = () => {
    tick();
    setError(null);
    setCode((current) => current.slice(0, -1));
  };

  return (
    <Screen surface="surface" scroll>
      <HeaderRow variant="back" onBack={() => router.back()} />

      <View style={styles.body}>
        <Text style={type.h1Small}>Enter the code</Text>
        <Text style={styles.lead}>
          We sent a code to {maskedPhone}, the number registered to this account&apos;s BVN.
        </Text>

        <CodeBoxes value={code} />

        {resendIn > 0 ? (
          <View style={styles.strip}>
            <Text style={styles.stripText}>Resend in {countdown(resendIn)}</Text>
          </View>
        ) : (
          <Button label="Send a new code" onPress={resend} variant="tonal" />
        )}

        {error ? <InlineError message={error} /> : null}

        <Keypad keyHeight={50} onDigit={append} onBackspace={backspace} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg, paddingTop: space.lg, paddingBottom: space.xl },
  lead: { ...type.body, color: color.textMuted },
  strip: {
    borderRadius: radius.panel,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    backgroundColor: color.surfaceAlt,
    flexShrink: 0,
  },
  stripText: { ...type.caption, color: color.textMuted },
});
