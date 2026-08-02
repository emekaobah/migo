import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { color, duration, onNavy, space, type } from '@/theme';

/** 44px ring, amber arc, 0.9s linear — the `loading` screen spinner. */
export function Spinner({ size = 44 }: { size?: number }) {
  // Lazy useState rather than useRef: the value is read during render to build
  // the interpolation, which `react-hooks/refs` rightly flags on a ref.
  const [spin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: duration.spinner,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[
        styles.spinner,
        { width: size, height: size, borderRadius: size / 2, transform: [{ rotate }] },
      ]}
    />
  );
}

type ProgressProps = {
  total: number;
  cleared: number;
  style?: ViewStyle;
};

/**
 * One segment per instalment on the `active` loan card. Segments rather than a
 * continuous bar because the borrower is tracking discrete payments, not a
 * percentage — and the count is always stated in words alongside.
 */
export function SegmentedProgress({ total, cleared, style }: ProgressProps) {
  return (
    <View
      style={[styles.segments, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={`${cleared} of ${total} payments cleared`}
      accessibilityValue={{ min: 0, max: total, now: cleared }}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            { backgroundColor: i < cleared ? color.successAccent : onNavy.track },
          ]}
        />
      ))}
    </View>
  );
}

type ErrorProps = {
  message: string;
  /** Errors on navy use the lighter amber; on light surfaces they use danger. */
  onDark?: boolean;
};

/**
 * Validation message above the primary button.
 *
 * This is what replaces disabled buttons: the CTA always presses, and when the
 * input is not ready this says what to do about it.
 */
export function InlineError({ message, onDark = false }: ErrorProps) {
  return (
    <Text
      accessibilityRole="alert"
      style={[styles.error, { color: onDark ? color.errorOnNavy : color.danger }]}
    >
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  spinner: {
    borderWidth: 3,
    borderColor: onNavy.track,
    borderTopColor: color.amber,
  },
  segments: {
    flexDirection: 'row',
    gap: space.xs,
    flexShrink: 0,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  error: {
    ...type.caption,
    fontWeight: '600',
    marginBottom: space.md,
  },
});
