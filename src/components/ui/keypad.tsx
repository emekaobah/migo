import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { color, onNavy, radius, space, type } from '@/theme';

export type KeypadHeight = 50 | 54 | 56;

type Props = {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  /** 50 on `otp`, 54 on `bind`, 56 on `enrol` and `pinlock`. */
  keyHeight?: KeypadHeight;
  /** Navy keys use white overlays; light keys use the tonal surface. */
  onDark?: boolean;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

/**
 * The custom numeric keypad. Every number in this product is entered here —
 * the system keyboard is never raised, so layout never shifts under the user
 * and the digits stay a predictable size on low-end Android.
 */
export function Keypad({ onDigit, onBackspace, keyHeight = 56, onDark = false }: Props) {
  const press = (fn: () => void) => () => {
    void Haptics.selectionAsync();
    fn();
  };

  return (
    <View style={styles.grid}>
      {KEYS.map((key) => (
        <Key key={key} label={key} height={keyHeight} onDark={onDark} onPress={press(() => onDigit(key))} />
      ))}
      <View style={[styles.key, { height: keyHeight }]} />
      <Key label="0" height={keyHeight} onDark={onDark} onPress={press(() => onDigit('0'))} />
      <Key
        label="⌫"
        height={keyHeight}
        onDark={onDark}
        onPress={press(onBackspace)}
        accessibilityLabel="Delete"
      />
    </View>
  );
}

function Key({
  label,
  height,
  onDark,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  height: number;
  onDark: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.key,
        { height },
        {
          backgroundColor: onDark
            ? pressed
              ? onNavy.keypadPressed
              : onNavy.keypad
            : pressed
              ? color.surfaceAltPressed
              : color.surfaceAlt,
        },
      ]}
    >
      <Text style={[styles.label, { color: onDark ? color.card : color.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    flexShrink: 0,
  },
  key: {
    // Three columns with two 8px gaps.
    width: `${(100 - 2 * 3) / 3}%`,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    ...type.h2,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
