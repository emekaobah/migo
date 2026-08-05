import { StyleSheet, Text, View } from 'react-native';

import type { Loan } from '@/api/types';
import { Amount, Card, SegmentedProgress } from '@/components/ui';
import { fullDate, naira } from '@/lib/format';
import { nextInstalment, outstandingAfter } from '@/lib/loan-math';
import { color, onNavy, space, type } from '@/theme';

type Props = Readonly<{ loan: Loan }>;

/**
 * The navy hero card on `active` (HANDOFF §12).
 *
 * Everything shown is derived from the loan's own schedule via `loan-math`,
 * never stored alongside it — an outstanding balance kept as its own field is a
 * second source of truth for a number the schedule already answers, and the two
 * drift the moment a payment lands.
 */
export function OutstandingCard({ loan }: Props) {
  const outstanding = outstandingAfter(loan.schedule, loan.paidCount);
  const next = nextInstalment(loan.schedule, loan.paidCount);
  const total = loan.schedule.length;

  return (
    <Card tone="navy">
      <Text style={styles.label}>Outstanding</Text>
      <Amount value={naira(outstanding)} size="display" onDark />

      <SegmentedProgress total={total} cleared={loan.paidCount} style={styles.progress} />
      <Text style={styles.cleared}>
        {loan.paidCount} of {total} {total === 1 ? 'payment' : 'payments'} cleared
      </Text>

      {next ? (
        <>
          <View style={styles.divider} />
          <View style={styles.nextRow}>
            <Text style={styles.label}>Next payment</Text>
            <View style={styles.nextFigures}>
              <Text style={styles.nextAmount}>{naira(next.amount)}</Text>
              <Text style={styles.nextDate}>{fullDate(next.dueAt)}</Text>
            </View>
          </View>
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  label: { ...type.caption, color: onNavy.label },
  progress: { marginTop: space.lg },
  cleared: { ...type.caption, color: onNavy.caption, marginTop: space.sm },
  divider: {
    height: 1,
    backgroundColor: onNavy.divider,
    marginVertical: space.lg,
  },
  nextRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nextFigures: { alignItems: 'flex-end' },
  nextAmount: {
    ...type.bodyLarge,
    color: color.amber,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  nextDate: { ...type.caption, color: color.amber, fontVariant: ['tabular-nums'] },
});
