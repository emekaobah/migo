import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePlatform } from '@/state/use-platform';
import { color, radius, space, type } from '@/theme';

type Props = Readonly<{
  enrolled: boolean;
  onPress: () => void;
  /** Shown instead of the prompt when the handset has no usable sensor. */
  unavailableReason?: string;
}>;

/**
 * Biometric enrolment on `bind`.
 *
 * Two states, per the handoff: untapped (tonal, ring outline) and enrolled
 * (success tint, green check). The enrolled sub-line states plainly that the
 * biometric never leaves the phone, because that is the claim the borrower is
 * being asked to trust.
 */
export function BiometricCard({ enrolled, onPress, unavailableReason }: Props) {
  const { biometric } = usePlatform();

  if (unavailableReason) {
    return (
      <View style={[styles.card, styles.untapped]}>
        <View style={styles.ring} />
        <View style={styles.text}>
          <Text style={styles.title}>Biometric unavailable</Text>
          <Text style={styles.sub}>{unavailableReason} Your PIN will sign you in.</Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ checked: enrolled }}
      accessibilityLabel={enrolled ? biometric.enrolledTitle : biometric.enrolTitle}
      style={({ pressed }) => [
        styles.card,
        enrolled ? styles.enrolled : styles.untapped,
        pressed && !enrolled && styles.pressed,
      ]}
    >
      {enrolled ? (
        <View style={styles.check}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
      ) : (
        <View style={styles.ring} />
      )}

      <View style={styles.text}>
        <Text style={[styles.title, enrolled && styles.enrolledTitle]}>
          {enrolled ? biometric.enrolledTitle : biometric.enrolTitle}
        </Text>
        <Text style={[styles.sub, enrolled && styles.enrolledSub]}>
          {enrolled ? 'Kept on this phone only. Never sent to Migo.' : 'Tap to add it. One touch to sign in.'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.card,
    flexShrink: 0,
  },
  untapped: { backgroundColor: color.surfaceAlt },
  enrolled: { backgroundColor: color.successBg },
  pressed: { backgroundColor: color.surfaceAltPressed },
  ring: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: color.textMuted,
  },
  check: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: color.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: color.card, fontSize: 22, fontWeight: '700' },
  text: { flex: 1 },
  title: { ...type.bodyLarge, fontWeight: '600' },
  enrolledTitle: { color: color.successText },
  sub: { ...type.caption },
  enrolledSub: { color: color.successTextAlt },
});
