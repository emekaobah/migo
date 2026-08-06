import { StyleSheet, Text, View } from 'react-native';

import { color, radius, space, type } from '@/theme';

/**
 * The inert composer (HANDOFF §20).
 *
 * Deliberately not a text input. The conversation is scripted, so a field that
 * accepted typing would invite a borrower to write something the agent cannot
 * answer — and the honest note is better than a box that swallows what you say.
 * Replaced wholesale by Mobilisten's own composer if this is commissioned.
 */
export function Composer() {
  return (
    <View style={styles.bar} accessible accessibilityLabel="Typing is disabled in this preview">
      <View style={styles.field}>
        <Text style={styles.note}>Typing is disabled — use the replies above</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingTop: space.md, flexShrink: 0 },
  field: {
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceAlt,
    paddingHorizontal: space.lg,
  },
  note: { ...type.caption },
});
