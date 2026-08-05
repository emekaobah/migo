import { StyleSheet, View } from 'react-native';

import type { Tenor } from '@/api/types';
import { Pill } from '@/components/ui';

/** "1 payment" / "2 payments" — the count is a word on screen, never a bare digit. */
function paymentsLabel(payments: number): string {
  return payments === 1 ? '1 payment' : `${payments} payments`;
}

type Props = Readonly<{
  tenors: Tenor[];
  selected: Tenor | null;
  onSelect: (tenor: Tenor) => void;
}>;

/**
 * Stage one of `offers` — duration, before amount (HANDOFF §8).
 *
 * The order is not cosmetic: it matches the live web flow, and picking a
 * duration first is what makes the amount rows able to show a real per-payment
 * figure rather than a range.
 */
export function TenorGrid({ tenors, selected, onSelect }: Props) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {tenors.map((tenor) => (
        <Pill
          key={tenor.days}
          label={`${tenor.days} days`}
          sub={paymentsLabel(tenor.payments)}
          selected={selected?.days === tenor.days}
          onPress={() => onSelect(tenor)}
          style={styles.pill}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // 7px, per the handoff's tenor grid — not a spacing token, because it is a
    // one-off grid gutter rather than a step on the 4pt scale.
    gap: 7,
  },
  // Four equal columns that still wrap gracefully if the rate table ever
  // returns more than four tenors: the basis is small enough to allow a wrap,
  // and grow shares whatever the row has left.
  pill: { flexGrow: 1, flexBasis: '20%' },
});
