import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { buttonRadius, color, control, type } from '@/theme';

export type ButtonVariant =
  | 'primary-amber'
  | 'primary-navy'
  | 'success'
  | 'tonal'
  | 'outlined'
  | 'destructive'
  | 'tertiary';

type Props = Readonly<{
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** 52px instead of 56px, for buttons sitting inside cards. */
  small?: boolean;
  /** Outlined and tertiary buttons sit on navy as often as on white. */
  onDark?: boolean;
  style?: ViewStyle;
  testID?: string;
}>;

/**
 * A filled variant is fully described by its resting and pressed colours, so
 * the table says exactly that and the component stops branching.
 */
const FILL: Partial<Record<ButtonVariant, { rest: string; pressed: string }>> = {
  'primary-amber': { rest: color.amber, pressed: color.amberPressed },
  'primary-navy': { rest: color.navy, pressed: color.navyPressed },
  // Repaying is the affirmative money-moving action, and the design gives it
  // the same green as the hold-to-accept sweep rather than the navy primary.
  success: { rest: color.success, pressed: color.successPressed },
  tonal: { rest: color.surfaceAlt, pressed: color.surfaceAltPressed },
  destructive: { rest: color.danger, pressed: color.dangerPressed },
};

const LABEL_COLOR: Record<ButtonVariant, string> = {
  'primary-amber': color.navy,
  'primary-navy': color.card,
  success: color.card,
  destructive: color.card,
  tonal: color.navy,
  // Overridden to amber when sitting on a dark surface.
  outlined: color.navy,
  tertiary: color.navy,
};

/** Transparent variants only differ in whether they carry a border. */
const TRANSPARENT_PRESSED = { dark: color.navyPressed, light: color.cardPressed };

/**
 * The one button in this product.
 *
 * **There is deliberately no `disabled` prop.** The handoff is explicit: no
 * disabled states anywhere in this design. Validation happens in the press
 * handler and surfaces an `InlineError` above the button, because a disabled
 * CTA gives a borrower no way to discover what is wrong. Adding `disabled`
 * here should fail review.
 */
export function Button({
  label,
  onPress,
  variant = 'primary-amber',
  small = false,
  onDark = false,
  style,
  testID,
}: Props) {
  const height = small ? control.buttonSm : control.button;
  const labelColor = onDark && isTransparent(variant) ? color.amber : LABEL_COLOR[variant];

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        { height, borderRadius: buttonRadius },
        surfaceFor(variant, pressed, onDark),
        style,
      ]}
    >
      <View style={styles.center}>
        <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const isTransparent = (variant: ButtonVariant) =>
  variant === 'outlined' || variant === 'tertiary';

function surfaceFor(variant: ButtonVariant, pressed: boolean, onDark: boolean): ViewStyle {
  const filled = FILL[variant];
  if (filled) {
    return { backgroundColor: pressed ? filled.pressed : filled.rest };
  }

  const pressedBackground = onDark ? TRANSPARENT_PRESSED.dark : TRANSPARENT_PRESSED.light;
  const background = pressed ? pressedBackground : 'transparent';

  if (variant === 'outlined') {
    return {
      backgroundColor: background,
      borderWidth: 1.5,
      borderColor: onDark ? color.amber : color.border,
    };
  }

  return { backgroundColor: background };
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    // Fixed-height controls must not be crushed inside scrolling columns.
    flexShrink: 0,
  },
  center: { justifyContent: 'center', alignItems: 'center' },
  label: { ...type.bodyLarge, fontWeight: '700' },
});
