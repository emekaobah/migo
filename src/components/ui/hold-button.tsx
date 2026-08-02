import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePlatform } from '@/state/use-platform';
import { color, control, duration, type } from '@/theme';

const STEP_PERCENT = 6;

type Props = Readonly<{
  /** Fires once when the sweep reaches 100. */
  onComplete: () => void;
  label?: string;
  holdingLabel?: string;
  testID?: string;
}>;

/**
 * Hold-to-accept on `confirm` — the deliberate friction before taking a loan.
 *
 * A green fill sweeps the navy pill left-to-right at 6% per 60ms, so a complete
 * hold takes about a second. Releasing early resets to zero rather than
 * pausing: a partial hold must not accumulate across attempts, or the gesture
 * stops meaning "I am sure".
 */
export function HoldButton({
  onComplete,
  label = 'Hold to accept',
  holdingLabel = 'Keep holding…',
  testID,
}: Props) {
  const { buttonRadius } = usePlatform();
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const done = useRef(false);
  const elapsed = useRef(0);

  const stop = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  // Never leave an interval running behind an unmounted screen.
  useEffect(() => stop, [stop]);

  const start = useCallback(() => {
    if (done.current) return;
    setHolding(true);
    stop();

    // Progress is tracked in a ref and mirrored into state for render. The
    // completion side effect must not live inside a setState updater — React
    // may invoke updaters more than once, and a double-charged loan is not a
    // theoretical concern.
    timer.current = setInterval(() => {
      const next = Math.min(100, elapsed.current + STEP_PERCENT);
      elapsed.current = next;
      setProgress(next);

      if (next >= 100 && !done.current) {
        done.current = true;
        stop();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onComplete();
      }
    }, duration.holdStep);
  }, [onComplete, stop]);

  const release = useCallback(() => {
    stop();
    setHolding(false);
    if (!done.current) {
      elapsed.current = 0;
      setProgress(0);
    }
  }, [stop]);

  return (
    <Pressable
      onPressIn={start}
      onPressOut={release}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Press and hold to accept"
      accessibilityValue={{ min: 0, max: 100, now: progress }}
      style={[styles.base, { borderRadius: buttonRadius }]}
    >
      <View style={[styles.fill, { width: `${progress}%` }]} />
      <Text style={styles.label}>{holding && progress < 100 ? holdingLabel : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: control.button,
    backgroundColor: color.navy,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  fill: {
    // Anchored left so the sweep grows rightward as `width` animates.
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: color.success,
  },
  label: {
    ...type.bodyLarge,
    fontWeight: '700',
    color: color.card,
  },
});
