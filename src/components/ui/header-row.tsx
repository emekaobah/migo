import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePlatform } from '@/state/use-platform';
import { color, control, space, type } from '@/theme';

import { BrandMark } from './brand-mark';

type Props = Readonly<
  | { variant: 'brand'; onHelp: () => void }
  | { variant: 'back'; title?: string; onBack: () => void }
  | { variant: 'step'; step: string; onHelp: () => void }
>;

/**
 * The three header shapes in the design.
 *
 * On Android the in-screen back chevron is omitted on primary screens — the
 * system gesture is the back affordance there, and duplicating it is the kind
 * of platform mismatch the handoff calls out.
 */
export function HeaderRow(props: Props) {
  const { showsInScreenBack } = usePlatform();

  if (props.variant === 'back') {
    return (
      <View style={styles.row}>
        {showsInScreenBack ? (
          <Pressable
            onPress={props.onBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.back}
          >
            <Text style={styles.chevron}>‹</Text>
          </Pressable>
        ) : null}
        {props.title ? <Text style={styles.title}>{props.title}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {props.variant === 'brand' ? <BrandMark /> : <Text style={styles.step}>{props.step}</Text>}
      <View style={styles.spacer} />
      <Pressable
        onPress={props.onHelp}
        accessibilityRole="button"
        accessibilityLabel="Help"
        style={styles.help}
      >
        <Text style={styles.helpLabel}>Help</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: control.tap,
    gap: space.md,
    flexShrink: 0,
  },
  spacer: { flex: 1 },
  back: {
    minWidth: control.tap,
    minHeight: control.tap,
    justifyContent: 'center',
    // View defaults to alignItems: 'stretch', which left-aligns the glyph
    // inside the 48px target instead of centring it.
    alignItems: 'center',
  },
  chevron: { fontSize: 30, color: color.navy },
  title: { ...type.bodyLarge, fontWeight: '700' },
  step: { ...type.caption, color: color.textMuted },
  help: {
    minHeight: control.tap,
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  helpLabel: { ...type.body, color: color.amber, fontWeight: '600' },
});
