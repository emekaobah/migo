import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import { createMockSmsRetriever } from '@/api/mock/sms-retriever';
import { CodeBoxes, HeaderRow, InlineError, Keypad, Screen } from '@/components/ui';
import { OtpStatusStrip } from '@/features/enrolment/otp-status-strip';
import { UssdHintCard } from '@/features/enrolment/ussd-hint-card';
import { error as errorHaptic, success, tick } from '@/lib/haptics';
import { useNavOrigin } from '@/state/nav-origin';
import { duration, space, type } from '@/theme';

const CODE_LENGTH = 6;

/**
 * Screen 2 — the one and only OTP in the product.
 *
 * The code arrives on its own (SMS Retriever on Android; simulated here) and
 * auto-advances, so the common path needs no typing at all. Manual entry of
 * six digits advances identically, because the retriever is best-effort and
 * this screen must never strand someone whose code arrived by eye.
 */
export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const [code, setCode] = useState('');
  const [received, setReceived] = useState(false);
  const [resendIn, setResendIn] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { openHelpFrom } = useNavOrigin();
  const advanced = useRef(false);
  // Latest `advance` without making it an effect dependency.
  const advanceRef = useRef<() => void>(() => {});

  const advance = useCallback(() => {
    if (advanced.current) return;
    advanced.current = true;
    success();
    router.push('/(onboarding)/bind');
  }, [router]);

  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  // Listen for the code. Cancelled on unmount so leaving for the USSD path
  // does not leave a timer running behind a dead screen.
  useEffect(() => {
    const retriever = createMockSmsRetriever();
    const unsubscribe = retriever.onCode((incoming) => {
      setCode(incoming);
      setReceived(true);
    });
    void retriever.start();
    void api.requestCode(phone ?? '');

    return () => {
      unsubscribe();
      retriever.stop();
    };
  }, [phone]);

  // Auto-advance once the code has landed, after a beat so the borrower sees
  // that it filled itself in rather than being thrown to the next screen.
  //
  // Depends on `received` alone. Keying it on `advance` as well meant any
  // unrelated re-render — the countdown ticks every second — cleared and
  // rescheduled the 1.4s timer, so it could never reach the end and the screen
  // would sit on a filled-in code forever.
  useEffect(() => {
    if (!received) return;
    const timer = setTimeout(() => advanceRef.current(), duration.otpAdvance);
    return () => clearTimeout(timer);
  }, [received]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const append = (digit: string) => {
    if (code.length >= CODE_LENGTH) return;
    tick();
    setError(null);

    const next = code + digit;
    setCode(next);
    if (next.length === CODE_LENGTH) void verify(next);
  };

  const verify = async (candidate: string) => {
    const { ok } = await api.verifyCode(candidate);
    if (ok) {
      advance();
      return;
    }
    errorHaptic();
    setError('That code is not right. Check it and try again.');
    setCode('');
  };

  return (
    <Screen surface="surface" scroll>
      <HeaderRow
        variant="step"
        step="Step 1 of 2"
        onHelp={() => {
          openHelpFrom('/(onboarding)/otp');
          router.push('/(support)/help');
        }}
      />

      <View style={styles.body}>
        <Text style={type.h1Small}>Enter the code we sent you</Text>

        <CodeBoxes value={code} />
        <OtpStatusStrip resendIn={resendIn} received={received} />
        {error ? <InlineError message={error} /> : null}

        <Keypad keyHeight={50} onDigit={append} onBackspace={() => { tick(); setCode((c) => c.slice(0, -1)); }} />

        <UssdHintCard onUseUssd={() => router.push('/(onboarding)/ussd')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg, paddingTop: space.lg, paddingBottom: space.xl },
});
