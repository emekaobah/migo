import { StyleSheet, Text, View } from 'react-native';

import { color, onNavy, space, type } from '@/theme';

type Props = Readonly<{
  /** Digits entered so far, up to 10 after the +234 prefix. */
  value: string;
}>;

/**
 * The only place a phone number is typed in this product.
 *
 * The country code is fixed text rather than an editable field — Migo lends in
 * Nigeria only, and a borrower cannot usefully change it. Digits are tabular so
 * the number does not shift as it is typed.
 */
export function PhoneEntry({ value }: Props) {
  const formatted = [value.slice(0, 3), value.slice(3, 6), value.slice(6, 10)]
    .filter(Boolean)
    .join(' ');

  return (
    <View>
      <Text style={styles.label}>Phone number</Text>
      <View style={styles.row}>
        <Text style={styles.prefix}>+234</Text>
        <View style={styles.entry}>
          <Text
            style={styles.digits}
            accessibilityLabel={`Phone number, ${value.length} of 10 digits entered`}
          >
            {formatted}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...type.caption, color: color.amber, marginBottom: space.xs },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  prefix: { fontSize: 19, color: onNavy.label },
  entry: {
    flex: 1,
    borderBottomWidth: 2,
    borderBottomColor: color.amber,
    paddingBottom: space.xs,
    minHeight: 34,
    justifyContent: 'flex-end',
  },
  digits: {
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 22 * 0.04,
    color: color.card,
    fontVariant: ['tabular-nums'],
  },
});
