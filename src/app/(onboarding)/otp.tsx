import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import { smsRetriever } from '@/api/sms';
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
  /** The auto-filled code, so the beat below can verify it without re-running. */
  const autoFilled = useRef('');

  const advance = useCallback(() => {
    if (advanced.current) return;
    advanced.current = true;
    success();
    router.push('/(onboarding)/bind');
  }, [router]);

  const verify = useCallback(
    async (candidate: string) => {
      try {
        const { ok } = await api.verifyCode(candidate);
        if (ok) {
          advance();
          return;
        }
        errorHaptic();
        setError('That code is not right. Check it and try again.');
      } catch {
        // A rejected request is not a wrong code, and telling the borrower it is
        // would send them hunting for a mistake they did not make.
        errorHaptic();
        setError('We could not check that code. Try again, or use *561#.');
      }
      setCode('');
    },
    [advance],
  );

  /**
   * Verifies the auto-filled code without becoming an effect dependency.
   *
   * `useRouter()` returns a fresh object on every render, so `advance` — and
   * `verify` with it — changes identity constantly. Keying the 1.4s timer on
   * that meant every countdown tick cleared and rescheduled it, and it never
   * reached the end: the screen sat on a filled-in code forever.
   */
  const verifyAutoFilled = useEffectEvent((candidate: string) => {
    void verify(candidate);
  });

  // Listen for the code. Cancelled on unmount so leaving for the USSD path
  // does not leave a timer running behind a dead screen.
  useEffect(() => {
    const unsubscribe = smsRetriever.onCode((incoming) => {
      autoFilled.current = incoming;
      setCode(incoming);
      setReceived(true);
    });
    void smsRetriever.start();
    // Best-effort: the code may still arrive, and the USSD route below works
    // regardless, so a failure here must not block the screen.
    api.requestCode(phone ?? '').catch(() => undefined);

    return () => {
      unsubscribe();
      smsRetriever.stop();
    };
  }, [phone]);

  // Verify and advance once the code has landed, after a beat so the borrower
  // sees that it filled itself in rather than being thrown to the next screen.
  //
  // An auto-filled code goes through `verify` exactly like a typed one. Letting
  // it skip straight to `advance` meant the two paths disagreed about what a
  // valid code is, which stays invisible only for as long as the mock accepts
  // everything six digits long.
  useEffect(() => {
    if (!received) return;
    const timer = setTimeout(() => verifyAutoFilled(autoFilled.current), duration.otpAdvance);
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

  const backspace = () => {
    tick();
    // Clear the error too, matching `append` and `bind` — otherwise a stale
    // "that code is not right" sits under a code being corrected.
    setError(null);
    setCode((current) => current.slice(0, -1));
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

        <Keypad keyHeight={50} onDigit={append} onBackspace={backspace} />

        <UssdHintCard onUseUssd={() => router.push('/(onboarding)/ussd')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg, paddingTop: space.lg, paddingBottom: space.xl },
});
