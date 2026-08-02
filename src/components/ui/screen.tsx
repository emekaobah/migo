import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { color, space } from '@/theme';

export type Surface = 'navy' | 'surface' | 'ink' | 'success' | 'card';

const BACKGROUND: Record<Surface, string> = {
  navy: color.navy,
  surface: color.surface,
  ink: color.ink,
  success: color.success,
  card: color.card,
};

/** Surfaces that carry light content, so the status bar must go light. */
export const isDarkSurface = (surface: Surface) =>
  surface === 'navy' || surface === 'ink' || surface === 'success';

type Props = Readonly<{
  surface: Surface;
  children: ReactNode;
  /** Wrap children in a ScrollView. Off by default — most screens are fixed. */
  scroll?: boolean;
  /** Screen padding. The handoff uses 20–24px sides, 10–12px bottom. */
  padded?: boolean;
  edges?: readonly Edge[];
  style?: StyleProp<ViewStyle>;
}>;

/**
 * Full-bleed screen surface.
 *
 * Fixed-height controls inside a scrolling column need `flexShrink: 0` — the
 * handoff notes several were being crushed before that was applied, so the
 * scroll container never flexes its children.
 */
export function Screen({
  surface,
  children,
  scroll = false,
  padded = true,
  edges = ['top', 'bottom'],
  style,
}: Props) {
  const background = { backgroundColor: BACKGROUND[surface] };
  const inner = [padded && styles.padded, style];

  return (
    <SafeAreaView style={[styles.flex, background]} edges={edges}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, inner]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, inner]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: {
    paddingHorizontal: space.xxl - space.xs, // 20
    paddingBottom: space.md,
  },
  scrollContent: { flexGrow: 1 },
});
