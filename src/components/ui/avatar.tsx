import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { color, space } from '@/theme';

/**
 * Initials for the avatar disc — first and last name parts, uppercased.
 *
 * `"Tunde Adeyemi"` → `"TA"`; a single name → its first letter; an empty or
 * whitespace-only name → `""`, which renders an empty disc rather than throwing
 * on a borrower whose name the server has not returned yet.
 */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';

  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? '') : '';
  return (first + last).toUpperCase();
}

/** 48px in headers, 64px on `account`. Type scales with the disc. */
const SIZES = {
  48: { disc: 48, fontSize: 16 },
  64: { disc: 64, fontSize: 22 },
} as const;

type Props = Readonly<{
  name: string;
  size?: keyof typeof SIZES;
  /** Omitted on `account`, where the avatar is decorative rather than a link. */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}>;

/**
 * The initials disc. Tappable in headers, where it opens `account`.
 *
 * The 48px variant is exactly the minimum touch target, so it needs no extra
 * hit slop — which is why the sizes are a fixed pair rather than a free number.
 */
export function Avatar({ name, size = 48, onPress, style, testID }: Props) {
  const { disc, fontSize } = SIZES[size];
  const shape = { width: disc, height: disc, borderRadius: disc / 2 };
  const label = <Text style={[styles.initials, { fontSize }]}>{initials(name)}</Text>;
  // Callers pass `name ?? ''` while the profile is still loading, and
  // "Account, " announces a trailing comma and then nothing.
  const trimmed = name.trim();

  if (!onPress) {
    return (
      <View style={[styles.disc, shape, style]} testID={testID}>
        {label}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={trimmed ? `Account, ${trimmed}` : 'Account'}
      testID={testID}
      style={({ pressed }) => [
        styles.disc,
        shape,
        pressed && styles.pressed,
        style,
      ]}
    >
      {label}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disc: {
    backgroundColor: color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    // Fixed-size controls inside scroll views must not be squeezed by their
    // siblings — the accessibility audit calls this out specifically.
    flexShrink: 0,
  },
  pressed: { backgroundColor: color.surfaceAltPressed },
  initials: { fontWeight: '700', color: color.navy, letterSpacing: space.xs / 4 },
});
