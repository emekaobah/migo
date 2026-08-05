import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Amount, Button, Screen } from '@/components/ui';
import { fullDate, naira } from '@/lib/format';
import { useLoan } from '@/state/loan-context';
import { color, space, type } from '@/theme';

/**
 * Screen 11 — the money has gone (HANDOFF §11).
 *
 * Full-bleed success green, and the only way forward is `active`. The back
 * gesture is not blocked here, but there is nothing behind this screen worth
 * returning to: `confirm` navigated with `replace`, so the flow that took the
 * loan is already off the stack.
 */
export default function SuccessScreen() {
  const router = useRouter();
  const { loan } = useLoan();

  if (!loan) return <Redirect href="/(loan)/offers" />;

  const last = loan.schedule[loan.schedule.length - 1];

  return (
    <Screen surface="success">
      <View style={styles.body}>
        <View style={styles.check}>
          <Text style={styles.tick}>✓</Text>
        </View>

        <Text style={styles.sentTo}>
          Sent to {loan.disbursedTo.bank} {loan.disbursedTo.maskedNumber}
        </Text>

        <Amount value={naira(loan.principal)} size="displayLarge" onDark />

        <Text style={styles.summary}>
          You repay {naira(loan.total)}
          {loan.schedule.length > 1
            ? ` across ${loan.schedule.length} payments, ending ${fullDate(last.dueAt)}`
            : ` on ${fullDate(last.dueAt)}`}
        </Text>
      </View>

      {/*
        `tonal` is the design's white pill: on the success green it reads as
        white with a navy label, and it needs no variant invented for a single
        screen.
      */}
      <Button
        label="View my loan"
        onPress={() => router.replace('/(loan)/active')}
        variant="tonal"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  check: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: color.successAccent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tick: { fontSize: 48, fontWeight: '700', color: color.successText },
  sentTo: { ...type.bodyLarge, color: color.card },
  summary: { ...type.body, color: color.card, textAlign: 'center', opacity: 0.9 },
});
