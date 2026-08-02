import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { buttonRadius, color, control, type } from '@/theme';

export type ButtonVariant =
  | 'primary-amber'
  | 'primary-navy'
  | 'tonal'
  | 'outlined'
  | 'destructive'
  | 'tertiary';

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** 52px instead of 56px, for buttons sitting inside cards. */
  small?: boolean;
  /** Outlined and tertiary buttons sit on navy as often as on white. */
  onDark?: boolean;
  style?: ViewStyle;
  testID?: string;
};

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

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        { height, borderRadius: buttonRadius },
        fill(variant, pressed, onDark),
        style,
      ]}
    >
      <View style={styles.center}>
        <Text style={[styles.label, labelColor(variant, onDark)]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function fill(variant: ButtonVariant, pressed: boolean, onDark: boolean): ViewStyle {
  switch (variant) {
    case 'primary-amber':
      return { backgroundColor: pressed ? color.amberPressed : color.amber };
    case 'primary-navy':
      return { backgroundColor: pressed ? color.navyPressed : color.navy };
    case 'tonal':
      return { backgroundColor: pressed ? color.surfaceAltPressed : color.surfaceAlt };
    case 'destructive':
      return { backgroundColor: pressed ? color.dangerPressed : color.danger };
    case 'outlined':
      return {
        borderWidth: 1.5,
        borderColor: onDark ? color.amber : color.border,
        backgroundColor: pressed ? (onDark ? color.navyPressed : color.cardPressed) : 'transparent',
      };
    case 'tertiary':
      return {
        backgroundColor: pressed ? (onDark ? color.navyPressed : color.cardPressed) : 'transparent',
      };
  }
}

function labelColor(variant: ButtonVariant, onDark: boolean) {
  switch (variant) {
    case 'primary-amber':
      return { color: color.navy };
    case 'primary-navy':
    case 'destructive':
      return { color: color.card };
    case 'tonal':
      return { color: color.navy };
    case 'outlined':
    case 'tertiary':
      return { color: onDark ? color.amber : color.navy };
  }
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
