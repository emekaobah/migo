import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Amount, Button, HeaderRow, InlineError, Screen } from '@/components/ui';
import { BankChoice } from '@/features/repayment/bank-choice';
import { naira } from '@/lib/format';
import { nextInstalment, outstandingAfter } from '@/lib/loan-math';
import { useLoan } from '@/state/loan-context';
import { space, type } from '@/theme';

/**
 * Screen 13 — choose where the wallet is opened (HANDOFF §13).
 *
 * Migo opens a wallet in the borrower's own name at one of two banks; they
 * transfer into it and the system detects the payment. So this screen is not
 * "pay now" — it is "which bank do you want to transfer to", and the copy says
 * so, because a borrower who expects a card charge here will wait for one.
 */
export default function RepayScreen() {
  const router = useRouter();
  const { loan, payBank, choosePayBank } = useLoan();

  const [selected, setSelected] = useState(payBank);
  const [error, setError] = useState<string | null>(null);

  if (!loan) return <Redirect href="/(loan)/offers" />;

  const due = nextInstalment(loan.schedule, loan.paidCount);
  if (!due) return <Redirect href="/(loan)/active" />;

  const outstanding = outstandingAfter(loan.schedule, loan.paidCount);
  const remaining = outstanding - due.amount;

  function onContinue() {
    if (!selected) {
      // The list chooses where Migo *opens* the wallet, not where the money
      // comes from. "Transfer from" named the opposite account.
      setError('Pick the bank you want your wallet opened at.');
      return;
    }

    setError(null);
    choosePayBank(selected);
    router.push('/(loan)/wallet');
  }

  return (
    <Screen surface="surface" scroll>
      <HeaderRow variant="back" onBack={() => router.back()} />

      <Text style={styles.label}>Pay</Text>
      <Amount value={naira(due.amount)} size="display" />

      <Text style={styles.explain}>
        We open a wallet in your own name at the bank you pick. Transfer this
        amount into it and we clear the payment automatically — there is nothing
        to confirm afterwards.
      </Text>

      <BankChoice selected={selected} onSelect={setSelected} />

      <Text style={styles.remaining}>
        Remaining after this payment: {naira(remaining)}
      </Text>

      <View style={styles.footer}>
        {error ? <InlineError message={error} /> : null}
        <Button label="Get my wallet details" onPress={onContinue} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...type.caption, marginTop: space.sm },
  explain: { ...type.body, marginTop: space.lg, marginBottom: space.xl },
  remaining: { ...type.caption, marginTop: space.lg, fontVariant: ['tabular-nums'] },
  footer: { marginTop: 'auto', paddingTop: space.xl, gap: space.md },
});
