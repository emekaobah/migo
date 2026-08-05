import { StyleSheet, Text, View } from 'react-native';

import type { Tenor } from '@/api/types';
import { RadioRow } from '@/components/ui';
import { instalmentLine, naira } from '@/lib/format';
import { splitEvenly, totalRepayable } from '@/lib/loan-math';
import { color, space, type } from '@/theme';

type Props = Readonly<{
  amounts: number[];
  tenor: Tenor;
  selected: number | null;
  onSelect: (principal: number) => void;
}>;

/**
 * Stage two of `offers` — how much, now that the duration is known.
 *
 * Every figure here is derived from the `tenor.multiplier` the API returned.
 * **No multiplier is ever written into a screen** (PLAN §5): a real rate table
 * changes `fixtures.ts`, or the HTTP client that replaces it, and this list
 * recomputes without an edit.
 */
export function AmountList({ amounts, tenor, selected, onSelect }: Props) {
  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {amounts.map((principal) => {
        const total = totalRepayable(principal, tenor.multiplier);
        // The base instalment — the last one carries the remainder, and the
        // schedule card below shows every exact figure.
        const [each] = splitEvenly(total, tenor.payments);
        const isSelected = selected === principal;

        return (
          <RadioRow
            key={principal}
            label={naira(principal)}
            selected={isSelected}
            onPress={() => onSelect(principal)}
            right={
              <View style={styles.right}>
                <Text style={[styles.total, isSelected && styles.totalSelected]}>
                  {naira(total)}
                </Text>
                <Text style={[styles.each, isSelected && styles.eachSelected]}>
                  {instalmentLine(tenor.payments, each)}
                </Text>
              </View>
            }
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.sm },
  right: { alignItems: 'flex-end' },
  total: { ...type.bodyLarge, fontWeight: '700', fontVariant: ['tabular-nums'] },
  totalSelected: { color: color.card },
  each: { ...type.micro, fontVariant: ['tabular-nums'] },
  eachSelected: { color: color.amber },
});
