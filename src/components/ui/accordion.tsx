import { Pressable, StyleSheet, Text, View } from 'react-native';

import { color, control, space, type } from '@/theme';

export type AccordionItem = {
  key: string;
  question: string;
  answer: string[];
};

type Props = Readonly<{
  items: AccordionItem[];
  /** The single open key, or null. Single-open by design. */
  openKey: string | null;
  onToggle: (key: string) => void;
}>;

/**
 * FAQ accordion — single-open.
 *
 * Open state is lifted rather than held per-row so only one answer can be open
 * at a time, and so the FAQ screen can open a specific question when arriving
 * from search.
 */
export function Accordion({ items, openKey, onToggle }: Props) {
  return (
    <View>
      {items.map((item) => {
        const open = item.key === openKey;

        return (
          <View key={item.key} style={styles.item}>
            <Pressable
              onPress={() => onToggle(item.key)}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              accessibilityLabel={item.question}
              style={({ pressed }) => [styles.header, pressed && styles.pressed]}
            >
              <Text style={styles.question}>{item.question}</Text>
              <Text style={styles.indicator}>{open ? '−' : '+'}</Text>
            </Pressable>

            {open ? (
              <View style={styles.answer}>
                {item.answer.map((paragraph, i) => (
                  // Composite key: `item.key` is stable and unique, so this is
                  // not a bare array index — and unlike keying on the text, it
                  // survives an answer that repeats a paragraph verbatim.
                  <Text key={`${item.key}-${i}`} style={styles.paragraph}>
                    {paragraph}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    borderBottomWidth: 1,
    borderBottomColor: color.divider,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: control.tap,
    paddingVertical: space.md,
  },
  pressed: { backgroundColor: color.cardPressed },
  question: { ...type.body, fontWeight: '600', flex: 1 },
  indicator: { fontSize: 20, color: color.textMuted, width: 20, textAlign: 'center' },
  answer: { paddingBottom: space.lg, gap: space.sm },
  paragraph: { ...type.body, color: color.textSecondary, lineHeight: 22 },
});
