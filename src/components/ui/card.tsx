import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { color, radius, space } from '@/theme';

export type CardTone = 'white' | 'tonal' | 'success' | 'warning' | 'navy';

const TONE: Record<CardTone, string> = {
  white: color.card,
  tonal: color.surfaceAlt,
  success: color.successBg,
  warning: color.warningBg,
  navy: color.navy,
};

type Props = {
  children: ReactNode;
  tone?: CardTone;
  style?: ViewStyle;
  testID?: string;
};

/** Radius 16 throughout — the handoff's most-used card shape (33 uses). */
export function Card({ children, tone = 'white', style, testID }: Props) {
  return (
    <View testID={testID} style={[styles.card, { backgroundColor: TONE[tone] }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: space.lg,
    flexShrink: 0,
  },
});
