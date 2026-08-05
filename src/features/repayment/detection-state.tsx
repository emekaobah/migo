import { StyleSheet, Text, View } from 'react-native';

import { Card, Spinner } from '@/components/ui';
import { naira } from '@/lib/format';
import { color, space, type } from '@/theme';

type Props = Readonly<{
  received: boolean;
  amount: number;
}>;

/**
 * Waiting for the transfer, then received (HANDOFF §14).
 *
 * There is deliberately **no "I've sent the money" button**. The prototype had
 * one to skip the wait; it does not carry over (PLAN §5). It buys nothing —
 * the watcher resolves on its own — and six seconds of a screen that says it is
 * watching for a transfer is an honest depiction of a screen watching for a
 * transfer. The real trigger is the settlement webhook.
 *
 * Both states name themselves in words. Status conveyed by card colour alone
 * fails the handoff's accessibility list.
 */
export function DetectionState({ received, amount }: Props) {
  if (received) {
    return (
      <Card tone="success" testID="payment-received">
        <Text style={styles.receivedTitle}>Payment received</Text>
        <Text style={styles.receivedBody}>
          {naira(amount)} has cleared. Your balance is updating now.
        </Text>
      </Card>
    );
  }

  return (
    <Card testID="payment-waiting">
      <View style={styles.waitingRow}>
        <Spinner size={24} />
        <View style={styles.waitingText}>
          <Text style={styles.waitingTitle}>Waiting for your transfer</Text>
          <Text style={styles.waitingBody}>
            We spot it automatically, usually within a minute. You can leave this
            screen — it keeps working.
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  waitingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  waitingText: { flex: 1 },
  waitingTitle: { ...type.bodyLarge },
  waitingBody: { ...type.caption, marginTop: space.xs },
  receivedTitle: { ...type.bodyLarge, color: color.successText },
  receivedBody: { ...type.body, color: color.successTextAlt, marginTop: space.xs },
});
