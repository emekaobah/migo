import { Pressable, StyleSheet, Text, View } from 'react-native';

import { color, control, onNavy, radius, space, type } from '@/theme';

type Props = Readonly<{ onPress: () => void }>;

/**
 * The chat entry on `help` — **first on the screen**, above search (HANDOFF §18).
 *
 * The order is the point. Someone opening Help is often stuck rather than
 * curious, and putting a person above a search box is what makes that a
 * one-tap escape instead of a hunt through ten sections.
 */
export function ChatCard({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Chat with support, replies in about two minutes"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarGlyph}>◍</Text>
      </View>

      <View style={styles.text}>
        <Text style={styles.title}>Chat with support</Text>
        <Text style={styles.hours}>Every day, 8am – 8pm · replies in ~2 min</Text>
      </View>

      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    backgroundColor: color.navy,
    borderRadius: radius.card,
    padding: space.xl,
    minHeight: control.tap,
    flexShrink: 0,
  },
  pressed: { backgroundColor: color.navyPressed },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.amber,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarGlyph: { fontSize: 22, color: color.navy },
  text: { flex: 1 },
  title: { ...type.bodyLarge, color: color.card },
  hours: { ...type.caption, color: onNavy.caption, marginTop: space.xs / 2 },
  arrow: { fontSize: 26, color: color.amber },
});
