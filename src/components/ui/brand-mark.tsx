import { StyleSheet, Text, View } from 'react-native';

import { color } from '@/theme';

/**
 * The Migo brand mark.
 *
 * **Placeholder.** The design calls for `migo-logo-white.png` (98×43, white on
 * transparent, client-supplied), rendered at 26px in headers and 32px on
 * `loading`, `contain`, never stretched. That file is not in this repo and the
 * vector original is still outstanding — OPEN-QUESTIONS #5.
 *
 * A wordmark drawn in type is deliberate: shipping an invented logo would be
 * worse than an obvious stand-in. When the asset lands, swap the body of this
 * component for an `expo-image` at the same 98:43 ratio; nothing else changes,
 * because every screen goes through here.
 */
export function BrandMark({ height = 26 }: { height?: number }) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Migo"
      style={[styles.mark, { height, width: height * (98 / 43) }]}
    >
      <Text style={[styles.word, { fontSize: height * 0.62 }]} numberOfLines={1}>
        migo
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    justifyContent: 'center',
    flexShrink: 0,
  },
  word: {
    color: color.card,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});
