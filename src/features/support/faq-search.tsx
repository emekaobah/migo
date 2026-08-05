import { StyleSheet, TextInput, View } from 'react-native';

import { color, radius, space, type } from '@/theme';

type Props = Readonly<{
  value: string;
  onChange: (next: string) => void;
}>;

/**
 * The 52px search field on `help` (HANDOFF §18).
 *
 * A real keyboard, unlike every other input in this product. The custom keypad
 * exists because phone numbers, codes and PINs are digits typed under pressure;
 * searching prose is the one place the system keyboard is the right tool.
 */
export function FaqSearch({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Search help"
        placeholderTextColor={color.textMuted}
        style={styles.input}
        accessibilityLabel="Search help"
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexShrink: 0 },
  input: {
    height: 52,
    borderRadius: radius.row,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: space.lg,
    ...type.body,
  },
});
