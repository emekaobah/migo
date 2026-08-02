import { StyleSheet, Text, View } from 'react-native';

import { color, radius, space, type } from '@/theme';

type Props = {
  /** The digits entered so far, 0–6 characters. */
  value: string;
  length?: number;
};

/**
 * The six enrolment-code boxes on `otp`.
 *
 * Three states, per the handoff: filled (tonal, navy border), active (white,
 * 2px amber), empty (white, thin border). The active box is the next one to be
 * filled, so the user can see where input is going without a caret.
 */
export function CodeBoxes({ value, length = 6 }: Props) {
  return (
    <View
      style={styles.row}
      accessibilityLabel={`Enrolment code, ${value.length} of ${length} digits entered`}
    >
      {Array.from({ length }, (_, i) => {
        const digit = value[i];
        const filled = digit !== undefined;
        const active = !filled && i === value.length;

        return (
          <View key={i} style={[styles.box, filled ? styles.filled : active ? styles.active : styles.empty]}>
            <Text style={styles.digit}>{digit ?? ''}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 9,
    flexShrink: 0,
  },
  box: {
    flex: 1,
    height: 58,
    borderRadius: radius.code,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filled: {
    backgroundColor: color.surfaceAlt,
    borderWidth: 1.5,
    borderColor: color.navy,
  },
  active: {
    backgroundColor: color.card,
    borderWidth: 2,
    borderColor: color.amber,
  },
  empty: {
    backgroundColor: color.card,
    borderWidth: 1.5,
    borderColor: color.border,
  },
  digit: {
    ...type.h2,
    fontVariant: ['tabular-nums'],
  },
});

type PinProps = {
  filled: number;
  length?: number;
  /** Amber dots on navy, navy dots on light. */
  onDark?: boolean;
};

/** The six PIN dots on `bind` and `pinlock`. */
export function PinDots({ filled, length = 6, onDark = false }: PinProps) {
  return (
    <View
      style={pinStyles.row}
      accessibilityLabel={`PIN, ${filled} of ${length} digits entered`}
    >
      {Array.from({ length }, (_, i) => (
        <View
          key={i}
          style={[
            pinStyles.dot,
            {
              backgroundColor:
                i < filled ? (onDark ? color.amber : color.navy) : onDark ? 'transparent' : color.border,
              borderColor: onDark ? color.amber : color.border,
            },
          ]}
        />
      ))}
    </View>
  );
}

const pinStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.md,
    justifyContent: 'center',
    flexShrink: 0,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
});
