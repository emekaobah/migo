import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import type { PayoutAccount } from '@/api/types';
import { Button, HeaderRow, InlineError, RadioRow, Screen, Spinner } from '@/components/ui';
import { useLoan } from '@/state/loan-context';
import { space, type } from '@/theme';

/**
 * Screen 9 — where the money lands (HANDOFF §9).
 *
 * Reached from `offers` only when no account has ever been chosen; a returning
 * borrower goes straight to `confirm`, which carries a Change row back here.
 * That routing is driven by `accountChosen` in loan state rather than by
 * checking whether `accountId` happens to be set, because "never picked one"
 * and "picked one and it is the first in the list" are different facts.
 */
export default function BanksScreen() {
  const router = useRouter();
  const { accountId, chooseAccount } = useLoan();

  const [accounts, setAccounts] = useState<PayoutAccount[] | null>(null);
  const [selected, setSelected] = useState<string | null>(accountId);
  const [error, setError] = useState<string | null>(null);
  // A failed fetch is not an empty list. Collapsing the two renders an empty
  // radio group with no explanation, and the only CTA then asks the borrower to
  // pick from nothing — a dead end with no way back out.
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (failed) return;
    let active = true;

    api
      .listAccounts()
      .then((list) => {
        if (active) setAccounts(list);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [failed]);

  function onUse() {
    if (!selected) {
      setError('Pick the account you want the money paid into.');
      return;
    }

    setError(null);
    chooseAccount(selected);
    router.push('/(loan)/confirm');
  }

  return (
    <Screen surface="surface" scroll>
      <HeaderRow variant="back" onBack={() => router.back()} />
      <Text style={styles.h1}>Where should the money go?</Text>

      {failed ? (
        <View style={styles.pending}>
          <InlineError message="We could not load your accounts. Check your connection." />
          <Button label="Try again" onPress={() => setFailed(false)} variant="tonal" />
        </View>
      ) : null}

      {!failed && accounts === null ? (
        <View style={styles.pending}>
          <Spinner />
        </View>
      ) : null}

      {!failed && accounts !== null ? (
        <>
          <View style={styles.list} accessibilityRole="radiogroup">
            {accounts.map((account) => (
              <RadioRow
                key={account.id}
                label={`${account.bank} ${account.maskedNumber}`}
                sub={`${account.holder} · ${account.type}`}
                labelRole="name"
                selected={selected === account.id}
                onPress={() => setSelected(account.id)}
              />
            ))}
          </View>

          <Text style={styles.footnote}>
            Only an account in your own name can receive a Migo loan.
          </Text>
        </>
      ) : null}

      {/*
        No CTA while the list is missing. "Use this account" over a failed fetch
        can only ever answer "pick one" — which is not something the borrower
        can do, and not what went wrong.
      */}
      {failed ? null : (
        <View style={styles.footer}>
          {error ? <InlineError message={error} /> : null}
          <Button label="Use this account" onPress={onUse} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...type.h1, marginTop: space.sm, marginBottom: space.xl },
  pending: { paddingVertical: space.xxl, alignItems: 'center' },
  list: { gap: space.sm },
  footnote: { ...type.caption, marginTop: space.lg },
  footer: { marginTop: 'auto', paddingTop: space.xl, gap: space.md },
});
