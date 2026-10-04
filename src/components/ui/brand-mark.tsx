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
 *
 * The launcher icon and splash logo in `assets/images/` are rendered from this
 * same wordmark by `scripts/generate-brand-assets.py`, so the home screen and
 * the app agree. Re-run it after the vector lands.
 *
 * The box hugs the glyphs rather than reserving the logo's 98:43 footprint.
 * Reserving it left the stand-in adrift: the type is narrower than 98:43, so a
 * left-aligned word inside a wider box read as centred in the header — where a
 * spacer swallows the slack — but sat visibly left of centre on `loading`,
 * which centres the box, not the ink. `contain` will centre the real image
 * inside the ratio box on its own, so the swap re-reserves the width for free.
 */
export function BrandMark({ height = 26 }: Readonly<{ height?: number }>) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Migo"
      style={[styles.mark, { height }]}
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
