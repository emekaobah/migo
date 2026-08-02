import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { color, control, radius, space, type } from '@/theme';

/**
 * Selected controls invert to navy; unselected sit on their own surface.
 * Expressed as a table so the components stop nesting ternaries per style prop.
 */
const SELECTION_FILL = {
  selected: { rest: color.navy, pressed: color.navyPressed },
  tonal: { rest: color.surfaceAlt, pressed: color.surfaceAltPressed },
  card: { rest: color.card, pressed: color.cardPressed },
} as const;

const fillFor = (palette: { rest: string; pressed: string }, pressed: boolean) =>
  pressed ? palette.pressed : palette.rest;

type PillProps = Readonly<{
  label: string;
  sub?: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}>;

/** Tenor pills on `offers` — a 4-column grid of duration choices. */
export function Pill({ label, sub, selected, onPress, style }: PillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={sub ? `${label}, ${sub}` : label}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: fillFor(selected ? SELECTION_FILL.selected : SELECTION_FILL.tonal, pressed) },
        style,
      ]}
    >
      <Text style={[styles.label, { color: selected ? color.card : color.text }]}>{label}</Text>
      {sub ? (
        <Text style={[styles.sub, { color: selected ? color.amber : color.textMutedAlt }]}>{sub}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.pill,
    paddingVertical: 11,
    paddingHorizontal: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: control.tap,
    flexShrink: 0,
  },
  label: { fontSize: 15, fontWeight: '700' },
  sub: { fontSize: 12, fontWeight: '500' },
});

type ChipProps = Readonly<{
  label: string;
  onPress: () => void;
}>;

/**
 * Quick-reply chips in support chat. 48px tall — the accessibility audit calls
 * these out specifically, since chips are easy to under-size.
 */
export function Chip({ label, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        chipStyles.chip,
        { backgroundColor: fillFor(SELECTION_FILL.card, pressed) },
      ]}
    >
      <Text style={chipStyles.label}>{label}</Text>
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    minHeight: control.tap,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: color.border,
    flexShrink: 0,
  },
  label: { ...type.body, color: color.navy, fontWeight: '600' },
});

/** Selection row with a radio — never colour alone. */
export function RadioRow({
  label,
  sub,
  right,
  selected,
  onPress,
}: Readonly<{
  label: string;
  sub?: string;
  right?: React.ReactNode;
  selected: boolean;
  onPress: () => void;
}>) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        radioStyles.row,
        { backgroundColor: fillFor(selected ? SELECTION_FILL.selected : SELECTION_FILL.card, pressed) },
      ]}
    >
      <View
        style={[
          radioStyles.radio,
          { borderColor: selected ? color.amber : color.textMuted },
        ]}
      >
        {selected ? <View style={radioStyles.radioDot} /> : null}
      </View>

      <View style={radioStyles.text}>
        <Text style={[radioStyles.label, { color: selected ? color.card : color.text }]}>{label}</Text>
        {sub ? (
          <Text style={[radioStyles.sub, { color: selected ? color.amber : color.textMuted }]}>{sub}</Text>
        ) : null}
      </View>

      {right}
    </Pressable>
  );
}

const radioStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: control.tap + space.md,
    padding: space.lg,
    borderRadius: radius.row,
    flexShrink: 0,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: color.amber,
  },
  text: { flex: 1 },
  label: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  sub: { ...type.caption },
});
