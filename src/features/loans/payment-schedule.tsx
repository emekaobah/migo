import { StyleSheet, Text, View } from 'react-native';

import type { Instalment } from '@/api/types';
import { Card } from '@/components/ui';
import { naira, shortDate } from '@/lib/format';
import { color, space, type } from '@/theme';

type Status = 'Paid' | 'Next' | 'Upcoming';

/**
 * Status is a **word**, and the colour only reinforces it (HANDOFF §12,
 * §"Accessibility"). Nothing here is conveyed by colour alone.
 *
 * `Next` is `warningText`, not `amber`: #FFB020 on white measures about 1.8:1
 * and fails AA outright. The amber in this design is a fill colour, and the
 * handoff's own token table gives #8A6A1E as its readable counterpart.
 */
const STATUS_COLOR: Record<Status, string> = {
  Paid: color.success,
  Next: color.warningText,
  Upcoming: color.textMuted,
};

function statusFor(index: number, paidCount: number): Status {
  if (index <= paidCount) return 'Paid';
  if (index === paidCount + 1) return 'Next';
  return 'Upcoming';
}

type Props = Readonly<{
  schedule: Instalment[];
  paidCount: number;
}>;

/** Every instalment on `active`, each labelled Paid / Next / Upcoming. */
export function PaymentSchedule({ schedule, paidCount }: Props) {
  return (
    <Card>
      <Text style={styles.title}>Payment schedule</Text>

      {schedule.map((instalment, i) => {
        const status = statusFor(instalment.index, paidCount);

        return (
          <View
            key={instalment.index}
            style={[styles.row, i > 0 && styles.divided]}
            accessibilityLabel={`Payment ${instalment.index}, ${naira(instalment.amount)}, due ${shortDate(instalment.dueAt)}, ${status}`}
          >
            <View style={styles.text}>
              <Text style={styles.amount}>{naira(instalment.amount)}</Text>
              <Text style={styles.date}>{shortDate(instalment.dueAt)}</Text>
            </View>
            <Text style={[styles.status, { color: STATUS_COLOR[status] }]}>{status}</Text>
          </View>
        );
      })}
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
  text: { flex: 1 },
  amount: { ...type.body, fontWeight: '700', fontVariant: ['tabular-nums'] },
  date: { ...type.caption, fontVariant: ['tabular-nums'] },
  status: { ...type.caption, fontWeight: '700' },
});
