import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import type { PayoutAccount } from '@/api/types';
import { Button, HeaderRow, InlineError, RadioRow, Row, Screen, Spinner } from '@/components/ui';
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
 *
 * "Add an account" opens `add-account`, which returns here with `added` set to
 * the new account's id. The list is fetched on focus rather than on mount, so
 * the account is there when the borrower comes back, and it arrives selected.
 */
export default function BanksScreen() {
  const router = useRouter();
  const { accountId, chooseAccount } = useLoan();
  const { added } = useLocalSearchParams<{ added?: string }>();

  const [accounts, setAccounts] = useState<PayoutAccount[] | null>(null);
  const [selected, setSelected] = useState<string | null>(added ?? accountId);
  const [error, setError] = useState<string | null>(null);
  // A failed fetch is not an empty list. Collapsing the two renders an empty
  // radio group with no explanation, and the only CTA then asks the borrower to
  // pick from nothing — a dead end with no way back out.
  const [failed, setFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (failed) return;
      let active = true;

      api
        .listAccounts()
        .then((list) => {
          if (!active) return;
          setAccounts(list);
          if (added) setSelected(added);
        })
        .catch(() => {
          if (active) setFailed(true);
        });

      return () => {
        active = false;
      };
    }, [failed, added]),
  );

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

          {accounts.length === 0 ? (
            <Text style={styles.empty}>
              You have no payout account yet. Add one to receive your loan.
            </Text>
          ) : null}

          <Row
            label="Add an account"
            chevron
            onPress={() => router.push('/(loan)/add-account')}
            style={styles.add}
          />

          <Text style={styles.footnote}>
            Only an account in your own name can receive a Migo loan.
          </Text>
        </>
      ) : null}

      {/*
        No CTA while the list is missing. "Use this account" over a failed fetch
        can only ever answer "pick one" — which is not something the borrower
        can do, and not what went wrong. The same holds for an empty list: the
        only way forward there is to add one.
      */}
      {failed || accounts?.length === 0 ? null : (
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
  empty: { ...type.body, marginBottom: space.md },
  add: { marginTop: space.md },
  footnote: { ...type.caption, marginTop: space.lg },
  footer: { marginTop: 'auto', paddingTop: space.xl, gap: space.md },
});
