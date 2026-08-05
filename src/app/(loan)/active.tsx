import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Button, Card, Row, Screen } from '@/components/ui';
import { OutstandingCard } from '@/features/loans/outstanding-card';
import { PaymentSchedule } from '@/features/loans/payment-schedule';
import { fullDate } from '@/lib/format';
import { useAuth } from '@/state/auth-context';
import { useLoan } from '@/state/loan-context';
import { useNavOrigin } from '@/state/nav-origin';
import { color, control, space, type } from '@/theme';

/**
 * Screen 12 — the loan, once it exists (HANDOFF §12).
 *
 * This is the app's home for a borrower who has taken a loan, so every onward
 * path starts here: repay, extend, account, and help. Help records where it was
 * opened from rather than inferring it, which is the convention the handoff
 * attributes four defects to getting wrong (PLAN §3.3).
 */
export default function ActiveScreen() {
  const router = useRouter();
  const { name } = useAuth();
  const { loan } = useLoan();
  const { openHelpFrom } = useNavOrigin();

  // No loan means this screen has nothing to describe — a borrower who lands
  // here after settling up belongs back at the offers they still qualify for.
  if (!loan) return <Redirect href="/(loan)/offers" />;

  function onHelp() {
    openHelpFrom('/(loan)/active');
    router.push('/(support)/help');
  }

  return (
    <Screen surface="surface" scroll>
      <View style={styles.header}>
        <Text style={styles.h1}>Your loan</Text>
        <Avatar name={name ?? ''} onPress={() => router.push('/(account)/account')} />
      </View>

      <OutstandingCard loan={loan} />

      <View style={styles.actions}>
        <Button
          label="Repay"
          onPress={() => router.push('/(loan)/repay')}
          variant="success"
          style={styles.action}
        />
        <Button
          label="Extend"
          onPress={() => router.push('/(loan)/extend')}
          variant="tonal"
          style={styles.action}
        />
      </View>

      {loan.extendedTo ? (
        <Card tone="success" style={styles.block}>
          <Text style={styles.extendedTitle}>This loan has been extended</Text>
          <Text style={styles.extendedBody}>
            The balance below carries to {fullDate(loan.extendedTo)}. Paying earlier costs no more.
          </Text>
        </Card>
      ) : null}

      <View style={styles.block}>
        <PaymentSchedule schedule={loan.schedule} paidCount={loan.paidCount} />
      </View>

      <View style={styles.block}>
        <Card>
          <Row label="Help & FAQs" onPress={onHelp} chevron />
        </Card>
      </View>

      <View style={styles.block}>
        <Card tone="tonal">
          <Text style={styles.remindersTitle}>Reminders</Text>
          <Text style={styles.remindersBody}>
            We text you three days before each payment is due, and again on the day. Repaying on
            time is what raises your limit.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    minHeight: control.tap,
    paddingVertical: space.md,
  },
  h1: { ...type.h1 },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  // Equal halves. `flexBasis: 0` with `flexGrow: 1` keeps them even whatever
  // the labels are, where `flex: 1` alone would let the wider label win.
  action: { flexGrow: 1, flexBasis: 0 },
  block: { marginTop: space.lg },
  extendedTitle: { ...type.bodyLarge, color: color.successText },
  extendedBody: { ...type.body, color: color.successTextAlt, marginTop: space.xs },
  remindersTitle: { ...type.bodyLarge },
  remindersBody: { ...type.body, color: color.textSecondary, marginTop: space.xs },
});
