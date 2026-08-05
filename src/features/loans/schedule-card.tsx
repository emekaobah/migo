import { StyleSheet, Text, View } from 'react-native';

import type { Instalment } from '@/api/types';
import { Card } from '@/components/ui';
import { naira, shortDate } from '@/lib/format';
import { color, space, type } from '@/theme';

type Props = Readonly<{
  schedule: Instalment[];
  title?: string;
}>;

/**
 * Every instalment, date and amount — never a summary (HANDOFF §8).
 *
 * The whole schedule is listed rather than "3 payments of about ₦36,000"
 * because the last instalment carries the split's remainder, so an "about" is
 * wrong for exactly the payment a borrower is most likely to be caught out by.
 */
export function ScheduleCard({ schedule, title = 'Repayment schedule' }: Props) {
  return (
    <Card>
      <Text style={styles.title}>{title}</Text>

      {schedule.map((instalment, i) => (
        <View
          key={instalment.index}
          style={[styles.row, i > 0 && styles.divided]}
          // See `payment-schedule.tsx` — a label on a non-accessible View is
          // read past, not read out.
          accessible
          accessibilityLabel={`Payment ${instalment.index} of ${schedule.length}, ${naira(instalment.amount)}, due ${shortDate(instalment.dueAt)}`}
        >
          <Text style={styles.label}>
            {schedule.length > 1 ? `Payment ${instalment.index}` : 'Due in full'}
          </Text>
          <Text style={styles.date}>{shortDate(instalment.dueAt)}</Text>
          <Text style={styles.amount}>{naira(instalment.amount)}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { ...type.bodyLarge, marginBottom: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
  },
  divided: { borderTopWidth: 1, borderTopColor: color.divider },
  label: { ...type.body, flex: 1 },
  date: { ...type.caption, fontVariant: ['tabular-nums'] },
  amount: { ...type.body, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
