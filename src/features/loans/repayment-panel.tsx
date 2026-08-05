import { StyleSheet, Text, View } from 'react-native';

import type { Instalment } from '@/api/types';
import { Card } from '@/components/ui';
import { fullDate, naira, shortDate } from '@/lib/format';
import { color, radius, space, type } from '@/theme';

/** Payment counts are words in this copy — "in three parts", never "in 3 parts". */
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'] as const;

const countWord = (n: number): string => WORDS[n] ?? String(n);

type Props = Readonly<{
  total: number;
  schedule: Instalment[];
}>;

/**
 * The amber repayment panel on `confirm` (HANDOFF §10).
 *
 * This is the last thing a borrower reads before holding to accept, so it
 * states the total and every instalment — the summary and the detail together,
 * on one surface, rather than making them hold a figure in their head while
 * scrolling.
 */
export function RepaymentPanel({ total, schedule }: Props) {
  const single = schedule.length === 1;

  return (
    <Card tone="warning" style={styles.panel}>
      <Text style={styles.heading}>
        {single
          ? `You repay ${naira(total)} on ${fullDate(schedule[0].dueAt)}`
          : `You repay ${naira(total)} in ${countWord(schedule.length)} parts`}
      </Text>

      {single ? null : (
        <View style={styles.rows}>
          {schedule.map((instalment) => (
            <View key={instalment.index} style={styles.row}>
              <Text style={styles.date}>{shortDate(instalment.dueAt)}</Text>
              <Text style={styles.amount}>{naira(instalment.amount)}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  // Radius 12 rather than the card's 16 — the handoff specifies a panel here,
  // and panels sit one step tighter than cards.
  panel: { borderRadius: radius.panel },
  heading: { ...type.bodyLarge, color: color.warningText },
  rows: { marginTop: space.md, gap: space.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { ...type.body, color: color.warningText },
  amount: { ...type.body, color: color.warningText, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
