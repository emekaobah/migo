import { StyleSheet, Text, type TextStyle } from 'react-native';

import { color, type } from '@/theme';

type Props = {
  /** Already formatted — pass `naira(x)` from `lib/format`. */
  value: string;
  size?: 'display' | 'displayLarge' | 'h2' | 'body';
  onDark?: boolean;
  style?: TextStyle;
};

/**
 * Currency text. Always tabular so figures do not jitter as digits change,
 * which matters most on the wallet screen where the number is read aloud
 * digit by digit while transferring.
 */
export function Amount({ value, size = 'display', onDark = false, style }: Props) {
  return (
    <Text style={[type[size], styles.tabular, onDark && styles.onDark, style]}>{value}</Text>
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
  onDark: { color: color.card },
});
