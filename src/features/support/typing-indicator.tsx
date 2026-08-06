import { StyleSheet, Text, View } from 'react-native';

import { color, radius, space, type } from '@/theme';

/**
 * Three dots in a white bubble (HANDOFF §20).
 *
 * Carries an accessibility label because the dots are the only signal that the
 * agent is answering — a screen reader user would otherwise sit in silence for
 * the 1.6s and conclude nothing happened.
 */
export function TypingIndicator() {
  return (
    <View
      style={styles.bubble}
      accessible
      accessibilityLabel="Support is typing"
      testID="typing-indicator"
    >
      <Text style={styles.dots}>• • •</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignSelf: 'flex-start',
    backgroundColor: color.card,
    borderRadius: radius.card,
    borderBottomLeftRadius: radius.tail,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    flexShrink: 0,
  },
  dots: { ...type.body, color: color.textMuted, letterSpacing: 2 },
});
