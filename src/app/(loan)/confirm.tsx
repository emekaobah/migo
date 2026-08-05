import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import type { PayoutAccount } from '@/api/types';
import { Amount, HeaderRow, HoldButton, InlineError, Row, Screen, Spinner } from '@/components/ui';
import { RepaymentPanel } from '@/features/loans/repayment-panel';
import { authenticate, capability } from '@/lib/biometrics';
import { naira } from '@/lib/format';
import { openLink } from '@/lib/links';
import { buildSchedule, totalRepayable } from '@/lib/loan-math';
import { useLoan } from '@/state/loan-context';
import { biometric, color, space, type } from '@/theme';

/**
 * Screen 10 — the last screen before the money moves (HANDOFF §10).
 *
 * The hold is not decoration. It re-asserts biometric presence before the loan
 * is accepted, which is what makes the caption underneath it true rather than
 * reassuring copy (PLAN §7). Everything a borrower is agreeing to — the total,
 * every instalment date, the destination account, the terms — is on this one
 * screen, because the hold is meant to confirm a decision, not to be the first
 * time some of it is read.
 */
export default function ConfirmScreen() {
  const router = useRouter();
  const { tenor, principal, accountId, loanAccepted } = useLoan();

  const [account, setAccount] = useState<PayoutAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Bumping this remounts the hold button. It latches internally once a hold
  // completes — deliberately, so a single gesture cannot accept twice — which
  // means a failed biometric would otherwise leave a dead control on screen
  // with no way to try again.
  const [attempt, setAttempt] = useState(0);
  /**
   * Whether this handset can re-assert at all.
   *
   * `authenticate` returns false when there is no sensor, so gating acceptance
   * on it unconditionally would make the loan **impossible to take** on a
   * handset without biometrics — which is a large share of the actual market
   * this product serves, and the reason `lib/biometrics.ts` detects capability
   * rather than assuming it. PIN is a complete alternative in this design, not
   * a fallback stub (PLAN §7), and the caption below changes to match so it
   * stays true either way.
   */
  const [bioAvailable, setBioAvailable] = useState<boolean | null>(null);
  /** Whether the account lookup has finished — `account` alone cannot say. */
  const [accountSettled, setAccountSettled] = useState(false);

  useEffect(() => {
    let active = true;

    capability()
      .then((cap) => {
        if (active) setBioAvailable(cap.available);
      })
      .catch(() => {
        if (active) setBioAvailable(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    api
      .listAccounts()
      .then((list) => {
        if (!active) return;
        setAccount(list.find((a) => a.id === accountId) ?? list[0] ?? null);
        setAccountSettled(true);
      })
      .catch(() => {
        if (!active) return;
        setAccount(null);
        setAccountSettled(true);
      });

    return () => {
      active = false;
    };
  }, [accountId]);

  // Arriving without a selection means a deep link or a reset mid-flow. Send
  // the borrower back to choose rather than rendering a confirmation of
  // nothing.
  if (!tenor || !principal) return <Redirect href="/(loan)/offers" />;

  const total = totalRepayable(principal, tenor.multiplier);
  const schedule = buildSchedule(principal, tenor, new Date());
  const interest = total - principal;
  /** Both async probes have reported, so the hold can mean what it says. */
  const ready = bioAvailable !== null && accountSettled;

  async function onAccept() {
    if (!tenor || !principal) return;

    // A loan must not be accepted without a destination. `accountId: ''` would
    // submit a disbursement with nowhere to send it, and the "Paid into" row
    // reads "—" at that moment, so the borrower would also be confirming a
    // destination they were never shown.
    if (!account) {
      setError('We could not confirm your payout account. Choose one and hold again.');
      setAttempt((n) => n + 1);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (bioAvailable) {
        const confirmed = await authenticate(`Confirm your ${naira(principal)} loan`);
        if (!confirmed) {
          setError('We could not confirm it was you. Hold again to accept.');
          setAttempt((n) => n + 1);
          setBusy(false);
          return;
        }
      }

      const loan = await api.acceptLoan(
        { tenor, principal, accountId: account.id },
        // A placeholder, exactly as `bind` passes one. Without a backend there
        // is nothing to verify a signature against, and PLAN §7 is explicit
        // that unverifiable attestation is theatre better named than implied.
        'device-signature',
      );

      loanAccepted(loan);
      router.replace('/(loan)/success');
    } catch {
      setError('We could not complete this just now. Hold again to try.');
      setAttempt((n) => n + 1);
      setBusy(false);
    }
  }

  return (
    <Screen surface="surface" scroll>
      <HeaderRow variant="back" onBack={() => router.back()} />

      <Text style={styles.label}>You receive</Text>
      <Amount value={naira(principal)} size="display" />

      <View style={styles.rows}>
        <Row label="Interest & fees" value={naira(interest)} divider />
        <Row label="Term" value={`${tenor.days} days`} />
      </View>

      <RepaymentPanel total={total} schedule={schedule} />

      <View style={styles.rows}>
        <Row
          label="Paid into"
          value={account ? `${account.bank} ${account.maskedNumber}` : '—'}
          onPress={() => router.push('/(loan)/banks')}
          chevron
        />
      </View>

      {/*
        Inline links are nested `Text` with `onPress`, not `Pressable`. A
        pressable inside a text run is laid out as an inline view and drops off
        the baseline, which is visible on exactly the sentence a borrower is
        meant to read carefully.
      */}
      <Text style={styles.fees}>
        Interest and fees are included in the total above. By accepting you agree to the{' '}
        <Text
          style={styles.link}
          onPress={() => openLink('terms')}
          accessibilityRole="link"
          accessibilityLabel="Terms and conditions"
        >
          terms
        </Text>{' '}
        and the{' '}
        <Text
          style={styles.link}
          onPress={() => openLink('privacy')}
          accessibilityRole="link"
          accessibilityLabel="Privacy policy"
        >
          privacy policy
        </Text>
        .
      </Text>

      <View style={styles.footer}>
        {error ? <InlineError message={error} /> : null}

        {/*
          The hold does not exist until both probes have settled.

          Rendering it while `bioAvailable` is still null let a fast hold slip
          through the window where null reads as false — skipping `authenticate`
          entirely while the caption below still claimed the loan was signed
          with a fingerprint. Withholding the control is better than gating
          inside the handler: there is then no window at all, and the caption
          can only ever describe a state that has actually been determined.
        */}
        {busy || !ready ? (
          <View style={styles.busy}>
            <Spinner size={32} />
            {busy ? <Text style={styles.busyLabel}>Sending your money…</Text> : null}
          </View>
        ) : (
          <>
            <HoldButton key={attempt} onComplete={onAccept} testID="hold-to-accept" />
            <Text style={styles.signed}>
              {bioAvailable === false ? 'Signed on this device' : biometric.signedWith}
            </Text>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...type.caption, marginTop: space.sm },
  rows: { marginVertical: space.lg },
  fees: { ...type.caption, marginTop: space.lg },
  link: { ...type.caption, color: color.navy, fontWeight: '700', textDecorationLine: 'underline' },
  footer: { marginTop: 'auto', paddingTop: space.xl, gap: space.md },
  busy: { alignItems: 'center', gap: space.md, paddingVertical: space.lg },
  busyLabel: { ...type.body, color: color.textSecondary },
  signed: { ...type.caption, textAlign: 'center' },
});
