import { Pressable, StyleSheet, Text, View } from 'react-native';

import { biometric, color, onNavy, space, type } from '@/theme';

type Props = Readonly<{
  onPress: () => void;
  /** Shown for the 700ms beat between recognition and the next screen. */
  recognised: boolean;
  /** No usable sensor — the target becomes inert and the PIN path carries. */
  unavailable?: boolean;
}>;

/**
 * Three states, in priority order: recognition wins over everything, then the
 * no-sensor fallback, then the platform prompt. Spelled out rather than nested
 * inline, because the order is the meaning — a recognised borrower must not be
 * told to use their PIN.
 */
function promptFor(recognised: boolean, unavailable: boolean): string {
  if (recognised) return 'Recognised — opening…';
  if (unavailable) return 'Use your PIN to sign in';
  return biometric.signInPrompt;
}

/**
 * The sign-in target on `lock`.
 *
 * 112px is deliberate: this is the control a returning borrower taps every
 * time, often one-handed, and it replaces an SMS code entirely. The prompt copy
 * is platform-resolved — "Touch the sensor" on Android, "Glance at your phone"
 * on iOS — because telling someone to touch a sensor their phone does not have
 * is the kind of small wrongness that costs trust.
 */
export function BiometricTarget({ onPress, recognised, unavailable = false }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        disabled={unavailable}
        accessibilityRole="button"
        // `disabled` stops the press but screen readers still announce an
        // actionable button without this — the audit is explicit about not
        // relying on visual state alone.
        accessibilityState={{ disabled: unavailable }}
        // Same three states as the visible prompt. A screen-reader user who
        // cannot see "Recognised — opening…" otherwise gets no confirmation
        // that the touch worked.
        accessibilityLabel={promptFor(recognised, unavailable)}
        accessibilityHint={unavailable ? undefined : 'Signs you in without a code'}
        testID="biometric-target"
        style={({ pressed }) => [styles.target, pressed && !unavailable && styles.pressed]}
      >
        <View style={styles.inner} />
      </Pressable>

      <Text style={styles.prompt}>{promptFor(recognised, unavailable)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.lg },
  target: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: onNavy.keypad,
    borderWidth: 2.5,
    borderColor: color.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: onNavy.keypadPressed },
  inner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: color.amber,
  },
  prompt: { ...type.body, color: onNavy.label, textAlign: 'center' },
});
