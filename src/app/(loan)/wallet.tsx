import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import type { Wallet } from '@/api/types';
import { Button, HeaderRow, InlineError, Screen, Spinner } from '@/components/ui';
import { DetectionState } from '@/features/repayment/detection-state';
import { WalletCard } from '@/features/repayment/wallet-card';
import { useLoan } from '@/state/loan-context';
import { duration, space, type } from '@/theme';

/**
 * Screen 14 — the account to transfer into, and the wait (HANDOFF §14).
 *
 * Three async things happen here and every one of them must survive the
 * borrower leaving: the wallet fetch, the payment watch, and the settle beat
 * before returning to `active`. Leaving mid-wait is not an edge case on this
 * screen — it is what a borrower does, because the transfer itself happens in
 * another app.
 */
export default function WalletScreen() {
  const router = useRouter();
  const { payBank, loanLoaded, markWalletSeen } = useLoan();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [received, setReceived] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!payBank || failed) return;
    let active = true;

    api
      .getWallet(payBank)
      .then((w) => {
        if (!active) return;
        setWallet(w);
        markWalletSeen();
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payBank, failed]);

  useEffect(() => {
    if (!wallet) return;
    let active = true;

    // `watchPayment` returns a cancellable, not a bare promise, precisely so
    // this cleanup can exist. Without the cancel, walking away from the screen
    // leaves a timer that fires into an unmounted tree — the "state update on
    // an unmounted component" bug that reads as flakiness (PLAN §6a).
    const watcher = api.watchPayment(wallet);

    watcher.promise
      .then(() => {
        if (active) setReceived(true);
      })
      .catch(() => {
        // A watch that fails is not a payment that failed. The borrower's
        // money is not lost, so say nothing here and let them leave.
      });

    return () => {
      active = false;
      watcher.cancel();
    };
  }, [wallet]);

  useEffect(() => {
    if (!received) return;
    let active = true;

    // The beat before leaving: the borrower should see "Payment received"
    // land, not have the screen replaced out from under the words.
    const timer = setTimeout(() => {
      api
        .getLoan()
        .then((fresh) => {
          if (!active) return;
          // Re-read rather than incrementing a local counter. The server owns
          // how much is now outstanding, and a second copy of that arithmetic
          // is a second thing to get wrong (PLAN §4).
          loanLoaded(fresh);
          router.replace('/(loan)/active');
        })
        .catch(() => {
          if (active) router.replace('/(loan)/active');
        });
    }, duration.walletSettle);

    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [received]);

  // No bank chosen means this screen was reached directly; there is no wallet
  // to show and nothing to wait for.
  if (!payBank) return <Redirect href="/(loan)/repay" />;

  return (
    <Screen surface="surface" scroll>
      <HeaderRow variant="back" onBack={() => router.back()} />
      <Text style={styles.h1}>Transfer to this account</Text>

      {failed ? (
        <View style={styles.pending}>
          <InlineError message="We could not open your wallet. Check your connection." />
          <Button label="Try again" onPress={() => setFailed(false)} variant="tonal" />
        </View>
      ) : null}

      {!failed && !wallet ? (
        <View style={styles.pending}>
          <Spinner />
        </View>
      ) : null}

      {wallet ? (
        <>
          <WalletCard wallet={wallet} />
          <View style={styles.detection}>
            <DetectionState received={received} amount={wallet.amountDue} />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...type.h1, marginTop: space.sm, marginBottom: space.xl },
  pending: { paddingVertical: space.xxl, alignItems: 'center', gap: space.lg },
  detection: { marginTop: space.lg },
});
