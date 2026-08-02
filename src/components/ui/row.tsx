import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { color, control, radius, space, type } from '@/theme';

type RowProps = Readonly<{
  label: string;
  value?: string;
  sub?: string;
  onPress?: () => void;
  /** Chevron on tappable rows. */
  chevron?: boolean;
  divider?: boolean;
  destructive?: boolean;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}>;

/**
 * Tappable list row. 48px minimum, like everything else that takes a touch —
 * the audit found back rows and chips were the usual offenders.
 */
export function Row({
  label,
  value,
  sub,
  onPress,
  chevron = false,
  divider = false,
  destructive = false,
  right,
  style,
}: RowProps) {
  const content = (
    <>
      <View style={styles.text}>
        <Text style={[styles.label, destructive && styles.destructive]}>{label}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {right}
      {chevron ? <Text style={styles.chevron}>›</Text> : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, divider && styles.divider, style]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={({ pressed }) => [
        styles.row,
        divider && styles.divider,
        pressed && styles.pressed,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: control.tap,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.row,
    backgroundColor: color.card,
    flexShrink: 0,
  },
  pressed: { backgroundColor: color.cardPressed },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: color.divider,
    borderRadius: 0,
  },
  text: { flex: 1 },
  label: { ...type.body, fontWeight: '600' },
  destructive: { color: color.danger },
  sub: { ...type.caption },
  value: { ...type.body, color: color.textMuted, fontVariant: ['tabular-nums'] },
  chevron: { fontSize: 22, color: color.textMuted },
});
